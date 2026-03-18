# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Request/response shapes for student profile endpoints.
# DEPENDS ON: pydantic

from pydantic import BaseModel
from typing import List, Optional
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    gpa: Optional[float] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[str]] = None
    experience_months: Optional[int] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    preferred_domain: Optional[str] = None
class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str]
    college: Optional[str]
    gpa: Optional[float]
    skills: List[str]
    profile_complete: bool
    class Config:
        from_attributes = True