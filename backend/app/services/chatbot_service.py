# WHO WRITES THIS: Backend developer + ML developer
# WHAT THIS DOES: Hybrid chatbot engine with:
#   - Onboarding state machine (GREETING → … → COMPLETED)
#   - Name fetched from User table (auth) — not StudentProfile
#   - No resume step — users upload manually via Profile page
#   - Intent detection for career assistant mode
#   - Rule-based handlers (DB queries, no LLM)
#   - LLM handlers via Ollama with fallback on failure
#   - Context builder injecting profile + matches + SHAP
#   - process_message() master orchestrator
# DEPENDS ON: llm_provider, prisma, matching_service, config

from __future__ import annotations

import json
import logging
import re
from typing import Any

from prisma import Json

from app.db.database import get_prisma
from app.services import llm_provider

logger = logging.getLogger(__name__)


def _get_career_intent_handler():
    """Lazy import to avoid editor import resolution issues in some workspace setups."""
    from .assistant_service import handle_career_intent

    return handle_career_intent


# ─────────────────────────────────────────────
# ONBOARDING STATE MACHINE
# ─────────────────────────────────────────────
# CHANGES:
#   - Removed COLLECT_NAME (dead code — name comes from auth User table)
#   - Added COLLECT_COLLEGE (college/university was missing)
#   - Added COLLECT_CGPA (optional step, user can skip)
#   - Resume upload removed — handled manually on Profile page

ONBOARDING_STEPS = [
    "GREETING",
    "COLLECT_SKILLS",
    "COLLECT_EDUCATION",   # degree, branch, graduation year
    "COLLECT_COLLEGE",     # college/university name  ← NEW
    "COLLECT_CGPA",        # optional CGPA            ← NEW
    "COLLECT_ROLES",
    "COLLECT_EXPERIENCE",
    "CONFIRM_PROFILE",
    "COMPLETED",
]

STEP_PROMPTS: dict[str, str] = {
    "GREETING": (
        "👋 Hey {name}! Welcome to TalentSync — your AI-powered career assistant.\n\n"
        "I'll help you set up your profile in just a few steps so we can find "
        "the best-matched jobs for you.\n\n"
        "Let's start! List your technical skills separated by commas.\n"
        "_(e.g. Python, React, SQL, Machine Learning)_"
    ),
    "COLLECT_SKILLS": (
        "List your technical skills separated by commas.\n"
        "_(e.g. Python, React, SQL, Machine Learning)_"
    ),
    "COLLECT_EDUCATION": (
        "Nice skill set! 🎓 Now tell me about your education.\n\n"
        "Share your **degree**, **branch**, and **graduation year**.\n"
        "_(e.g. B.Tech Computer Science, 2026)_"
    ),
    "COLLECT_COLLEGE": (
        "Which college or university are you studying at?\n"
        "_(e.g. NIT Surathkal, IIT Bombay, VTU)_"
    ),
    "COLLECT_CGPA": (
        "What is your current CGPA or percentage?\n"
        "_(Type a number like 8.5 or 85%, or type **skip** to skip)_"
    ),
    "COLLECT_ROLES": (
        "What kind of roles are you targeting? 🎯\n\n"
        "Share your preferred job roles separated by commas.\n"
        "_(e.g. Data Analyst, ML Engineer, Full-Stack Developer)_"
    ),
    "COLLECT_EXPERIENCE": (
        "Almost done! What is your current experience level?\n\n"
        "Reply with one: **Fresher**, **Intern**, or **Experienced**"
    ),
    "CONFIRM_PROFILE": (
        "Here's your profile summary — does everything look correct?\n\n"
        "👤 **Name**: {name}\n"
        "🛠 **Skills**: {skills}\n"
        "🎓 **Education**: {degree} {branch}, {grad_year}\n"
        "🏫 **College**: {college}\n"
        "📊 **CGPA**: {cgpa}\n"
        "💼 **Preferred Roles**: {roles}\n"
        "⚡ **Experience**: {experience}\n\n"
        "Reply **Yes** to save your profile, or tell me what to change.\n"
        "_(e.g. \"change skills to Python, Java\")_"
    ),
    "COMPLETED": (
        "✅ **Profile saved!** You're all set.\n\n"
        "I'm now your Career Assistant. Here's what you can ask me:\n\n"
        "• _\"Show my matches\"_ — see your top job matches\n"
        "• _\"Show available jobs\"_ — browse all open positions\n"
        "• _\"Why did I match with [job]?\"_ — AI-powered explanation\n"
        "• _\"How can I improve my resume?\"_ — personalized tips\n"
        "• _\"Show my applications\"_ — check application status\n\n"
        "💡 **Tip:** Upload your resume on the Profile page for better match accuracy!"
    ),
}


def _next_step(current: str) -> str:
    """Return the next onboarding step."""
    idx = ONBOARDING_STEPS.index(current)
    if idx + 1 < len(ONBOARDING_STEPS):
        return ONBOARDING_STEPS[idx + 1]
    return "COMPLETED"


# ─────────────────────────────────────────────
# LLM-POWERED ONBOARDING RESPONSES
# ─────────────────────────────────────────────

