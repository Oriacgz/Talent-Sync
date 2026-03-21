# WHO WRITES THIS: Backend developer + ML developer
# WHAT THIS DOES: POST /chatbot/message - sends user message + history to Gemini.
#                 Returns LLM response text + profile_complete flag.
#                 POST /chatbot/reset - clears session state.

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

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

@router.post("/reset")
def reset():
    return {"ok": True}