# WHO WRITES THIS: ML developer + Backend developer
# WHAT THIS DOES: Orchestrates the full matching pipeline for a student.
#                 run_matching_for_student() — encodes student profile,
#                 loops over all jobs, computes scores, saves to match_scores table.
#                 get_top_matches() — returns top N matches sorted by hybrid_score.
# DEPENDS ON: ml/encoder.py, ml/scorer.py, ml/explainer.py,
#             StudentProfile model, JobPosting model, MatchScore model

from app.db.database import get_prisma


async def run_matching_for_student(student_id: str):
    # TODO: full matching pipeline with ML scoring + SHAP writeback.
    return []


async def get_top_matches(student_id: str, n: int = 10):
    prisma = get_prisma()
    return await prisma.matchscore.find_many(
        where={"studentId": student_id},
        order={"finalScore": "desc"},
        take=n,
        include={"job": True},
    )