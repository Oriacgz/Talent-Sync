# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Unified /api/chat endpoints for the hybrid chatbot.
#   POST /api/chat         — main chat endpoint (onboarding + career assistant)
#   GET  /api/chat/history  — paginated chat history for a session
#   GET  /api/chat/sessions — list user's chat sessions
#   POST /api/chat/reset    — create a fresh session
# DEPENDS ON: chatbot_service, auth middleware, Prisma

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.database import get_prisma
from app.middleware.auth import get_current_user
from app.schemas.chatbot import (
    ChatHistoryResponse,
    ChatMessageItem,
    ChatRequest,
    ChatResponse,
    ChatSessionItem,
    ChatSessionsResponse,
)
from app.services.chatbot_service import process_message

router = APIRouter(prefix="/api/chat", tags=["chatbot"])


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Main chat endpoint. Handles both onboarding and career assistant modes."""
    user_id = current_user["id"]
    try:
        result = await process_message(
            user_id=user_id,
            message=payload.message,
            session_id=payload.session_id,
            force_assistant=payload.force_assistant,
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {exc}") from exc


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get paginated chat history for a session."""
    prisma = get_prisma()
    user_id = current_user["id"]

    session = await prisma.chatbotsession.find_first(
        where={"id": session_id, "userId": user_id},
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = await prisma.chatmessage.find_many(
        where={"sessionId": session_id},
        order={"createdAt": "asc"},
        skip=skip,
        take=limit,
    )

    total = await prisma.chatmessage.count(
        where={"sessionId": session_id},
    )

    return ChatHistoryResponse(
        messages=[
            ChatMessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                intent=m.intent,
                created_at=m.createdAt,
            )
            for m in messages
        ],
        session_id=session_id,
        total=total,
    )


@router.get("/sessions", response_model=ChatSessionsResponse)
async def list_sessions(
    current_user: dict = Depends(get_current_user),
):
    """List all chat sessions for the current user."""
    prisma = get_prisma()
    user_id = current_user["id"]

    sessions = await prisma.chatbotsession.find_many(
        where={"userId": user_id},
        order={"updatedAt": "desc"},
    )

    return ChatSessionsResponse(
        sessions=[
            ChatSessionItem(
                id=s.id,
                mode=s.mode,
                onboarding_step=s.onboardingStep,
                is_complete=s.isComplete,
                created_at=s.createdAt,
                updated_at=s.updatedAt,
            )
            for s in sessions
        ],
    )


@router.post("/reset", response_model=ChatResponse)
async def reset_session(
    current_user: dict = Depends(get_current_user),
):
    """Create a fresh chat session, respecting profile state."""
    user_id = current_user["id"]

    # Send the greeting as the first message — get_or_create_session
    # will automatically choose ONBOARDING or CAREER_ASSISTANT
    # based on the user's profile completeness.
    result = await process_message(
        user_id=user_id,
        message="hi",
        session_id=None,  # Force new session
    )
    return ChatResponse(**result)