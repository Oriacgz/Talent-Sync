"""
backend/app/services/matching_service.py
Orchestrates encoder + scorer + explainer against the live DB.
Uses EmbeddingCache to avoid re-encoding unchanged profiles/jobs.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

import numpy as np

from app.db.database import get_prisma
from app.ml import encoder, scorer, explainer

logger = logging.getLogger(__name__)

TOP_N_SAVE = 20     # save top N matches to DB
TOP_N_RETURN = 10   # return top N to API caller


# ── Helpers ───────────────────────────────────────────────────────────────────

def _text_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def _profile_to_dict(profile, skills: list[str]) -> dict:
    """Convert Prisma StudentProfile → plain dict for ML functions."""
    return {
        "skills": skills,
        "degree": profile.degree or "",
        "branch": profile.branch or "",
        "cgpa": profile.cgpa or 0.0,
        "experienceLevel": profile.experienceLevel or "",
        "preferredRoles": list(profile.preferredRoles or []),
        "preferredLocations": list(profile.preferredLocations or []),
    }


def _job_to_dict(job, job_skills: list[str]) -> dict:
    """Convert Prisma Job → plain dict for ML functions."""
    return {
        "title": job.title,
        "skills": job_skills,
        "experienceLevel": str(job.experienceLevel) if job.experienceLevel else "",
        "education": job.education or "Any",
        "location": job.location or "",
        "jobType": str(job.jobType) if job.jobType else "",
        "workMode": str(job.workMode) if job.workMode else "",
        "minCgpa": job.minCgpa or 0.0,
        "eligibleBranches": list(job.eligibleBranches or []),
    }


async def _get_student_embedding(
    prisma, profile_id: str, student_dict: dict
) -> np.ndarray:
    """Return cached embedding or encode fresh."""
    text = encoder._student_text(student_dict)
    h = _text_hash(text)

    cache = await prisma.embeddingcache.find_unique(where={"studentId": profile_id})
    if cache and cache.inputHash == h and cache.embedding:
        return np.array(cache.embedding, dtype=np.float32)

    emb = encoder.encode_student(student_dict)
    await prisma.embeddingcache.upsert(
        where={"studentId": profile_id},
        data={
            "create": {
                "studentId": profile_id,
                "embedding": emb.tolist(),
                "inputHash": h,
            },
            "update": {
                "embedding": emb.tolist(),
                "inputHash": h,
            },
        },
    )
    return emb


async def _get_job_embedding(
    prisma, job_id: str, job_dict: dict
) -> np.ndarray:
    """Return cached embedding or encode fresh."""
    text = encoder._job_text(job_dict)
    h = _text_hash(text)

    cache = await prisma.embeddingcache.find_unique(where={"jobId": job_id})
    if cache and cache.inputHash == h and cache.embedding:
        return np.array(cache.embedding, dtype=np.float32)

    emb = encoder.encode_job(job_dict)
    await prisma.embeddingcache.upsert(
        where={"jobId": job_id},
        data={
            "create": {
                "jobId": job_id,
                "embedding": emb.tolist(),
                "inputHash": h,
            },
            "update": {
                "embedding": emb.tolist(),
                "inputHash": h,
            },
        },
    )
    return emb


# ── Core matching functions ───────────────────────────────────────────────────

async def run_matching_for_student(
    student_user_id: str,
    force_refresh: bool = False,
) -> list[dict[str, Any]]:
    """
    Match one student against all active jobs.
    Returns top 10 matches with scores + explanations.
    """
    prisma = get_prisma()

    # Load student
    profile = await prisma.studentprofile.find_unique(
        where={"userId": student_user_id},
        include={"studentSkills": {"include": {"skill": True}}},
    )
    if not profile:
        raise ValueError(f"No student profile for user {student_user_id}")

    skills = [ss.skill.name for ss in (profile.studentSkills or []) if ss.skill]
    student_dict = _profile_to_dict(profile, skills)

    # Load active jobs with their skills
    jobs = await prisma.job.find_many(
        where={"isActive": True},
        include={"jobSkills": {"include": {"skill": True}}},
    )
    if not jobs:
        logger.info("No active jobs to match against.")
        return []

    # Get student embedding (cached)
    student_emb = await _get_student_embedding(prisma, profile.id, student_dict)

    # Score all jobs
    results: list[dict] = []
    for job in jobs:
        try:
            job_skills = [js.skill.name for js in (job.jobSkills or []) if js.skill]
            job_dict = _job_to_dict(job, job_skills)

            # Get job embedding (cached)
            job_emb = await _get_job_embedding(prisma, job.id, job_dict)

            similarity = encoder.cosine_similarity(student_emb, job_emb)
            final_score = scorer.score(student_dict, job_dict, similarity)
            explanation = explainer.explain(student_dict, job_dict, similarity)

            results.append({
                "job_id": job.id,
                "job": job,
                "job_dict": job_dict,
                "similarity_score": similarity,
                "final_score": final_score,
                "ml_score": explanation["score_breakdown"]["ml_score"],
                "shap_values": explanation["shap_values"],
                "top_reasons": explanation["top_reasons"],
                "score_breakdown": explanation["score_breakdown"],
            })
        except Exception:
            logger.exception("Failed to score job %s for student %s", job.id, profile.id)
            continue

    # Sort by final score
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # Save top N to MatchScore table
    top_to_save = results[:TOP_N_SAVE]
    for rank, result in enumerate(top_to_save, 1):
        try:
            await prisma.matchscore.upsert(
                where={
                    "studentId_jobId": {
                        "studentId": profile.id,
                        "jobId": result["job_id"],
                    }
                },
                data={
                    "create": {
                        "studentId": profile.id,
                        "jobId": result["job_id"],
                        "similarityScore": result["similarity_score"],
                        "ruleScore": result["ml_score"],
                        "finalScore": result["final_score"],
                        "rank": rank,
                        "shapValues": result["shap_values"],
                        "explanation": " | ".join(result["top_reasons"]),
                    },
                    "update": {
                        "similarityScore": result["similarity_score"],
                        "ruleScore": result["ml_score"],
                        "finalScore": result["final_score"],
                        "rank": rank,
                        "shapValues": result["shap_values"],
                        "explanation": " | ".join(result["top_reasons"]),
                    },
                },
            )
        except Exception:
            logger.exception("Failed to upsert MatchScore for job %s", result["job_id"])

    return results[:TOP_N_RETURN]


async def run_matching_for_job(
    job_id: str,
    recruiter_user_id: str,
) -> list[dict[str, Any]]:
    """
    Rank all students for one job posting.
    Used by recruiter to see ranked candidates.
    """
    prisma = get_prisma()

    job = await prisma.job.find_unique(
        where={"id": job_id},
        include={"jobSkills": {"include": {"skill": True}}, "recruiter": True},
    )
    if not job:
        raise ValueError(f"Job {job_id} not found")

    if job.recruiter.userId != recruiter_user_id:
        raise PermissionError("You do not own this job posting")

    job_skills = [js.skill.name for js in (job.jobSkills or []) if js.skill]
    job_dict = _job_to_dict(job, job_skills)
    job_emb = await _get_job_embedding(prisma, job.id, job_dict)

    # Load all students
    profiles = await prisma.studentprofile.find_many(
        include={"studentSkills": {"include": {"skill": True}}},
    )

    results: list[dict] = []
    for profile in profiles:
        try:
            skills = [ss.skill.name for ss in (profile.studentSkills or []) if ss.skill]
            student_dict = _profile_to_dict(profile, skills)
            student_emb = await _get_student_embedding(prisma, profile.id, student_dict)

            similarity = encoder.cosine_similarity(student_emb, job_emb)
            final_score = scorer.score(student_dict, job_dict, similarity)
            explanation = explainer.explain(student_dict, job_dict, similarity)

            results.append({
                "student_id": profile.id,
                "student_name": profile.fullName,
                "final_score": final_score,
                "similarity_score": similarity,
                "top_reasons": explanation["top_reasons"],
                "shap_values": explanation["shap_values"],
            })
        except Exception:
            logger.exception("Failed to score student %s for job %s", profile.id, job_id)
            continue

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results[:20]