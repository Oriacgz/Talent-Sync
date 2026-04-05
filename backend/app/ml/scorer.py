"""
backend/app/ml/scorer.py
Loads trained XGBoost model and scores student-job pairs.
Falls back to similarity-only scoring when model is absent.

Feature contract (must match train_scorer.py SAFE_FEATURES):
    semantic_score, academic_score, preference_score, experience_score,
    skill_gap_score, cgpa_normalized, experience_months,
    certification_bonus, backlog_penalty, github_activity_score,
    sbert_similarity
"""

from __future__ import annotations

from pathlib import Path

import logging
import json
import joblib
import numpy as np

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
logger = logging.getLogger(__name__)

# These MUST match the training feature order exactly.
# Loaded dynamically when the model file is present.
_DEFAULT_FEATURES = [
    # Semantic signals
    "sbert_similarity",
    "semantic_score",
    "skill_overlap_ratio",
    
    # Academic / Eligibility
    "cgpa_normalized",
    "cgpa_meets_threshold",
    "backlog_penalty",
    "branch_eligible",
    
    # Experience signals
    "experience_score",
    "experience_months",
    "experience_gap",
    
    # Preference signals
    "preference_score",
    "location_match",
    "domain_match",
    
    # Profile quality signals
    "skill_gap_score",
    "profile_completeness",
]

# Weight: 70% semantic similarity + 30% ML model score
SIMILARITY_WEIGHT = 0.7
ML_WEIGHT = 0.3


