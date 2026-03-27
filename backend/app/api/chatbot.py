# WHO WRITES THIS: Backend developer + ML developer
# WHAT THIS DOES: POST /chatbot/message - sends user message + history to Gemini.
#                 Returns LLM response text + profile_complete flag.
#                 POST /chatbot/reset - clears session state.

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import require_role

from app.services.chatbot_service import (
    extract_profile,
    send_to_gemma,
    validate_profile_schema,
)


router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = []


class ChatContext(BaseModel):
    student_profile: dict | None = None
    applications: dict | None = None
    top_matches: list[dict] = []
    skill_gap: dict | None = None


class ChatContextRequest(ChatRequest):
    context: ChatContext | None = None


@router.post("/message")
async def chat(payload: ChatRequest):
    try:
        history = [msg.model_dump() for msg in payload.history]
        llm_text = send_to_gemma(payload.message, history)
        profile = extract_profile(llm_text)
        profile_complete = bool(
            profile
            and profile.get("profile_complete") is True
            and validate_profile_schema(profile)
        )
        return {
            "response": llm_text,
            "profile_complete": profile_complete,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/message-context")
async def chat_with_context(
    payload: ChatContextRequest,
    _: dict = Depends(require_role("student")),
):
    try:
        history = [msg.model_dump() for msg in payload.history]
        context_payload = payload.context.model_dump(exclude_none=True) if payload.context else None
        llm_text = send_to_gemma(payload.message, history, context_payload)
        profile = extract_profile(llm_text)
        profile_complete = bool(
            profile
            and profile.get("profile_complete") is True
            and validate_profile_schema(profile)
        )
        return {
            "response": llm_text,
            "profile_complete": profile_complete,
            "context_used": bool(payload.context),
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/reset")
def reset():
    return {"ok": True}