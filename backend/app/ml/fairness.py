"""
backend/app/ml/fairness.py
Bias audit across branch, experience level, and CGPA buckets.
"""

from __future__ import annotations

import pandas as pd


class FairnessAuditor:
    DISPARITY_THRESHOLD = 0.15  # flag if max group gap > 15%

    def check_bias(self, predictions_df: pd.DataFrame) -> dict:
        """
        Input columns:
          student_id, job_id, final_score,
          branch, experience_level, cgpa (float)
        Returns bias report dict.
        """
        df = predictions_df.copy()
        df["cgpa_bucket"] = pd.cut(
            df["cgpa"],
            bins=[0, 6.5, 7.5, 10.0],
            labels=["low (<6.5)", "mid (6.5–7.5)", "high (>7.5)"],
        )

        def group_stats(col: str) -> dict:
            return (
                df.groupby(col)["final_score"]
                .mean()
                .round(4)
                .to_dict()
            )

        by_branch = group_stats("branch")
        by_experience = group_stats("experience_level")
        by_cgpa = group_stats("cgpa_bucket")

        # Max disparity across all groups
        all_means = (
            list(by_branch.values())
            + list(by_experience.values())
            + list(by_cgpa.values())
        )
        max_disparity = round(max(all_means) - min(all_means), 4) if all_means else 0.0
        flagged = max_disparity > self.DISPARITY_THRESHOLD

        recommendation = (
            "✅ No significant bias detected. Score distribution is reasonably fair."
            if not flagged
            else (
                f"⚠️ Bias detected! Max disparity is {max_disparity:.2%}. "
                "Review feature weights — consider removing branch/education from scoring "
                "or applying fairness constraints during training."
            )
        )

        return {
            "by_branch": by_branch,
            "by_experience": by_experience,
            "by_cgpa_bucket": {str(k): v for k, v in by_cgpa.items()},
            "max_disparity": max_disparity,
            "flagged": flagged,
            "recommendation": recommendation,
        }