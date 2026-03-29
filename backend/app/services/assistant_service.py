from __future__ import annotations

import re

from app.services import llm_provider


def _match_faq(message: str) -> str | None:
    text = (message or "").strip().lower()

    if re.search(r"^(hi|hello|hey|hii|yo|good\s*(morning|afternoon|evening))\b", text):
        return (
            "Hey! I am your TalentSync Career Assistant.\n\n"
            "what can I help you with:\n"

        )

    if re.search(r"\b(thanks|thank\s*you|thx)\b", text):
        return "You are welcome! If you want, I can suggest your next best step for placements this week."

    if re.search(r"\b(can|is|possible|how)\b.*\b(fresher|entry)\b.*\b(high|higher|good|best|lpa|package|ctc|salary)\b", text):
        return (
            "Yes, a fresher can get a high LPA offer with the right strategy.\n\n"
            "Focus on:\n"
            "- DSA and interview problem solving\n"
            "- 1-2 strong, role-aligned projects\n"
            "- Resume keyword alignment and referrals\n"
            "- Core fundamentals (DBMS, OS, CN, OOPs)\n\n"
            "Typical fresher ranges in India can vary widely by company type, "
            "from service roles to top product companies."
        )

    return None


def _custom_rule_response(message: str) -> str:
    text = (message or "").strip()
    lower = text.lower()

    if "shortlist" in lower or "shortlisted" in lower:
        return (
            "To get shortlisted faster:\n"
            "- Tailor resume to each role using JD keywords\n"
            "- Show measurable impact in project bullets\n"
            "- Keep resume ATS-friendly (clean headings, no heavy tables)\n"
            "- Apply consistently and prioritize referral-based applications"
        )

    if "resume" in lower or "cv" in lower or "ats" in lower:
        return (
            "Quick resume checklist:\n"
            "- Keep it to one page\n"
            "- Add quantified achievements\n"
            "- Mention relevant skills from job descriptions\n"
            "- Include GitHub/portfolio links\n"
            "- Use ATS-friendly formatting"
        )

    if "project" in lower or "portfolio" in lower or "github" in lower:
        return (
            "Build one strong project per target role:\n"
            "- Solve a real problem\n"
            "- Add deployment + clear README\n"
            "- Mention architecture and outcomes\n"
            "- Pin best repos on GitHub"
        )

    return (
        f"I can help with '{text}'. Start with this plan:\n"
        "- Define your target role\n"
        "- Identify top 3 required skills\n"
        "- Build one proof project\n"
        "- Apply with resume tailoring and referrals\n\n"
        "If you want, I can break this into a 7-day action plan."
    )


async def handle_career_intent(
    user_id: str,
    intent: str,
    message: str,
    history: list[dict],
    profile_context: str = "",
) -> str:
    faq_answer = _match_faq(message)
    if faq_answer:
        return faq_answer

    try:
        llm_text = await llm_provider.generate(
            prompt=message,
            history=history[-10:] if history else [],
            system_prompt=(
                f"{llm_provider.TALENTSYNC_SYSTEM_PROMPT}\n\n"
                "You are a practical career assistant for students. "
                "Give concise, actionable guidance."
            ),
        )
        if llm_text.strip() == llm_provider.FALLBACK_RESPONSE:
            return _custom_rule_response(message)
        return llm_text
    except Exception:
        return _custom_rule_response(message)
