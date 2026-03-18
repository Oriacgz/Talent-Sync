# WHO WRITES THIS: Backend developer + ML developer
# WHAT THIS DOES: POST /chatbot/message — sends user message + history to Ollama.
#                 If LLM response contains complete profile JSON, saves to DB.
#                 Returns LLM response text + profile_complete flag.
#                 POST /chatbot/reset — clears session state.
# DEPENDS ON: chatbot_service, StudentProfile model, auth middleware

from fastapi import APIRouter
router = APIRouter(prefix="/chatbot", tags=["chatbot"])

@router.post("/message")
async def chat(): pass  # TODO

@router.post("/reset")
def reset(): pass  # TODO