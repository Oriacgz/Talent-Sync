"""Job schemas — request/response shapes for job endpoints.

Pydantic v2 models with field-level constraints and cross-field validators.
"""

from __future__ import annotations

import math
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


ExperienceLevelType = Literal["FRESHER", "INTERN", "JUNIOR", "MID", "SENIOR"]
JobTypeType = Literal["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]
WorkModeType = Literal["REMOTE", "HYBRID", "ONSITE"]


# ── Request Schemas ─────────────────────────────────────────


class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=100, max_length=2000)
    skills: list[str] = Field(..., max_length=15)
    experienceLevel: ExperienceLevelType
    education: str
    jobType: JobTypeType
    workMode: WorkModeType
    location: Optional[str] = None
    salaryMin: Optional[int] = None
    salaryMax: Optional[int] = None
    duration: Optional[str] = None
    openings: int = Field(..., ge=1)
    deadline: date
    perks: Optional[list[str]] = None
    aboutCompany: Optional[str] = None
    minCgpa: Optional[float] = Field(default=None, ge=0, le=10)
    eligibleBranches: Optional[list[str]] = None

    @field_validator("skills")
    @classmethod
    def validate_skills_not_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one skill is required")
        seen: set[str] = set()
        cleaned: list[str] = []
        for s in v:
            s = s.strip()
            if not s:
                raise ValueError("Skill name cannot be empty")
            lower = s.lower()
            if lower not in seen:
                seen.add(lower)
                cleaned.append(s)
        return cleaned

    @model_validator(mode="after")
    def validate_salary_range(self) -> "JobCreate":
        if self.salaryMin is not None and self.salaryMax is not None:
            if self.salaryMin >= self.salaryMax:
                raise ValueError("salaryMin must be less than salaryMax")
        return self

    @model_validator(mode="after")
    def validate_location_for_non_remote(self) -> "JobCreate":
        if self.workMode != "REMOTE" and not self.location:
            raise ValueError("Location is required for HYBRID and ONSITE jobs")
        return self


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=100, max_length=2000)
    skills: Optional[list[str]] = Field(None, max_length=15)
    experienceLevel: Optional[ExperienceLevelType] = None
    education: Optional[str] = None
    jobType: Optional[JobTypeType] = None
    workMode: Optional[WorkModeType] = None
    location: Optional[str] = None
    salaryMin: Optional[int] = None
    salaryMax: Optional[int] = None
    duration: Optional[str] = None
    openings: Optional[int] = Field(None, ge=1)
    deadline: Optional[date] = None
    perks: Optional[list[str]] = None
    aboutCompany: Optional[str] = None
    minCgpa: Optional[float] = Field(default=None, ge=0, le=10)
    eligibleBranches: Optional[list[str]] = None

    @field_validator("skills")
    @classmethod
    def validate_skills_not_empty(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if not v:
            raise ValueError("At least one skill is required")
        seen: set[str] = set()
        cleaned: list[str] = []
        for s in v:
            s = s.strip()
            if not s:
                raise ValueError("Skill name cannot be empty")
            lower = s.lower()
            if lower not in seen:
                seen.add(lower)
                cleaned.append(s)
        return cleaned


# ── Response Schemas ────────────────────────────────────────


class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    skills: list[str] = Field(default_factory=list)
    experienceLevel: str
    education: str
    jobType: str
    workMode: str
    location: Optional[str] = None
    salaryMin: Optional[int] = None
    salaryMax: Optional[int] = None
    duration: Optional[str] = None
    openings: int
    deadline: Optional[datetime] = None
    perks: list[str] = Field(default_factory=list)
    aboutCompany: Optional[str] = None
    isActive: bool
    recruiterName: str = ""
    applicationCount: int = 0
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    limit: int
    total_pages: int

    @classmethod
    def build(
        cls,
        items: list[JobResponse],
        total: int,
        page: int,
        limit: int,
    ) -> "JobListResponse":
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=max(1, math.ceil(total / limit)),
        )