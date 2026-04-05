"""
backend/app/ml/scorer.py
Loads trained XGBoost model and scores student-job pairs.
Falls back to similarity-only scoring when model is absent.
"""

from __future__ import annotations

from pathlib import Path

import logging
import joblib
import json
import numpy as np

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "cosine_similarity",
    "skill_overlap_count",
    "skill_overlap_ratio",
    "cgpa_meets_requirement",
    "branch_eligible",
    "experience_match",
    "role_match",
    "location_match",
    "education_match",
]

# Weight: 70% semantic similarity + 30% ML model score
SIMILARITY_WEIGHT = 0.7
ML_WEIGHT = 0.3


class MatchScorer:

    def __init__(self) -> None:
        self._model = None
        self._model_available: bool | None = None
        self._feature_names: list[str] = FEATURE_NAMES

    @property
    def has_model(self) -> bool:
        """Check if the trained model file exists."""
        if self._model_available is None:
            self._model_available = (ARTIFACTS_DIR / "scorer_model.joblib").exists()
            if not self._model_available:
                logger.warning(
                    "Scorer model not found at %s. "
                    "Using similarity-only fallback. "
                    "Run: python -m scripts.train_scorer to train the model.",
                    ARTIFACTS_DIR / "scorer_model.joblib",
                )
        return self._model_available

    @property
    def model(self):
        if self._model is None:
            model_path = ARTIFACTS_DIR / "scorer_model.joblib"
            if not model_path.exists():
                return None
            self._model = joblib.load(model_path)
            self._model_available = True
        return self._model

    # ── Feature builder ───────────────────────────────────────────────────────

    def build_features(
        self,
        student: dict,
        job: dict,
        similarity: float,
    ) -> np.ndarray:
        """Build feature vector. MUST match training feature order."""

        # Normalize skill keys (DB uses camelCase, scripts use snake_case)
        s_skills = set(
            s.lower() for s in (
                student.get("skills") or []
            )
        )
        j_skills = set(
            s.lower() for s in (
                job.get("skills") or job.get("required_skills") or []
            )
        )

        overlap = s_skills & j_skills
        skill_count = float(len(overlap))
        skill_ratio = len(overlap) / max(len(s_skills), 1)

        cgpa = float(student.get("cgpa") or 0)
        min_cgpa = float(job.get("minCgpa") or job.get("min_cgpa") or 0)
        cgpa_ok = float(cgpa >= min_cgpa)

        eligible_branches = (
            job.get("eligibleBranches") or job.get("eligible_branches") or []
        )
        education_req = job.get("education", "Any")
        branch_ok = float(
            education_req == "Any"
            or student.get("branch", "") in eligible_branches
        )

        s_exp = student.get("experienceLevel") or student.get("experience_level") or ""
        j_exp = job.get("experienceLevel") or job.get("experience_level") or ""
        exp_match = float(s_exp == j_exp)

        preferred_roles = [
            r.lower() for r in (student.get("preferredRoles") or student.get("preferred_roles") or [])
        ]
        job_title = (job.get("title") or "").lower()
        role_match = float(
            any(role in job_title or job_title in role for role in preferred_roles)
        )

        pref_locs = [
            l.lower() for l in (
                student.get("preferredLocations") or student.get("preferred_locations") or []
            )
        ]
        job_loc = (job.get("location") or "").lower()
        loc_match = float(job_loc in pref_locs or "remote" in pref_locs)

        s_degree = (student.get("degree") or "").lower()
        edu_match = float(
            education_req == "Any" or s_degree in education_req.lower()
        )

        return np.array(
            [
                float(similarity),
                skill_count,
                skill_ratio,
                cgpa_ok,
                branch_ok,
                exp_match,
                role_match,
                loc_match,
                edu_match,
            ],
            dtype=np.float32,
        )

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
        ml_score = float(self.model.predict_proba([features])[0][1])
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
        ml_scores = self.model.predict_proba(feature_matrix)[:, 1]
        finals = [
            round(min(max(SIMILARITY_WEIGHT * sim + ML_WEIGHT * float(ml), 0.0), 1.0), 4)
            for sim, ml in zip(similarities, ml_scores)
        ]
        return finals