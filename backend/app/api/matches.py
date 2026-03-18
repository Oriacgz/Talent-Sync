# WHO WRITES THIS: Backend developer + ML developer
# WHAT THIS DOES: GET /matches/me — triggers matching_service for student,
#                 returns top N matches with job info and SHAP values.
#                 GET /matches/{id}/detail — full SHAP breakdown for one match.
#                 GET /matches/job/{job_id}/candidates — ranked candidates for recruiter.
# DEPENDS ON: matching_service, MatchScore model, auth middleware

from fastapi import APIRouter
router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("/me")
def my_matches(): pass  # TODO

@router.get("/{match_id}/detail")
def match_detail(match_id: int): pass  # TODO

@router.get("/job/{job_id}/candidates")
def job_candidates(job_id: int): pass  # TODO (recruiter only)