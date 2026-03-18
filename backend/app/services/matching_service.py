# WHO WRITES THIS: ML developer + Backend developer
# WHAT THIS DOES: Orchestrates the full matching pipeline for a student.
#                 run_matching_for_student() — encodes student profile,
#                 loops over all jobs, computes scores, saves to match_scores table.
#                 get_top_matches() — returns top N matches sorted by hybrid_score.
# DEPENDS ON: ml/encoder.py, ml/scorer.py, ml/explainer.py,
#             StudentProfile model, JobPosting model, MatchScore model

def run_matching_for_student(student_id: int, db):
    pass  # TODO: full matching pipeline

def get_top_matches(student_id: int, db, n: int = 10):
    pass  # TODO: query match_scores sorted by hybrid_score