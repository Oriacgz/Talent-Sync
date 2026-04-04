"""Match response contract used by student and recruiter flows."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    studentId: str
    jobId: str

    # Job-facing fields for student UI
    title: str | None = None
    roleTitle: str | None = None
    company: str | None = None
    companyName: str | None = None
    location: str | None = None

    # Candidate-facing fields for recruiter UI
    fullName: str | None = None
    college: str | None = None
    gpa: float | None = None
    skills: list[str] = []
    applicationId: str | None = None

    # Score fields
    score: float
    similarityScore: float | None = None
    ruleScore: float | None = None
    finalScore: float

    rank: int | None = None
    status: str | None = None
    requiredSkills: list[str] = []
    missingSkills: list[str] = []
    shapValues: dict[str, Any] | None = None
    explanation: str | None = None
    createdAt: datetime | None = None