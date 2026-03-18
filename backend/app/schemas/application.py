# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Request/response shapes for application endpoints.
# DEPENDS ON: pydantic

from pydantic import BaseModel
class CreateApplicationRequest(BaseModel):
    job_id: int
class UpdateStatusRequest(BaseModel):
    status: str
class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    job_id: int
    status: str
    class Config:
        from_attributes = True