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
import xgboost as xgb

from app.ml.feature_builder import build_features, SAFE_FEATURES

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
logger = logging.getLogger(__name__)

# These MUST match the training feature order exactly.
# Loaded dynamically when the model file is present.
_DEFAULT_FEATURES = SAFE_FEATURES

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
        """Build feature vector using shared Feature Builder."""
        return build_features(student, job, similarity)

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

        features = self.build_features(student, job, similarity).reshape(1, -1)
        
        # Ensure scaling if scaler exists
        if self.scaler is not None:
            features = self.scaler.transform(features)
            
        ml_score = float(self.model.predict_proba(features)[0][1])
        final = SIMILARITY_WEIGHT * similarity + ML_WEIGHT * ml_score
        return round(min(max(final, 0.0), 1.0), 4)

    def score_batch(
        self,
        student: dict,
        jobs: list[dict],
        similarities: list[float],
    ) -> tuple[list[float], list[float]]:
        """Score batch of jobs. Returns (final_scores, ml_scores)."""
        if not self.has_model or self.model is None or not jobs:
            final_scores = [round(min(max(sim, 0.0), 1.0), 4) for sim in similarities]
            return final_scores, [0.0] * len(jobs)

        # Assemble numpy matrix
        feature_matrix = np.array([
            self.build_features(student, j, sim)
            for j, sim in zip(jobs, similarities)
        ], dtype=np.float32)

        # Ensure scaling
        if self.scaler is not None:
            feature_matrix = self.scaler.transform(feature_matrix)
            
        ml_scores = self.model.predict_proba(feature_matrix)[:, 1]

        final_scores = []
        for i, ml_score in enumerate(ml_scores):
            f_score = (SIMILARITY_WEIGHT * similarities[i]) + (ML_WEIGHT * float(ml_score))
            final_scores.append(round(min(max(f_score, 0.0), 1.0), 4))

        return final_scores, ml_scores.tolist()