_ONBOARDING_SYS_PROMPT = (
    "You are TalentSync AI, a friendly onboarding assistant helping a student "
    "set up their career profile. Rules:\n"
    "- Be warm, concise, and encouraging\n"
    "- Acknowledge what the student just shared before asking the next question\n"
    "- Ask exactly ONE question per message\n"
    "- Include helpful examples in your questions\n"
    "- Use 1-2 emojis max per message\n"
    "- Keep responses under 80 words\n"
    "- Stay on-topic — only discuss profile building\n"
    "- Do NOT use markdown code blocks"
)

_STEP_LLM_INSTRUCTIONS: dict[str, str] = {
    "GREETING": (
        "Welcome {name} to TalentSync. Briefly explain you'll build their career profile "
        "for better job matches. Ask them to list technical skills (comma-separated). "
        "Examples: Python, React, SQL, Machine Learning."
    ),
    "COLLECT_EDUCATION": (
        "The student listed these skills: {skills}. Acknowledge them positively. "
        "Ask about their education: degree, branch/field, and graduation year. "
        "Example: B.Tech Computer Science, 2026"
    ),
    "COLLECT_COLLEGE": (
        "Acknowledge their education info. Ask which college or university they attend. "
        "Examples: NIT Surathkal, IIT Bombay, VTU"
    ),
    "COLLECT_CGPA": (
        "Acknowledge their college: {college}. Ask for current CGPA or percentage. "
        "They can type a number like 8.5 or 85%, or type 'skip' to skip this."
    ),
    "COLLECT_ROLES": (
        "Acknowledge CGPA info. Ask what kind of roles they're targeting. "
        "They should list preferred job roles separated by commas. "
        "Examples: Data Analyst, ML Engineer, Full-Stack Developer"
    ),
    "COLLECT_EXPERIENCE": (
        "The student wants these roles: {roles}. Acknowledge them. "
        "Ask about their experience level. "
        "Options: Fresher, Intern, or Experienced."
    ),
    "CONFIRM_PROFILE": (
        "Show a clean profile summary for the student to review:\n"
        "Name: {name}, Skills: {skills}, Education: {degree} {branch} {grad_year}, "
        "College: {college}, CGPA: {cgpa}, Roles: {roles}, Experience: {experience}.\n"
        "Ask if everything looks correct. Reply 'Yes' to save, or describe what to change."
    ),
    "COMPLETED": (
        "Profile saved! Congratulate the student. Tell them you're now their Career Assistant. "
        "List what they can ask: show matches, show available jobs, why they matched, "
        "resume tips, application status. Suggest uploading resume on Profile page."
    ),
}


def _data_fmt(data: dict[str, Any]) -> dict[str, str]:
    """Build a format-safe dict from extracted onboarding data."""
    return {
        "name": data.get("full_name", "there"),
        "skills": ", ".join(data.get("skills", [])) or "None listed",
        "degree": data.get("degree") or data.get("education_raw", "N/A"),
        "branch": data.get("branch") or "",
        "grad_year": str(data.get("graduation_year") or "N/A"),
        "college": data.get("college", "N/A"),
        "cgpa": str(data.get("cgpa") or "Not provided"),
        "roles": ", ".join(data.get("preferred_roles", [])) or "None",
        "experience": data.get("experience_level", "N/A"),
    }


async def _llm_step_response(step_key: str, data: dict[str, Any], user_message: str) -> str:
    """Generate a natural LLM response for an onboarding step, with static fallback."""
    instruction = _STEP_LLM_INSTRUCTIONS.get(step_key)
    if not instruction:
        return _format_static_prompt(step_key, data)

    fmt = _data_fmt(data)
    try:
        instruction = instruction.format(**fmt)
    except (KeyError, IndexError):
        pass

    ctx_parts = [f"{k}: {v}" for k, v in fmt.items() if v and v not in ("N/A", "None listed", "Not provided", "there", "")]
    context = "\n".join(ctx_parts) if ctx_parts else "No data yet."

    prompt = (
        f"Student data so far:\n{context}\n\n"
        f"Student's last message: \"{user_message}\"\n\n"
        f"Your task: {instruction}"
    )

    try:
        resp = await llm_provider.generate(prompt=prompt, system_prompt=_ONBOARDING_SYS_PROMPT)
        if not resp or resp.strip() == llm_provider.FALLBACK_RESPONSE:
            return _format_static_prompt(step_key, data)
        return resp
    except Exception:
        logger.debug("LLM onboarding failed for step=%s, using static fallback", step_key)
        return _format_static_prompt(step_key, data)


def _format_static_prompt(step_key: str, data: dict[str, Any]) -> str:
    """Format a static STEP_PROMPTS template as fallback."""
    template = STEP_PROMPTS.get(step_key, "How can I help you?")
    try:
        return template.format(**_data_fmt(data))
    except (KeyError, IndexError):
        return template


# ─────────────────────────────────────────────
# PARSERS
# ─────────────────────────────────────────────
# FIX: _parse_education now handles full branch names
#      like "Computer Science", "Information Technology"
#      in addition to short codes like CSE, IT, ECE

