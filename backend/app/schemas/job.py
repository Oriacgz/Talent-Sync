# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Request/response shapes for job posting endpoints.
# DEPENDS ON: pydantic

from pydantic import BaseModel
from typing import List, Optional
class CreateJobRequest(BaseModel):
    title: str
    description: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    domain: Optional[str] = "Any"
    location: Optional[str] = "Remote"
    min_gpa: Optional[float] = 0.0
    stipend: Optional[int] = 0
    duration_months: Optional[int] = 3
class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str]
    domain: str
    location: str
    stipend: int
    is_active: bool
    class Config:
        from_attributes = True