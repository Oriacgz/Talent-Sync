"""Student profile request/response contracts.

These models are intentionally aligned with both:
1) Prisma field names in the backend (camelCase DB fields), and
2) Frontend payload field names (mixed camelCase + legacy snake_case).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    full_name: str | None = Field(default=None, alias="fullName")
    bio: str | None = None
    college: str | None = None
    degree: str | None = None
    branch: str | None = None
    graduation_year: int | None = Field(default=None, alias="graduationYear")
    cgpa: float | None = Field(default=None, alias="gpa")
    location: str | None = None

    linkedin_url: str | None = Field(default=None, alias="linkedinUrl")
    github_url: str | None = Field(default=None, alias="githubUrl")
    portfolio_url: str | None = Field(default=None, alias="portfolioUrl")

    preferred_roles: list[str] | None = Field(default=None, alias="preferredRoles")
    preferred_locations: list[str] | None = Field(default=None, alias="preferredLocations")
    experience_level: str | None = Field(default=None, alias="experienceLevel")
    social_links: list[str] | None = Field(default=None, alias="socialLinks")

    # Included for frontend compatibility; these are currently not persisted.
    phone: str | None = None
    address: str | None = None

    # Resume + visibility toggles
    resume: str | dict[str, Any] | None = None
    resume_public: bool | None = Field(default=None, alias="resumePublic")
    certifications_public: bool | None = Field(default=None, alias="certificationsPublic")

    # Skills are managed via StudentSkill relation.
    skills: list[str] | None = None


class StudentCertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str
    publicId: str
    uploadedAt: datetime


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    userId: str
    email: EmailStr | str
    fullName: str | None = None
    bio: str | None = None
    college: str | None = None
    degree: str | None = None
    branch: str | None = None
    graduationYear: int | None = None
    cgpa: float | None = None
    # Keep legacy key expected by parts of the frontend.
    gpa: float | None = None
    location: str | None = None
    phone: str | None = None
    address: str | None = None

    preferredRoles: list[str] = []
    preferredLocations: list[str] = []
    experienceLevel: str | None = None
    socialLinks: list[str] = []

    resume: dict[str, Any] | str | None = None
    resumeUrl: str | None = None
    resumePublic: bool = True

    certificationsPublic: bool = True
    certificates: list[StudentCertificationResponse] = []

    skills: list[str] = []
    profileCompletion: int = 0