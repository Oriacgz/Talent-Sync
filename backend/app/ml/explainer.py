"""
backend/app/ml/explainer.py
SHAP-based explanation of why a student matched a job.

Uses the singleton scorer from app.ml to avoid duplicate model loads.
"""

from __future__ import annotations

import logging

import numpy as np
import shap

from app.ml.scorer import SIMILARITY_WEIGHT, ML_WEIGHT

logger = logging.getLogger(__name__)

# Human-readable templates for each feature.
# MUST match scorer.py _DEFAULT_FEATURES exactly.
_FEATURE_TEMPLATES = {
    "sbert_similarity": {
        "positive": "Your profile deeply aligns with this job posting",
        "negative": "Your profile and this job posting are conceptually distant",
    },
    "semantic_score": {
        "positive": "Your profile is semantically similar to this job description",
        "negative": "Your profile text is not a strong semantic match for this job",
    },
    "skill_overlap_ratio": {
        "positive": "A high proportion of your skills match the job requirements",
        "negative": "Your skill set has limited overlap with the required skills",
    },
    "cgpa_normalized": {
        "positive": "Your GPA is competitive for this position",
        "negative": "Your GPA is below the typical range for this role",
    },
    "cgpa_meets_threshold": {
        "positive": "Your GPA meets or exceeds the job's minimum requirement",
        "negative": "Your GPA is below the job's minimum threshold",
    },
    "backlog_penalty": {
        "positive": "Your clean academic record is a plus",
        "negative": "Academic backlogs may impact your candidacy",
    },
    "branch_eligible": {
        "positive": "Your branch/major is eligible for this position",
        "negative": "Your branch/major may not be in the eligible list for this role",
    },
    "experience_score": {
        "positive": "Your experience level matches what this job is looking for",
        "negative": "Your experience level doesn't match the job's requirement",
    },
    "experience_months": {
        "positive": "You have substantial practical experience",
        "negative": "You have limited practical experience for this role",
    },
    "experience_gap": {
        "positive": "You meet or exceed the required experience duration",
        "negative": "There is a gap between your experience and what's required",
    },
    "preference_score": {
        "positive": "This role and location align with your preferences",
        "negative": "This role or location differs from your stated preferences",
    },
    "location_match": {
        "positive": "The job location matches your preferred locations",
        "negative": "The job location is outside your preferred areas",
    },
    "domain_match": {
        "positive": "The job domain aligns with your target career area",
        "negative": "The job domain differs from your target career area",
    },
    "skill_gap_score": {
        "positive": "A high proportion of your skills align with what this job needs",
        "negative": "Most of the required skills are not yet in your profile",
    },
    "profile_completeness": {
        "positive": "Your profile is well-filled, giving the matcher more signal",
        "negative": "Completing more profile fields could improve your match accuracy",
    },
}


class MatchExplainer:

    def __init__(self) -> None:
        self._explainer = None
        # Lazy reference to singleton scorer — set on first use
        self._scorer = None

    @property
    def scorer(self):
        """Use the shared singleton scorer from app.ml to avoid duplicate model loads."""
        if self._scorer is None:
            from app.ml import scorer as _singleton_scorer
            self._scorer = _singleton_scorer
        return self._scorer

    @property
    def feature_names(self) -> list[str]:
        """Return the active feature names from the scorer."""
        return self.scorer._feature_names

    @property
    def explainer(self) -> shap.TreeExplainer | None:
        if self._explainer is None:
            model = self.scorer.model
            if model is None:
                return None
            try:
                self._explainer = shap.TreeExplainer(model)
            except Exception:
                logger.warning("Failed to create SHAP TreeExplainer; explanations will use fallback")
                return None
        return self._explainer

    def _to_human_readable(self, feature: str, shap_val: float) -> str:
        templates = _FEATURE_TEMPLATES.get(feature, {})
        direction = "positive" if shap_val > 0 else "negative"
        return templates.get(
            direction,
            f"{feature}: {'boosted' if shap_val > 0 else 'reduced'} your score"
        )

    def _fallback_explain(self, student: dict, job: dict, similarity: float) -> dict:
        """Feature-based explanation without SHAP when model is unavailable."""
        features = self.scorer.build_features(student, job, similarity)
        names = self.feature_names
        # Use raw feature values as pseudo-importance
        shap_dict = {
            name: round(float(val), 4)
            for name, val in zip(names, features)
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
        if not self.scorer.has_model or self.explainer is None:
            return self._fallback_explain(student, job, similarity)

        names = self.feature_names
        features = self.scorer.build_features(student, job, similarity)
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
            for name, val in zip(names, sv)
        }

        # Sort by absolute contribution
        sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reasons = [
            self._to_human_readable(feat, val)
            for feat, val in sorted_features[:3]
        ]

        # Score breakdown
        ml_score = float(self.scorer.model.predict_proba(features_2d)[0][1])
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