"""
backend/app/schemas/match.py
Pydantic schemas for match API responses.
"""

from __future__ import annotations

from pydantic import BaseModel


class ScoreBreakdown(BaseModel):
    similarity_score: float
    ml_score: float
    final_score: float


class MatchResponse(BaseModel):
    job_id: str
    job_title: str
    company: str
    location: str | None
    work_mode: str | None
    job_type: str | None
    salary_min: int | None
    salary_max: int | None
    similarity_score: float
    ml_score: float
    final_score: float
    top_reasons: list[str]
    shap_values: dict
    score_breakdown: ScoreBreakdown
    applied: bool = False
    rank: int | None = None


class CandidateMatchResponse(BaseModel):
    """Used by recruiter to see ranked students for a job."""
    student_id: str
    student_name: str
    final_score: float
    similarity_score: float
    top_reasons: list[str]
    shap_values: dict