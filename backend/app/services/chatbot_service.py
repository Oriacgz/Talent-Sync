# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Sends messages to Gemma via Google Gemini API.
#                 Uses a system prompt to collect student profile data.
#                 extract_profile() parses <profile>JSON</profile> from response.

import json
import re
from typing import Any

import google.generativeai as genai

from app.config import settings


SYSTEM_PROMPT = """You are TalentSync's AI profile builder.
Your job is to collect the following information from the student
through friendly conversation (one or two questions at a time):
- Full name
- College name and branch
- GPA (out of 10)
- Technical skills (from: Python, Java, React, SQL, etc.)
- Projects completed (brief descriptions)
- Internship experience in months (0 if none)
- Preferred job roles (e.g. Data Analyst, ML Engineer)
- Preferred location (Mumbai, Bangalore, Remote, etc.)

After collecting ALL information, respond with a JSON block like:
<profile>
{
  "full_name": "...",
  "college": "...",
  "branch": "...",
  "gpa": 8.5,
  "skills": ["Python", "React"],
  "projects": ["Sentiment analysis using Python"],
  "experience_months": 0,
  "preferred_roles": ["Data Analyst"],
  "preferred_locations": ["Mumbai"],
  "profile_complete": true
}
</profile>

Keep responses concise and friendly.
Ask one or two questions at a time - never all at once.
NEVER make up information. NEVER output code."""


def _build_context_instruction(context: dict[str, Any] | None) -> str:
    """Build safe personalization guidance injected into model system instruction."""
    if not context:
        return ""

    try:
        context_json = json.dumps(context, ensure_ascii=True, default=str)
    except TypeError:
        context_json = "{}"

    trimmed_context = context_json[:3500]
    return (
        "Personalization context for this student conversation:\n"
        f"{trimmed_context}\n"
        "Use this context only when directly relevant, do not invent facts, and keep responses concise and actionable."
    )


# Configure Gemini once at import time.
genai.configure(api_key=settings.GEMINI_API_KEY)


def get_model(context: dict[str, Any] | None = None) -> genai.GenerativeModel:
    """Build and return the configured Gemini model client."""
    system_instruction = SYSTEM_PROMPT
    context_instruction = _build_context_instruction(context)
    if context_instruction:
        system_instruction = f"{SYSTEM_PROMPT}\n\n{context_instruction}"

    return genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_instruction,
    )


def send_to_gemma(message: str, history: list, context: dict[str, Any] | None = None) -> str:
    """
    Send a user message to Gemini/Gemma.

    `history` is expected as list[{role: user|assistant, content: str}].
    It is converted to Gemini chat history format where assistant role is model.
    """
    try:
        model = get_model(context)

        gemini_history = []
        for item in history:
            role = "model" if item.get("role") == "assistant" else "user"
            gemini_history.append(
                {
                    "role": role,
                    "parts": [item.get("content", "")],
                }
            )

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        return response.text or ""
    except Exception as exc:
        raise RuntimeError(f"Gemini request failed: {exc}") from exc


def extract_profile(llm_output: str) -> dict | None:
    """Parse and return JSON inside <profile>...</profile> if available."""
    match = re.search(r"<profile>(.*?)</profile>", llm_output, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        return None


def validate_profile_schema(data: dict) -> bool:
    """Validate required fields before considering profile complete."""
    required = [
        "full_name",
        "college",
        "branch",
        "gpa",
        "skills",
        "preferred_roles",
        "preferred_locations",
    ]
    return all(data.get(key) for key in required)