def _parse_education(text: str) -> dict[str, Any]:
    """Parse education string. Handles both short codes and full names."""
    result: dict[str, Any] = {
        "degree": None,
        "branch": None,
        "graduation_year": None,
    }
    text = text.strip()

    # Extract year
    year_match = re.search(r"\b(20\d{2})\b", text)
    if year_match:
        result["graduation_year"] = int(year_match.group(1))

    # Extract degree
    degree_pattern = r"\b(B\.?Tech|B\.?E\.?|BCA|BCS|B\.?Sc|M\.?Tech|M\.?Sc|MCA|MBA|Ph\.?D|B\.?Com|B\.?A)\b"
    m = re.search(degree_pattern, text, re.IGNORECASE)
    if m:
        result["degree"] = m.group(1)

    # Extract branch — short codes first, then full names
    # FIX: Added full name patterns that were missing before
    branch_short = r"\b(CSE|CS|IT|ECE|EEE|ME|CE|AIML|DS)\b"
    branch_full = (
        r"\b(Computer Science(?:\s+(?:and|&)\s+Engineering)?|"
        r"Information Technology|"
        r"Electronics(?:\s+(?:and|&)\s+(?:Communication|Electrical))?|"
        r"Mechanical Engineering|"
        r"Civil Engineering|"
        r"Artificial Intelligence(?:\s+(?:and|&)\s+Machine Learning)?|"
        r"Data Science)\b"
    )

    m = re.search(branch_short, text, re.IGNORECASE)
    if m:
        result["branch"] = m.group(1).upper()
    else:
        m = re.search(branch_full, text, re.IGNORECASE)
        if m:
            # Normalize full names to short codes
            full_name = m.group(1).lower()
            mapping = {
                "computer science": "CSE",
                "information technology": "IT",
                "mechanical engineering": "ME",
                "civil engineering": "CE",
                "data science": "DS",
                "artificial intelligence": "AIML",
            }
            for key, short in mapping.items():
                if key in full_name:
                    result["branch"] = short
                    break
            if not result["branch"]:
                result["branch"] = m.group(1).strip()

    return result


def _parse_cgpa(text: str) -> float | None:
    """Extract CGPA or percentage from text. Returns float or None if skipped."""
    text_lower = text.strip().lower()
    if text_lower in {"skip", "s", "no", "none", "-"}:
        return None

    # Match decimal (8.5) or percentage (85%)
    m = re.search(r"\b(\d{1,2}(?:\.\d{1,2})?)\s*%?\b", text)
    if m:
        val = float(m.group(1))
        if val > 10:
            # Percentage — convert to 10-point scale for DB storage
            return round(val / 10.0, 2)
        return val
    return None


def _parse_skills(text: str) -> list[str]:
    """Split comma/and/semicolon-separated skills list."""
    parts = re.split(r"[,;]+|\band\b", text, flags=re.IGNORECASE)
    return [s.strip().title() for s in parts if s.strip()]


def _parse_roles(text: str) -> list[str]:
    """Split comma/and-separated roles list."""
    parts = re.split(r"[,;]+|\band\b", text, flags=re.IGNORECASE)
    return [s.strip().title() for s in parts if s.strip()]


def _parse_experience(text: str) -> str | None:
    """Extract experience level from user text."""
    text_lower = text.lower().strip()
    if "fresher" in text_lower or "fresh" in text_lower:
        return "FRESHER"
    if "intern" in text_lower:
        return "INTERN"
    if "experience" in text_lower or "working" in text_lower or "experienced" in text_lower:
        return "EXPERIENCED"
    return None


def _is_affirmative(text: str) -> bool:
    """Return True when user intent is a clear confirmation."""
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    positive = {"yes", "y", "yeah", "yep", "correct", "looks good",
                "save", "ok", "okay", "confirmed", "confirm", "sure", "yup"}
    if normalized in positive:
        return True
    return normalized.startswith("yes ") or normalized.startswith("ok ")


# FIX: CONFIRM_PROFILE edit handler — actually updates data{}
# Previously it returned a message but never modified the data dict.

def _apply_edit_to_data(edit_message: str, data: dict[str, Any]) -> tuple[dict[str, Any], str]:
    """
    Parse an edit instruction and update the data dict.
    Returns (updated_data, confirmation_message).
    e.g. "change skills to Python, Java" → updates data["skills"]
    """
    msg = edit_message.lower().strip()

    # Skills edit
    if re.search(r"\b(skill|skills)\b", msg):
        # Extract everything after "to" or ":" or "="
        m = re.search(r"(?:to|:|=)\s*(.+)$", msg)
        if m:
            new_skills = _parse_skills(m.group(1))
            if new_skills:
                data["skills"] = new_skills
                return data, f"✅ Skills updated to: {', '.join(new_skills)}\n\nAnything else to change, or reply **Yes** to save?"

    # Roles edit
    if re.search(r"\b(role|roles|position|positions)\b", msg):
        m = re.search(r"(?:to|:|=)\s*(.+)$", msg)
        if m:
            new_roles = _parse_roles(m.group(1))
            if new_roles:
                data["preferred_roles"] = new_roles
                return data, f"✅ Preferred roles updated to: {', '.join(new_roles)}\n\nAnything else, or reply **Yes** to save?"

    # Experience edit
    if re.search(r"\b(experience|level)\b", msg):
        exp = _parse_experience(edit_message)
        if exp:
            data["experience_level"] = exp
            return data, f"✅ Experience updated to: {exp}\n\nAnything else, or reply **Yes** to save?"

    # CGPA edit
    if re.search(r"\b(cgpa|gpa|percentage|marks)\b", msg):
        m = re.search(r"(?:to|:|=|is|)\s*(\d+(?:\.\d+)?)\s*%?", msg)
        if m:
            data["cgpa"] = m.group(1)
            return data, f"✅ CGPA updated to: {m.group(1)}\n\nAnything else, or reply **Yes** to save?"

    # College edit
    if re.search(r"\b(college|university|institute|school)\b", msg):
        m = re.search(r"(?:to|:|=|is)\s*(.+)$", edit_message.strip(), re.IGNORECASE)
        if m:
            data["college"] = m.group(1).strip()
            return data, f"✅ College updated to: {data['college']}\n\nAnything else, or reply **Yes** to save?"

    return data, (
        "I didn't quite understand what to change. Try:\n"
        "• _\"change skills to Python, Java\"_\n"
        "• _\"change roles to Backend Developer\"_\n"
        "• _\"change experience to Fresher\"_"
    )


