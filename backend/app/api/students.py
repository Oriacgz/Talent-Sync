# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: GET /students/me/profile — returns student's profile.
#                 PUT /students/me/profile — updates profile fields.
#                 POST /students/me/resume — uploads PDF, triggers parse.
# DEPENDS ON: auth middleware, StudentProfile model, resume_parser service

from fastapi import APIRouter
router = APIRouter(prefix="/students", tags=["students"])

@router.get("/me/profile")
def get_profile(): pass  # TODO

@router.put("/me/profile")
def update_profile(): pass  # TODO

@router.post("/me/resume")
async def upload_resume(): pass  # TODO