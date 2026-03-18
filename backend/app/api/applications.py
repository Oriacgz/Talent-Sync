# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: POST /applications — student applies to a job.
#                 GET /applications/me — student's application list.
#                 PATCH /applications/{id}/status — recruiter updates status.
# DEPENDS ON: Application model, auth middleware

from fastapi import APIRouter
router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("")
def apply(): pass  # TODO

@router.get("/me")
def my_applications(): pass  # TODO

@router.patch("/{app_id}/status")
def update_status(app_id: int): pass  # TODO (recruiter only)