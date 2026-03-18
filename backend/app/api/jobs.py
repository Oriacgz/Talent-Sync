# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: GET /jobs — list all active jobs.
#                 GET /jobs/{id} — single job detail.
#                 POST /jobs — recruiter creates job (invalidates embeddings).
#                 PUT /jobs/{id} — recruiter updates job (invalidates embeddings).
# DEPENDS ON: auth middleware, JobPosting model

from fastapi import APIRouter
router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("")
def list_jobs(): pass  # TODO

@router.get("/{job_id}")
def get_job(job_id: int): pass  # TODO

@router.post("")
def create_job(): pass  # TODO (recruiter only)

@router.put("/{job_id}")
def update_job(job_id: int): pass  # TODO (recruiter only)