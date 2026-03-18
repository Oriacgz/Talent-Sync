# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Explains a match score using SHAP or proportional fallback.
#                 explain_match() takes feature dict and total score,
#                 returns each feature's contribution as a dict.
#                 When trained model (hybrid_scorer_v1.pkl) exists, uses
#                 shap.TreeExplainer for real SHAP values.
# DEPENDS ON: shap (when model is trained), numpy

def explain_match(features: dict, total_score: float) -> dict:
    pass
    # TODO: proportional fallback first
    # TODO: swap to shap.TreeExplainer when pkl exists