async def handle_onboarding_step(
    session_id: str,
    user_id: str,
    current_step: str,
    user_message: str,
    extracted_data: dict[str, Any],
) -> tuple[str, str, dict[str, Any], bool]:
    """Process one onboarding step.
    Returns (response, next_step, updated_data, profile_saved).
    """
    data = dict(extracted_data)
    profile_saved = False
    prisma = get_prisma()

    # GREETING — fetch name from StudentProfile (fullName field)
    # StudentProfile is created during user registration
    if current_step == "GREETING":
        profile = await prisma.studentprofile.find_unique(where={"userId": user_id})
        name = ""
        if profile and profile.fullName:
            name = profile.fullName.strip()
        if not name:
            name = "there"

        data["full_name"] = name
        response = await _llm_step_response("GREETING", data, user_message)
        return response, "COLLECT_SKILLS", data, False

    if current_step == "COLLECT_SKILLS":
        skills = _parse_skills(user_message)
        if not skills:
            return (
                "I couldn't detect any skills. Please list them separated by commas.\n"
                "_(e.g. Python, React, SQL)_",
                current_step,
                data,
                False,
            )
        data["skills"] = skills
        response = await _llm_step_response("COLLECT_EDUCATION", data, user_message)
        return response, "COLLECT_EDUCATION", data, False

    if current_step == "COLLECT_EDUCATION":
        edu = _parse_education(user_message)
        if not edu["degree"] and not edu["graduation_year"]:
            # Store raw text as fallback — don't block user
            data["education_raw"] = user_message.strip()
        else:
            if edu["degree"]:
                data["degree"] = edu["degree"]
            if edu["branch"]:
                data["branch"] = edu["branch"]
            if edu["graduation_year"]:
                data["graduation_year"] = edu["graduation_year"]
        response = await _llm_step_response("COLLECT_COLLEGE", data, user_message)
        return response, "COLLECT_COLLEGE", data, False

    # NEW: Collect college/university name
    if current_step == "COLLECT_COLLEGE":
        college = user_message.strip()
        if len(college) < 2:
            return (
                "Please enter your college or university name.",
                current_step,
                data,
                False,
            )
        data["college"] = college
        response = await _llm_step_response("COLLECT_CGPA", data, user_message)
        return response, "COLLECT_CGPA", data, False

    # NEW: Collect CGPA (optional, skippable)
    if current_step == "COLLECT_CGPA":
        cgpa = _parse_cgpa(user_message)
        if cgpa:
            data["cgpa"] = cgpa
        else:
            data["cgpa"] = None  # user skipped
        response = await _llm_step_response("COLLECT_ROLES", data, user_message)
        return response, "COLLECT_ROLES", data, False

    if current_step == "COLLECT_ROLES":
        roles = _parse_roles(user_message)
        if not roles:
            return (
                "Please share at least one preferred role.\n"
                "_(e.g. Data Analyst, Backend Developer)_",
                current_step,
                data,
                False,
            )
        data["preferred_roles"] = roles
        response = await _llm_step_response("COLLECT_EXPERIENCE", data, user_message)
        return response, "COLLECT_EXPERIENCE", data, False

    if current_step == "COLLECT_EXPERIENCE":
        exp = _parse_experience(user_message)
        if not exp:
            return (
                "Please choose one: **Fresher**, **Intern**, or **Experienced**.",
                current_step,
                data,
                False,
            )
        data["experience_level"] = exp

        response = await _llm_step_response("CONFIRM_PROFILE", data, user_message)
        return response, "CONFIRM_PROFILE", data, False

    # FIX: CONFIRM_PROFILE — actually applies edits instead of just returning text
    if current_step == "CONFIRM_PROFILE":
        if _is_affirmative(user_message):
            try:
                await _save_student_profile(user_id, data)
                profile_saved = True
                response = await _llm_step_response("COMPLETED", data, user_message)
                return response, "COMPLETED", data, True
            except Exception:
                logger.exception("Failed to save onboarding profile for user %s", user_id)
                return (
                    "⚠️ Couldn't save your profile due to a temporary issue. "
                    "Please reply **Yes** again in a moment.",
                    current_step,
                    data,
                    False,
                )
        else:
            # Parse and apply the edit to data{}
            updated_data, edit_response = _apply_edit_to_data(user_message, data)
            return edit_response, current_step, updated_data, False

    return (
        STEP_PROMPTS.get(current_step, "How can I help you?"),
        current_step,
        data,
        False,
    )


