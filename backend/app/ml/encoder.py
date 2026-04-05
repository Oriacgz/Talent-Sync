"""
backend/app/ml/encoder.py
Encodes student profiles and job postings using SBERT.
Lazy-loaded singleton via app/ml/__init__.py
"""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer


class ProfileEncoder:
    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self) -> None:
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.MODEL_NAME)
        return self._model

    # ── Text builders ─────────────────────────────────────────────────────────

    def _student_text(self, profile: dict) -> str:
        skills = ", ".join(profile.get("skills", []))
        roles = ", ".join(profile.get("preferred_roles", []))
        locations = ", ".join(profile.get("preferred_locations", []))
        return (
            f"Skills: {skills}. "
            f"Degree: {profile.get('degree', '')} {profile.get('branch', '')}. "
            f"Roles: {roles}. "
            f"Experience: {profile.get('experience_level', '')}. "
            f"Location: {locations}."
        )

    def _job_text(self, job: dict) -> str:
        skills = ", ".join(job.get("skills", job.get("required_skills", [])))
        return (
            f"Title: {job.get('title', '')}. "
            f"Required Skills: {skills}. "
            f"Experience: {job.get('experience_level', job.get('experienceLevel', ''))}. "
            f"Education: {job.get('education', '')}. "
            f"Location: {job.get('location', '')}. "
            f"Type: {job.get('job_type', job.get('jobType', ''))}. "
            f"Mode: {job.get('work_mode', job.get('workMode', ''))}."
        )

    # ── Public API ────────────────────────────────────────────────────────────

    def encode_student(self, profile: dict) -> np.ndarray:
        """Returns 384-dim SBERT embedding for a student profile."""
        text = self._student_text(profile)
        return self.model.encode(text, convert_to_numpy=True)

    def encode_job(self, job: dict) -> np.ndarray:
        """Returns 384-dim SBERT embedding for a job posting."""
        text = self._job_text(job)
        return self.model.encode(text, convert_to_numpy=True)

    def encode_batch(self, texts: list[str]) -> np.ndarray:
        """Encode a list of raw texts. Used for batch processing."""
        return self.model.encode(texts, convert_to_numpy=True, batch_size=64)

    @staticmethod
    def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Cosine similarity between two vectors. Returns float 0–1."""
        denom = np.linalg.norm(vec1) * np.linalg.norm(vec2)
        if denom < 1e-8:
            return 0.0
        return float(np.dot(vec1, vec2) / denom)