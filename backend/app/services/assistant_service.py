from __future__ import annotations

import re

from app.services import llm_provider


# ─────────────────────────────────────────────
# OFF-TOPIC DETECTION
# ─────────────────────────────────────────────
# Keywords that signal the message is career/job/platform related.
# If NONE of these appear, the message is likely off-topic.

_CAREER_KEYWORDS = re.compile(
    r"\b("
    r"job|jobs|internship|internships|placement|placements|career|careers|"
    r"resume|cv|portfolio|profile|skill|skills|"
    r"interview|interviews|hire|hiring|hired|"
    r"salary|ctc|lpa|package|offer|"
    r"recruiter|company|companies|startup|"
    r"apply|applied|application|shortlist|shortlisted|"
    r"match|matches|score|rank|ranking|"
    r"fresher|experienced|intern|junior|senior|"
    r"project|projects|github|linkedin|"
    r"college|degree|branch|cgpa|gpa|education|"
    r"dsa|coding|aptitude|"
    r"data\s*(?:science|analyst|engineer)|"
    r"full\s*stack|frontend|backend|devops|cloud|"
    r"machine\s*learning|ai\b|ml\b|web\s*dev|"
    r"talentsync|talent\s*sync|"
    r"improve|tips?|advice|guidance|help|suggest|recommendation|"
    r"certification|course|courses|learn|learning|"
    r"work\s*mode|remote|onsite|hybrid|"
    r"experience|opportunities|openings|roles?|position"
    r")\b",
    re.IGNORECASE,
)

# Common greetings/pleasantries that should pass through (handled by FAQ)
_PLEASANTRY_PATTERN = re.compile(
    r"^(hi|hello|hey|hii+|yo|good\s*(morning|afternoon|evening)|"
    r"thanks|thank\s*you|thx|bye|okay|ok|yes|no|sure|alright|hmm|"
    r"what can you do|help|menu|start|restart)\b",
    re.IGNORECASE,
)

OFF_TOPIC_RESPONSE = (
    "I can only help with jobs, internships, career guidance, and your professional journey.\n\n"
    "Here is what I can do:\n"
    "- Show my matches\n"
    "- Show available jobs\n"
    "- How can I improve my resume?\n"
    "- How do I get shortlisted faster?\n"
    "- Show my applications\n\n"
    "Ask me anything about your career."
)


def _is_on_topic(message: str) -> bool:
    """Return True if the message is career/job/platform related or a pleasantry."""
    text = (message or "").strip()
    if not text:
        return True  # empty messages handled elsewhere

    # Short messages (< 3 words) — allow through, they're usually commands/greetings
    if len(text.split()) < 3:
        return True

    # Pleasantries always pass
    if _PLEASANTRY_PATTERN.search(text):
        return True

    # Check for career keywords
    if _CAREER_KEYWORDS.search(text):
        return True

    return False


# ─────────────────────────────────────────────
# FAQ MATCHER
# ─────────────────────────────────────────────

def _match_faq(message: str) -> str | None:
    text = (message or "").strip().lower()

    if re.search(r"^(hi|hello|hey|hii|yo|good\s*(morning|afternoon|evening))\b", text):
        return (
            "Hey! I am your TalentSync Career Assistant.\n\n"
            "What can I help you with:\n"
            "• Your job matches and scores\n"
            "• Resume and profile improvement tips\n"
            "• Application tracking\n"
            "• Interview and career guidance\n"
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


# ─────────────────────────────────────────────
# RULE-BASED FALLBACK (career-only)
# ─────────────────────────────────────────────

def _custom_rule_response(message: str) -> str:
    """Provide a rule-based career response. Only produces career-related output."""
    lower = (message or "").strip().lower()

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

    # Generic career guidance (no user text echoed)
    return (
        "Here's a general career action plan:\n"
        "- Define your target role\n"
        "- Identify top 3 required skills\n"
        "- Build one proof project\n"
        "- Apply with resume tailoring and referrals\n\n"
        "If you want, I can break this into a 7-day action plan."
    )


# ─────────────────────────────────────────────
# MAIN HANDLER
# ─────────────────────────────────────────────

async def handle_career_intent(
    user_id: str,
    intent: str,
    message: str,
    history: list[dict],
    profile_context: str = "",
) -> str:
    # 1. Check FAQ first (greetings, thanks)
    faq_answer = _match_faq(message)
    if faq_answer:
        return faq_answer

    # 2. Topic guard — reject off-topic questions BEFORE hitting LLM
    if not _is_on_topic(message):
        return OFF_TOPIC_RESPONSE

    # 3. Try LLM (system prompt also enforces topic boundaries)
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
