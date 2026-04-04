"""Application request/response contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ApplicationStatusInput = Literal[
    "APPLIED",
    "REVIEWED",
    "SHORTLISTED",
    "SELECTED",
    "REJECTED",
    "HIRED",
]


class CreateApplicationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    job_id: str = Field(alias="jobId")
    cover_note: str | None = Field(default=None, alias="coverNote")


class UpdateStatusRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    status: ApplicationStatusInput


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    studentId: str
    jobId: str
    status: str
    appliedAt: datetime
    updatedAt: datetime

    jobTitle: str | None = None
    company: str | None = None
    matchScore: float | None = None