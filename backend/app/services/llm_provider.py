# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Async Ollama LLM adapter using Llama 3.2.
#                 generate() sends chat completion to local Ollama server.
#                 Falls back to a static rule-based default when Ollama is unreachable.
# DEPENDS ON: httpx, config.py

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TALENTSYNC_SYSTEM_PROMPT = (
    "You are TalentSync AI, an intelligent career assistant embedded in a job-matching "
    "platform for students and recruiters. You are warm, professional, and concise. "
    "You always give actionable advice. You never fabricate data — if you don't know "
    "something, say so. You do NOT output code or markdown formatting unless explicitly asked.\n\n"
    "IMPORTANT TOPIC BOUNDARIES:\n"
    "You ONLY answer questions related to:\n"
    "- Jobs, internships, and placements\n"
    "- Career guidance, interview preparation, and skill development\n"
    "- Resumes, CVs, portfolios, and professional profiles\n"
    "- The TalentSync platform (match scores, applications, job listings)\n"
    "- Education, college, courses, and certifications relevant to careers\n\n"
    "If a user asks about ANYTHING outside these topics (e.g. general knowledge, science, "
    "math, entertainment, politics, coding help, recipes, stories, etc.), you MUST politely "
    "decline and redirect them. Example response for off-topic questions:\n"
    "\"I'm your TalentSync Career Assistant — I can only help with jobs, internships, "
    "career guidance, and everything related to your professional journey. "
    "Try asking me about your match scores, resume tips, or available jobs!\"\n\n"
    "Never answer off-topic questions, even partially."
)

FALLBACK_RESPONSE = (
    "I'm temporarily unable to reach the AI service. "
    "Please try again in a moment, or continue exploring your dashboard."
)


async def generate(
    prompt: str,
    history: list[dict] | None = None,
    system_prompt: str | None = None,
) -> str:
    """Send a chat completion request to Ollama and return the assistant reply.

    Args:
        prompt: The current user message.
        history: Previous messages as list of {"role": ..., "content": ...}.
        system_prompt: Override the default TalentSync system prompt.

    Returns:
        The assistant's text response, or a fallback string on failure.
    """
    messages: list[dict] = []

    messages.append({
        "role": "system",
        "content": system_prompt or TALENTSYNC_SYSTEM_PROMPT,
    })

    if history:
        for msg in history:
            role = msg.get("role", "user")
            if role not in ("user", "assistant", "system"):
                role = "user"
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(
            base_url=settings.OLLAMA_BASE_URL,
            timeout=httpx.Timeout(settings.OLLAMA_TIMEOUT),
        ) as client:
            response = await client.post("/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "")
            return content.strip() if content else FALLBACK_RESPONSE
    except httpx.ConnectError:
        logger.warning("Ollama is not reachable at %s", settings.OLLAMA_BASE_URL)
        return FALLBACK_RESPONSE
    except httpx.TimeoutException:
        logger.warning("Ollama request timed out after %ss", settings.OLLAMA_TIMEOUT)
        return FALLBACK_RESPONSE
    except Exception as exc:
        logger.exception("Ollama request failed: %s", exc)
        return FALLBACK_RESPONSE


async def check_health() -> bool:
    """Return True if Ollama is reachable."""
    try:
        async with httpx.AsyncClient(
            base_url=settings.OLLAMA_BASE_URL,
            timeout=httpx.Timeout(5),
        ) as client:
            resp = await client.get("/")
            return resp.status_code == 200
    except Exception:
        return False