async def _save_student_profile(user_id: str, data: dict[str, Any]) -> None:
    """Persist the collected onboarding data to StudentProfile."""
    prisma = get_prisma()
    profile = await prisma.studentprofile.find_unique(where={"userId": user_id})

    update_payload: dict[str, Any] = {
        "fullName": data.get("full_name", ""),
    }
    if data.get("degree"):
        update_payload["degree"] = data["degree"]
    if data.get("branch"):
        update_payload["branch"] = data["branch"]
    if data.get("graduation_year"):
        update_payload["graduationYear"] = data["graduation_year"]
    if data.get("college"):
        update_payload["college"] = data["college"]
    if data.get("cgpa") is not None:
        try:
            update_payload["cgpa"] = float(str(data["cgpa"]).replace("%", ""))
        except (ValueError, TypeError):
            pass
    if data.get("preferred_roles"):
        update_payload["preferredRoles"] = data["preferred_roles"]
    if data.get("experience_level"):
        update_payload["experienceLevel"] = data["experience_level"]

    if profile:
        await prisma.studentprofile.update(
            where={"userId": user_id},
            data=update_payload,
        )
    else:
        create_payload = {
            "userId": user_id,
            "fullName": data.get("full_name", ""),
            "preferredRoles": data.get("preferred_roles") or [],
            "preferredLocations": data.get("preferred_locations") or [],
        }
        create_payload.update({k: v for k, v in update_payload.items() if k != "fullName"})
        await prisma.studentprofile.create(data=create_payload)

    # Link skills through Skill + StudentSkill tables
    if data.get("skills"):
        student_profile = await prisma.studentprofile.find_unique(where={"userId": user_id})
        if student_profile:
            for skill_name in data["skills"]:
                skill = await prisma.skill.upsert(
                    where={"name": skill_name.strip()},
                    data={
                        "create": {"name": skill_name.strip()},
                        "update": {},
                    },
                )
                try:
                    await prisma.studentskill.create(
                        data={"studentId": student_profile.id, "skillId": skill.id},
                    )
                except Exception:
                    logger.debug(
                        "Skill link already exists for user=%s skill=%s",
                        user_id,
                        skill_name,
                    )


# ─────────────────────────────────────────────
# INTENT DETECTION (Career Assistant Mode)
# ─────────────────────────────────────────────
# NEW: Added show_jobs intent for browsing available jobs

INTENT_PATTERNS: dict[str, list[str]] = {
    "show_matches": [
        r"\b(show|list|view|get|see|display)\b.*\b(match|matches|matched|recommendations?)\b",
        r"\b(my|top)\s+(match|matches)\b",
        r"\bwhat\s+jobs?\s+(match|fit)\b",
        r"\bbest\s+jobs?\s+for\s+me\b",
    ],
    "show_applications": [
        r"\b(show|list|view|get|see|display)\b.*\b(application|applications|applied)\b",
        r"\bmy\s+application\b",
        r"\bapplication\s+status\b",
        r"\bwhere\s+(did|have)\s+I\s+applied\b",
    ],
    "show_jobs": [
        r"\b(show|list|find|browse|search|see)\b.*\b(jobs?|openings?|positions?|roles?)\b",
        r"\bwhat\s+jobs?\s+(are\s+)?(available|open|hiring)\b",
        r"\bavailable\s+jobs?\b",
        r"\bjob\s+listings?\b",
    ],
    "apply_to_job": [
        r"\b(apply|applying)\b.*\b(to|for)\b.*\b(job|role|position)\b",
        r"\bapply\s+(?:to\s+)?(?:job\s+)?#?\d+\b",
        r"\bapply\s+(?:to\s+)?[a-f0-9\-]{36}\b",
    ],
    "why_matched": [
        r"\bwhy\b.*\b(match|matched|score|ranked|selected)\b",
        r"\bexplain\b.*\b(match|score|result)\b",
        r"\bhow\b.*\b(did\s+I\s+match|was\s+I\s+matched)\b",
        r"\bwhat\s+made\s+me\s+(a\s+)?(good\s+)?fit\b",
    ],
    "improve_resume": [
        r"\b(improve|enhance|upgrade|optimize|fix|better)\b.*\b(resume|cv|profile)\b",
        r"\bresume\s+(tip|advice|suggestion|feedback|help)\b",
        r"\bhow\s+(can|do|should)\s+I\s+improve\b",
        r"\bwhat\s+(skills?|things?)\s+(am\s+I\s+missing|should\s+I\s+learn)\b",
    ],
    "general_question": [],  # Fallback
}


def detect_intent(message: str) -> str:
    """Match user message against intent patterns. Returns intent name."""
    message_lower = message.lower().strip()
    for intent, patterns in INTENT_PATTERNS.items():
        if intent == "general_question":
            continue
        for pattern in patterns:
            if re.search(pattern, message_lower):
                return intent
    return "general_question"


# ─────────────────────────────────────────────
# RULE-BASED HANDLERS (no LLM call)
# ─────────────────────────────────────────────

