# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Computes the three sub-scores and combines them.
#                 compute_semantic_score() — cosine similarity between vectors.
#                 compute_academic_score() — normalised GPA vs job minimum.
#                 compute_preference_score() — domain + location + skill overlap.
#                 compute_hybrid_score() — weighted sum: 0.5 + 0.3 + 0.2.
# DEPENDS ON: numpy, sklearn.metrics.pairwise, models (StudentProfile, JobPosting)

import numpy as np

def compute_semantic_score(vec1: np.ndarray, vec2: np.ndarray) -> float:
    pass  # TODO: cosine_similarity([vec1], [vec2])[0][0]

def compute_academic_score(student_gpa: float, min_gpa: float) -> float:
    pass  # TODO: normalise gpa gap, clamp 0-1

def compute_preference_score(profile, job) -> float:
    pass  # TODO: domain + location + skill overlap / 3

def compute_hybrid_score(semantic: float, academic: float,
                          preference: float) -> float:
    pass  # TODO: 0.5*sem + 0.3*acad + 0.2*pref, clamp 0-1