class MatchScorer:

    def __init__(self) -> None:
        self._model = None
        self._scaler = None
        self._model_available: bool | None = None
        self._feature_names: list[str] = _DEFAULT_FEATURES

    @property
    def has_model(self) -> bool:
        """Check if the trained model file exists."""
        if self._model_available is None:
            # Try .pkl first (new), fall back to .joblib (legacy)
            self._model_available = (
                (ARTIFACTS_DIR / "scorer_model.pkl").exists()
                or (ARTIFACTS_DIR / "scorer_model.joblib").exists()
            )
            if not self._model_available:
                logger.warning(
                    "Scorer model not found at %s. "
                    "Using similarity-only fallback. "
                    "Run: python -m scripts.train_scorer to train the model.",
                    ARTIFACTS_DIR,
                )
        return self._model_available

    @property
    def model(self):
        if self._model is None:
            # Try .pkl first, fall back to .joblib
            pkl_path = ARTIFACTS_DIR / "scorer_model.pkl"
            joblib_path = ARTIFACTS_DIR / "scorer_model.joblib"
            model_path = pkl_path if pkl_path.exists() else joblib_path

            scaler_path = ARTIFACTS_DIR / "feature_scaler.pkl"

            if not model_path.exists():
                return None
                
            try:
                self._model = joblib.load(model_path)
                
                if scaler_path.exists():
                    self._scaler = joblib.load(scaler_path)
                    
                self._model_available = True

                # Load feature names if available
                fn_path = ARTIFACTS_DIR / "feature_names.json"
                if fn_path.exists():
                    self._feature_names = json.loads(fn_path.read_text())
            except Exception as e:
                logger.error("Failed to load ML artifacts (corrupted files). Falling back to similarity. Error: %s", e)
                self._model = None
                self._scaler = None
                self._model_available = False
                
        return self._model
        
    @property
    def scaler(self):
        if self._scaler is None:
            self.model  # Trigger loading
        return self._scaler

    # ── Feature builder ───────────────────────────────────────────────────────

    def build_features(
        self,
        student: dict,
        job: dict,
        similarity: float,
    ) -> np.ndarray:
        """Build feature vector matching the trained model's SAFE_FEATURES order."""

        # --- skill_overlap_ratio & skill_gap_score ---
        s_skills = set(s.lower() for s in (student.get("skills") or []))
        j_skills = set(s.lower() for s in (job.get("skills") or job.get("required_skills") or []))
        overlap = s_skills & j_skills
        skill_gap = len(overlap) / max(len(j_skills), 1)
        skill_overlap_ratio = skill_gap

        # --- preference_score ---
        preferred_roles = [r.lower() for r in (student.get("preferredRoles") or student.get("preferred_roles") or [])]
        job_title = (job.get("title") or job.get("role_title") or "").lower()
        role_match = float(any(role in job_title or job_title in role for role in preferred_roles))

        pref_locs = [l.lower() for l in (student.get("preferredLocations") or student.get("preferred_locations") or [])]
        job_loc = (job.get("location") or "").lower()
        if not job_loc: location_match = 1.0
        elif job_loc in pref_locs: location_match = 1.0
        elif "remote" in [l.lower() for l in pref_locs]: location_match = 0.5
        else: location_match = 0.0
        pref_score = (role_match + location_match) / 2.0

        # --- domain_match ---
        def extract_domain(title_str):
            t = str(title_str).lower()
            if "frontend" in t or "react" in t: return "frontend"
            if "backend" in t: return "backend"
            if "data" in t or "ml" in t: return "data"
            if "devops" in t: return "devops"
            return "general"
        
        job_domain = extract_domain(job_title)
        student_domain_roles = " ".join(preferred_roles)
        student_domain = extract_domain(student_domain_roles)
        domain_match = float(job_domain == student_domain)

        # --- academic_score & cgpa ---
        cgpa = float(student.get("cgpa") or student.get("gpa") or 0)
        min_cgpa = float(job.get("minCgpa") or job.get("min_cgpa") or job.get("min_gpa") or 0)
        cgpa_meets_threshold = float(cgpa >= min_cgpa)
        cgpa_normalized = cgpa / 10.0

        backlogs = int(student.get("backlogs") or 0)
        backlog_penalty = float(backlogs * 0.1)  # simple fallback if not in dict
        
        # Branch eligibility
        s_branch = str(student.get("branch") or "").lower()
        eligible_branches = job.get("eligibleBranches") or job.get("eligible_branches") or []
        if isinstance(eligible_branches, str):
            eligible_branches = [eligible_branches]
        if not eligible_branches:
            branch_eligible = 1.0
        else:
            eb_lower = " ".join([str(b).lower() for b in eligible_branches])
            branch_eligible = 1.0 if s_branch in eb_lower else 0.0

        # --- experience ---
        s_exp_months = float(student.get("experience_months") or 0)
        req_exp = float(job.get("requiredExperienceMonths") or job.get("required_experience_months") or 0)
        exp_score = 1.0 if s_exp_months >= req_exp else (s_exp_months / max(req_exp, 1))
        experience_gap = max(0.0, req_exp - s_exp_months) / max(req_exp, 1.0)
        
        # --- profile completeness ---
        completeness_points = 0
        if student.get("bio"): completeness_points += 1
        if student.get("resume"): completeness_points += 1
        if student.get("github"): completeness_points += 1
        if student.get("linkedin"): completeness_points += 1
        if len(s_skills) >= 3: completeness_points += 1
        if cgpa > 0: completeness_points += 1
        profile_completeness = completeness_points / 6.0

        # Build in EXACT feature order:
        features = np.array(
            [
                float(similarity),      # sbert_similarity
                float(similarity),      # semantic_score (can map directly in fallback)
                skill_overlap_ratio,    # skill_overlap_ratio
                
                cgpa_normalized,        # cgpa_normalized
                cgpa_meets_threshold,   # cgpa_meets_threshold
                backlog_penalty,        # backlog_penalty
                branch_eligible,        # branch_eligible
                
                exp_score,              # experience_score
                s_exp_months,           # experience_months
                experience_gap,         # experience_gap
                
                pref_score,             # preference_score
                location_match,         # location_match
                domain_match,           # domain_match
                
                skill_gap,              # skill_gap_score
                profile_completeness,   # profile_completeness
            ],
            dtype=np.float32,
        )
        return features

    # ── Scoring ───────────────────────────────────────────────────────────────

    def score(
        self,
        student: dict,
        job: dict,
        similarity: float,
    ) -> float:
        """Score one student-job pair. Returns final_score 0–1."""
        if not self.has_model or self.model is None:
            # Fallback: use pure cosine similarity
            return round(min(max(similarity, 0.0), 1.0), 4)

        features = self.build_features(student, job, similarity)
        
        # Ensure scaling if scaler exists
        if self.scaler is not None:
            features_scaled = self.scaler.transform([features])
        else:
            features_scaled = [features]
            
        ml_score = float(self.model.predict_proba(features_scaled)[0][1])
        final = SIMILARITY_WEIGHT * similarity + ML_WEIGHT * ml_score
        return round(min(max(final, 0.0), 1.0), 4)

    def score_batch(
        self,
        student: dict,
        jobs: list[dict],
        similarities: list[float],
    ) -> list[float]:
        """Score one student against multiple jobs efficiently."""
        if not jobs:
            return []

        if not self.has_model or self.model is None:
            # Fallback: use pure cosine similarity
            return [round(min(max(s, 0.0), 1.0), 4) for s in similarities]

        feature_matrix = np.array(
            [
                self.build_features(student, job, sim)
                for job, sim in zip(jobs, similarities)
            ],
            dtype=np.float32,
        )
        
        # Ensure scaling
        if self.scaler is not None:
            feature_matrix = self.scaler.transform(feature_matrix)
            
        ml_scores = self.model.predict_proba(feature_matrix)[:, 1]
        finals = [
            round(min(max(SIMILARITY_WEIGHT * sim + ML_WEIGHT * float(ml), 0.0), 1.0), 4)
            for sim, ml in zip(similarities, ml_scores)
        ]
        return finals