async def handle_show_matches(user_id: str) -> str:
    """Fetch top matches from DB and format as text."""
    prisma = get_prisma()
    profile = await prisma.studentprofile.find_unique(where={"userId": user_id})
    if not profile:
        return "You don't have a profile yet. Please complete onboarding first!"

    matches = await prisma.matchscore.find_many(
        where={"studentId": profile.id},
        order={"finalScore": "desc"},
        take=5,
        include={"job": True},
    )

    if not matches:
        return (
            "🔍 No matches yet! Matches appear once recruiters post jobs "
            "and the matching engine runs.\n\n"
            "💡 **Tip:** Complete your profile and upload your resume for better matches."
        )

    lines = ["🎯 **Your Top Job Matches:**\n"]
    for i, m in enumerate(matches, 1):
        job = m.job
        score_pct = round(m.finalScore * 100, 1)
        title = job.title if job else "Unknown Role"
        work_mode = getattr(job, "workMode", "")
        location = getattr(job, "location", "") or "Remote"
        display_loc = work_mode if work_mode else location
        lines.append(f"{i}. **{title}** — {display_loc} ✦ Match: **{score_pct}%**")

    lines.append(
        '\n💬 Ask _"Why did I match with [job title]?"_ for a detailed AI explanation.'
    )
    return "\n".join(lines)


async def handle_show_applications(user_id: str) -> str:
    """Fetch user's applications from DB."""
    prisma = get_prisma()
    profile = await prisma.studentprofile.find_unique(where={"userId": user_id})
    if not profile:
        return "You don't have a profile yet. Please complete onboarding first!"

    apps = await prisma.application.find_many(
        where={"studentId": profile.id},
        include={"job": True},
        order={"appliedAt": "desc"},
        take=10,
    )

    if not apps:
        return (
            "📭 You haven't applied to any jobs yet.\n\n"
            "Check your matches and start applying!"
        )

    status_emoji = {
        "PENDING": "🟡",
        "REVIEWED": "🔵",
        "SHORTLISTED": "🟢",
        "REJECTED": "🔴",
        "ACCEPTED": "✅",
    }

    lines = ["📋 **Your Applications:**\n"]
    for a in apps:
        title = a.job.title if a.job else "Unknown"
        emoji = status_emoji.get(a.status, "⚪")
        lines.append(f"{emoji} **{title}** — {a.status}")
    return "\n".join(lines)


# NEW: Show available jobs (browse all open positions)
async def handle_show_jobs(user_id: str) -> str:
    """Fetch recent active job postings."""
    prisma = get_prisma()

    jobs = await prisma.job.find_many(
        where={"isActive": True},
        order={"createdAt": "desc"},
        take=8,
    )

    if not jobs:
        return (
            "📭 No job listings yet. Recruiters are still posting — check back soon!\n\n"
            "💡 In the meantime, ask me to _\"show my matches\"_ for personalized recommendations."
        )

    lines = ["💼 **Available Jobs:**\n"]
    for i, job in enumerate(jobs, 1):
        work_mode = getattr(job, "workMode", "") or ""
        location = getattr(job, "location", "") or "Remote"
        display_loc = f"{work_mode} · {location}" if work_mode and work_mode != "REMOTE" else work_mode or location
        salary = ""
        if getattr(job, "salaryMin", None) and getattr(job, "salaryMax", None):
            salary = f" · ₹{job.salaryMin//1000}K–{job.salaryMax//1000}K"
        lines.append(f"{i}. **{job.title}** — {display_loc}{salary}")

    lines.append(
        "\n💬 Ask _\"Show my matches\"_ to see which of these are best for you!"
    )
    return "\n".join(lines)


# FIX: apply_to_job now handles both numbered refs ("apply to job 3")
#      and UUID refs ("apply to job abc-123...").
#      Previously only UUID format worked.
async def handle_apply_to_job(user_id: str, message: str) -> str:
    """Parse job reference from message and create application."""
    prisma = get_prisma()
    profile = await prisma.studentprofile.find_unique(where={"userId": user_id})
    if not profile:
        return "You need a profile first. Please complete onboarding!"

    job = None

    # Try UUID format first
    uuid_match = re.search(r"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}", message)
    if uuid_match:
        job = await prisma.job.find_unique(where={"id": uuid_match.group(0)})

    # Try numbered reference (e.g. "apply to job 3" — from the matches list)
    if not job:
        num_match = re.search(r"(?:job\s+)?#?(\d+)", message.lower())
        if num_match:
            position = int(num_match.group(1)) - 1  # 0-indexed
            matches = await prisma.matchscore.find_many(
                where={"studentId": profile.id},
                order={"finalScore": "desc"},
                take=position + 1,
                include={"job": True},
            )
            if matches and position < len(matches):
                job = matches[position].job

    if not job:
        return (
            "I couldn't find that job. Try:\n"
            "• _\"Apply to job 1\"_ — to apply to your top match\n"
            "• _\"Show my matches\"_ — to see your matches first"
        )

    existing = await prisma.application.find_first(
        where={"studentId": profile.id, "jobId": job.id},
    )
    if existing:
        return f"You've already applied to **{job.title}**. Status: **{existing.status}**"

    await prisma.application.create(
        data={"studentId": profile.id, "jobId": job.id},
    )
    return (
        f"✅ Successfully applied to **{job.title}**!\n\n"
        "You'll be notified when the recruiter reviews your application.\n"
        "Track it with _\"Show my applications\"_."
    )


RULE_HANDLERS: dict[str, Any] = {
    "show_matches": handle_show_matches,
    "show_applications": handle_show_applications,
    "show_jobs": handle_show_jobs,
}


# ─────────────────────────────────────────────
# CONTEXT BUILDER (for LLM prompts)
# ─────────────────────────────────────────────

