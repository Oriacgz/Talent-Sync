# ML pipeline package — encoder, scorer, explainer, fairness


"""
backend/app/ml/__init__.py
Lazy singleton instances for all ML components.

Usage anywhere in the app:
    from app.ml import encoder, scorer, explainer, fairness_auditor
"""

from __future__ import annotations

from app.ml.encoder import ProfileEncoder
from app.ml.scorer import MatchScorer
from app.ml.explainer import MatchExplainer
from app.ml.fairness import FairnessAuditor

# Singletons — instantiated once, reused across requests
encoder = ProfileEncoder()
scorer = MatchScorer()
explainer = MatchExplainer()
fairness_auditor = FairnessAuditor()

__all__ = ["encoder", "scorer", "explainer", "fairness_auditor"]