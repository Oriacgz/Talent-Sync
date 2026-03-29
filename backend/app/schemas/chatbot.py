# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Pydantic models for the unified /api/chat endpoints.
# DEPENDS ON: pydantic

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ─── Request Models ───

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None
    force_assistant: bool = False


# ─── Response Models ───

class ChatResponse(BaseModel):
    response: str
    session_id: str
    mode: Literal["ONBOARDING", "CAREER_ASSISTANT"]
    onboarding_step: str | None = None
    profile_complete: bool = False
    intent: str | None = None


class ChatMessageItem(BaseModel):
    id: str
    role: str
    content: str
    intent: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageItem]
    session_id: str
    total: int


class ChatSessionItem(BaseModel):
    id: str
    mode: str
    onboarding_step: str
    is_complete: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionsResponse(BaseModel):
    sessions: list[ChatSessionItem]


class OnboardingState(BaseModel):
    """Represents the current state of the onboarding flow."""
    step: str
    extracted_data: dict[str, Any] = {}
    is_complete: bool = False