async def build_context(user_id: str) -> str:
    """Build rich context string injected into LLM prompts."""
    prisma = get_prisma()
    parts: list[str] = []

    profile = await prisma.studentprofile.find_unique(
        where={"userId": user_id},
        include={"studentSkills": {"include": {"skill": True}}},
    )
    if profile:
        skills = [ss.skill.name for ss in profile.studentSkills if ss.skill]
        parts.append(
            f"Student Profile:\n"
            f"- Name: {profile.fullName}\n"
            f"- College: {getattr(profile, 'college', 'N/A')}\n"
            f"- Degree: {profile.degree or 'N/A'} {profile.branch or ''}\n"
            f"- CGPA: {getattr(profile, 'cgpa', 'N/A')}\n"
            f"- Graduation: {profile.graduationYear or 'N/A'}\n"
            f"- Skills: {', '.join(skills) if skills else 'None listed'}\n"
            f"- Preferred Roles: {', '.join(profile.preferredRoles) if profile.preferredRoles else 'N/A'}\n"
            f"- Experience: {profile.experienceLevel or 'N/A'}\n"
            f"- Location: {profile.location or 'N/A'}"
        )

        # Top matches with SHAP
        matches = await prisma.matchscore.find_many(
            where={"studentId": profile.id},
            order={"finalScore": "desc"},
            take=3,
            include={"job": True},
        )
        if matches:
            match_lines = ["Top Matches:"]
            for m in matches:
                title = m.job.title if m.job else "Unknown"
                score = round(m.finalScore * 100, 1)
                shap_str = ""
                if m.shapValues and isinstance(m.shapValues, dict):
                    top_factors = sorted(
                        m.shapValues.items(), key=lambda x: abs(x[1]), reverse=True
                    )[:3]
                    shap_str = " | Top factors: " + ", ".join(
                        f"{k}: {v:+.2f}" for k, v in top_factors
                    )
                match_lines.append(f"- {title} ({score}%){shap_str}")
            parts.append("\n".join(match_lines))

        # Application stats
        apps = await prisma.application.find_many(where={"studentId": profile.id})
        if apps:
            by_status: dict[str, int] = {}
            for a in apps:
                by_status[a.status] = by_status.get(a.status, 0) + 1
            status_str = ", ".join(f"{k}: {v}" for k, v in by_status.items())
            parts.append(f"Applications: {len(apps)} total ({status_str})")

    context = "\n\n".join(parts)
    return context[:4000] if context else "No profile data available."


# ─────────────────────────────────────────────
# LLM-BASED HANDLERS
# ─────────────────────────────────────────────
# FIX: All LLM calls now wrapped in try/except
#      Falls back to a helpful rule-based message if Ollama is down

LLM_FALLBACK_RESPONSES: dict[str, str] = {
    "why_matched": (
        "⚠️ AI explanation is temporarily unavailable.\n\n"
        "Your match score is based on: skill overlap, preferred roles, "
        "experience level, and location preference. "
        "Check back in a moment for a detailed explanation!"
    ),
    "improve_resume": (
        "⚠️ AI tips are temporarily unavailable.\n\n"
        "General resume tips:\n"
        "• Add measurable achievements (e.g. \"Improved load time by 40%\")\n"
        "• Keep it to 1 page for freshers\n"
        "• List skills matching the job description\n"
        "• Add GitHub/portfolio links"
    ),
    "general_question": (
        "⚠️ I'm having trouble connecting to the AI right now.\n\n"
        "Try asking:\n"
        "• _\"Show my matches\"_\n"
        "• _\"Show my applications\"_\n"
        "• _\"Show available jobs\"_"
    ),
}


async def handle_llm_intent(
    user_id: str,
    intent: str,
    message: str,
    history: list[dict],
) -> str:
    """Route LLM-based intents with injected context. Falls back gracefully."""
    try:
        context = await build_context(user_id)

        intent_instructions = {
            "why_matched": (
                "The student is asking why they matched with a specific job. "
                "Use the SHAP factors from the context to explain clearly and simply. "
                "Be specific about which skills and profile factors contributed most. "
                "Keep the response under 200 words."
            ),
            "improve_resume": (
                "Give specific, actionable resume improvement tips based on the student's "
                "profile and skill gaps visible in their match data. "
                "Suggest 3-5 concrete additions. Reference their actual skills and roles. "
                "Do not give generic advice."
            ),
            "general_question": (
                "Answer the student's career-related question helpfully and concisely. "
                "Reference their profile context when relevant. "
                "Keep the response focused and under 150 words."
            ),
        }

        instruction = intent_instructions.get(
            intent, intent_instructions["general_question"]
        )

        system_prompt = (
            f"{llm_provider.TALENTSYNC_SYSTEM_PROMPT}\n\n"
            f"--- STUDENT CONTEXT ---\n{context}\n\n"
            f"--- INSTRUCTION ---\n{instruction}"
        )

        recent_history = history[-10:] if history else []

        return await llm_provider.generate(
            prompt=message,
            history=recent_history,
            system_prompt=system_prompt,
        )

    except Exception:
        logger.exception("LLM call failed for user=%s intent=%s", user_id, intent)
        return LLM_FALLBACK_RESPONSES.get(
            intent, LLM_FALLBACK_RESPONSES["general_question"]
        )


# ─────────────────────────────────────────────
# MASTER ORCHESTRATOR
# ─────────────────────────────────────────────

