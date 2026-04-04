"""Resume parsing utilities.

This module extracts plain text from PDFs and derives lightweight signals used by
profile auto-fill (skills + GPA/percentage).
"""

from __future__ import annotations

import io
import re

from pdfminer.high_level import extract_text

# Lightweight vocab to keep parsing deterministic and fast.
SKILL_VOCAB = {
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "node",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "machine learning",
    "deep learning",
    "nlp",
    "pandas",
    "numpy",
    "scikit-learn",
    "pytorch",
    "tensorflow",
    "git",
    "tailwind",
    "html",
    "css",
}


def _normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _extract_skills(text: str) -> list[str]:
    lowered = (text or "").lower()
    found: list[str] = []
    for skill in sorted(SKILL_VOCAB):
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lowered):
            found.append(skill.title())
    return found


def _extract_cgpa_or_percentage(text: str) -> float | None:
    lowered = (text or "").lower()

    # CGPA style values: 8.4 / 10, CGPA: 8.4
    cgpa_match = re.search(r"(?:cgpa|gpa)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)", lowered)
    if cgpa_match:
        value = float(cgpa_match.group(1))
        # Keep plausible GPA scale values only.
        if 0 <= value <= 10:
            return value

    # Percentage values: 84%, 84.5 percent
    pct_match = re.search(r"(\d{2}(?:\.\d{1,2})?)\s*(?:%|percent)", lowered)
    if pct_match:
        value = float(pct_match.group(1))
        if 0 <= value <= 100:
            # Convert to GPA-like scale for downstream compatibility.
            return round(value / 10.0, 2)

    return None


def parse_resume(file_bytes: bytes) -> dict:
    """Extract text + lightweight structured data from a PDF byte stream."""
    text = ""
    try:
        text = extract_text(io.BytesIO(file_bytes)) or ""
    except Exception:
        text = ""

    normalized = _normalize_space(text)
    skills = _extract_skills(normalized)
    cgpa = _extract_cgpa_or_percentage(normalized)

    return {
        "text": normalized,
        "skills": skills,
        "cgpa": cgpa,
    }