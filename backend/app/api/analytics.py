# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: GET /analytics/platform — total matches, avg score, active jobs.
#                 GET /analytics/recruiter/me — applicants, shortlisted,
#                 selected for this recruiter's jobs.
# DEPENDS ON: MatchScore, Application, JobPosting models, auth middleware

from fastapi import APIRouter
router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/platform")
def platform_stats(): pass  # TODO

@router.get("/recruiter/me")
def recruiter_analytics(): pass  # TODO