async def get_or_create_session(
    user_id: str,
    session_id: str | None = None,
    force_assistant: bool = False,
) -> Any:
    """Get existing session or create a new one."""
    prisma = get_prisma()

    async def should_start_onboarding() -> bool:
        """Only new users (with sparse profile data) should enter onboarding."""
        profile = await prisma.studentprofile.find_unique(
            where={"userId": user_id},
            include={"studentSkills": True},
        )

        if not profile:
            return True

        has_profile_data = any(
            [
                bool(profile.degree),
                bool(profile.branch),
                bool(profile.graduationYear),
                bool(profile.college),
                bool(profile.cgpa),
                bool(profile.experienceLevel),
                bool(profile.preferredRoles),
                bool(profile.studentSkills),
            ]
        )
        return not has_profile_data

    if session_id:
        session = await prisma.chatbotsession.find_first(
            where={"id": session_id, "userId": user_id},
        )
        if session:
            if force_assistant and session.mode != "CAREER_ASSISTANT":
                session = await prisma.chatbotsession.update(
                    where={"id": session.id},
                    data={
                        "onboardingStep": "COMPLETED",
                        "mode": "CAREER_ASSISTANT",
                        "isComplete": True,
                    },
                )
                return session

            # If user already has profile data, force assistant mode even for old onboarding sessions.
            if session.mode == "ONBOARDING" and not await should_start_onboarding():
                session = await prisma.chatbotsession.update(
                    where={"id": session.id},
                    data={
                        "onboardingStep": "COMPLETED",
                        "mode": "CAREER_ASSISTANT",
                        "isComplete": True,
                    },
                )
            return session

    onboarding_required = False if force_assistant else await should_start_onboarding()

    return await prisma.chatbotsession.create(
        data={
            "userId": user_id,
            "messages": Json([]),
            "onboardingStep": "GREETING" if onboarding_required else "COMPLETED",
            "mode": "ONBOARDING" if onboarding_required else "CAREER_ASSISTANT",
            "isComplete": not onboarding_required,
        },
    )


async def process_message(
    user_id: str,
    message: str,
    session_id: str | None = None,
    force_assistant: bool = False,
) -> dict[str, Any]:
    """Master orchestrator — routes between onboarding and career assistant."""
    session = await get_or_create_session(
        user_id=user_id,
        session_id=session_id,
        force_assistant=force_assistant,
    )
    prisma = get_prisma()

    mode = session.mode
    current_step = session.onboardingStep
    extracted_data = session.extractedData or {}
    if isinstance(extracted_data, str):
        try:
            extracted_data = json.loads(extracted_data)
        except json.JSONDecodeError:
            extracted_data = {}

    profile_complete = session.isComplete

    # Don't save bootstrap greeting as a user message
    normalized_message = message.strip().lower()
    is_bootstrap_greeting = (
        mode == "ONBOARDING"
        and current_step == "GREETING"
        and normalized_message in {"hi", "hello", "start", "hey"}
    )

    if not is_bootstrap_greeting:
        await prisma.chatmessage.create(
            data={"sessionId": session.id, "role": "user", "content": message},
        )

    # ─── ONBOARDING MODE ───
    if mode == "ONBOARDING" and current_step != "COMPLETED":
        response_text, next_step, updated_data, saved = await handle_onboarding_step(
            session_id=session.id,
            user_id=user_id,
            current_step=current_step,
            user_message=message,
            extracted_data=extracted_data,
        )

        new_mode = "CAREER_ASSISTANT" if next_step == "COMPLETED" else "ONBOARDING"
        profile_complete = saved or profile_complete

        await prisma.chatbotsession.update(
            where={"id": session.id},
            data={
                "onboardingStep": next_step,
                "mode": new_mode,
                "extractedData": Json(updated_data),
                "isComplete": profile_complete,
            },
        )

        await prisma.chatmessage.create(
            data={"sessionId": session.id, "role": "assistant", "content": response_text},
        )

        return {
            "response": response_text,
            "session_id": session.id,
            "mode": new_mode,
            "onboarding_step": next_step,
            "profile_complete": profile_complete,
            "intent": None,
        }

    # ─── CAREER ASSISTANT MODE ───
    intent = detect_intent(message)

    if intent == "apply_to_job":
        response_text = await handle_apply_to_job(user_id, message)
    elif intent in RULE_HANDLERS:
        handler = RULE_HANDLERS[intent]
        response_text = await handler(user_id)
    else:
        recent_msgs = await prisma.chatmessage.find_many(
            where={"sessionId": session.id},
            order={"createdAt": "desc"},
            take=12,
        )
        history = [
            {"role": m.role, "content": m.content}
            for m in reversed(recent_msgs)
        ]
        profile_context = await build_context(user_id)
        handle_career_intent = _get_career_intent_handler()
        response_text = await handle_career_intent(
            user_id=user_id,
            intent=intent,
            message=message,
            history=history,
            profile_context=profile_context,
        )

    await prisma.chatmessage.create(
        data={
            "sessionId": session.id,
            "role": "assistant",
            "content": response_text,
            "intent": intent,
        },
    )

    return {
        "response": response_text,
        "session_id": session.id,
        "mode": "CAREER_ASSISTANT",
        "onboarding_step": None,
        "profile_complete": True,
        "intent": intent,
    }