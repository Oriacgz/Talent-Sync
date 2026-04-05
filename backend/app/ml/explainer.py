"""
backend/app/ml/explainer.py
SHAP-based explanation of why a student matched a job.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import shap

from app.ml.scorer import MatchScorer, FEATURE_NAMES, SIMILARITY_WEIGHT, ML_WEIGHT

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"

# Human-readable templates for each feature
_FEATURE_TEMPLATES = {
    "cosine_similarity": {
        "positive": "Your profile is semantically similar to this job description",
        "negative": "Your profile text is not a strong semantic match for this job",
    },
    "skill_overlap_count": {
        "positive": "You have several skills that directly match the job requirements",
        "negative": "Few of your skills overlap with the required skills for this job",
    },
    "skill_overlap_ratio": {
        "positive": "A high proportion of your skills align with what this job needs",
        "negative": "Most of the required skills are not yet in your profile",
    },
    "cgpa_meets_requirement": {
        "positive": "Your CGPA meets or exceeds the minimum requirement",
        "negative": "Your CGPA is below the minimum required for this job",
    },
    "branch_eligible": {
        "positive": "Your branch/degree is eligible for this job",
        "negative": "Your branch may not meet the eligibility criteria for this role",
    },
    "experience_match": {
        "positive": "Your experience level matches what this job is looking for",
        "negative": "Your experience level doesn't match the job's requirement",
    },
    "role_match": {
        "positive": "This role aligns with your preferred job types",
        "negative": "This role differs from your stated preferred roles",
    },
    "location_match": {
        "positive": "This job is in one of your preferred locations",
        "negative": "This job's location doesn't match your preferences",
    },
    "education_match": {
        "positive": "Your educational background meets the job's requirement",
        "negative": "Your education level may not fully match the job requirement",
    },
}


class MatchExplainer:

    def __init__(self) -> None:
        self._explainer = None
        self._scorer = MatchScorer()

    @property
    def explainer(self) -> shap.TreeExplainer | None:
        if self._explainer is None:
            model = self._scorer.model
            if model is None:
                return None
            self._explainer = shap.TreeExplainer(model)
        return self._explainer

    def _to_human_readable(self, feature: str, shap_val: float) -> str:
        templates = _FEATURE_TEMPLATES.get(feature, {})
        direction = "positive" if shap_val > 0 else "negative"
        return templates.get(direction, f"{feature}: {'boosted' if shap_val > 0 else 'reduced'} your score")

    def _fallback_explain(self, student: dict, job: dict, similarity: float) -> dict:
        """Feature-based explanation without SHAP when model is unavailable."""
        features = self._scorer.build_features(student, job, similarity)
        # Use raw feature values as pseudo-importance
        shap_dict = {
            name: round(float(val), 4)
            for name, val in zip(FEATURE_NAMES, features)
        }
        sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reasons = [
            self._to_human_readable(feat, val)
            for feat, val in sorted_features[:3]
        ]
        return {
            "shap_values": shap_dict,
            "top_reasons": top_reasons,
            "score_breakdown": {
                "similarity_score": round(float(similarity), 4),
                "ml_score": 0.0,
                "final_score": round(float(similarity), 4),
            },
        }

    def explain(
        self,
        student: dict,
        job: dict,
        similarity: float,
    ) -> dict:
        """
        Returns:
          shap_values: { feature_name: shap_value }
          top_reasons: list of 3 human-readable strings
          score_breakdown: { similarity_score, ml_score, final_score }
        """
        if not self._scorer.has_model or self.explainer is None:
            return self._fallback_explain(student, job, similarity)

        features = self._scorer.build_features(student, job, similarity)
        features_2d = features.reshape(1, -1)

        # SHAP values for positive class
        shap_values = self.explainer.shap_values(features_2d)
        # For XGBClassifier: shap_values is array of shape (1, n_features)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]   # binary: index 1 = positive class
        else:
            sv = shap_values[0]

        shap_dict = {
            name: round(float(val), 4)
            for name, val in zip(FEATURE_NAMES, sv)
        }

        # Sort by absolute contribution
        sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reasons = [
            self._to_human_readable(feat, val)
            for feat, val in sorted_features[:3]
        ]

        # Score breakdown
        ml_score = float(self._scorer.model.predict_proba(features_2d)[0][1])
        final_score = round(SIMILARITY_WEIGHT * similarity + ML_WEIGHT * ml_score, 4)

        return {
            "shap_values": shap_dict,
            "top_reasons": top_reasons,
            "score_breakdown": {
                "similarity_score": round(float(similarity), 4),
                "ml_score": round(ml_score, 4),
                "final_score": final_score,
            },
        }