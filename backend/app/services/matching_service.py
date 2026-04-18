"""
backend/app/services/matching_service.py
Orchestrates encoder + scorer + explainer against the live DB.
Uses EmbeddingCache to avoid re-encoding unchanged profiles/jobs.
"""

from __future__ import annotations

import hashlib
import logging
import re
from typing import Any
from uuid import uuid4

import numpy as np

from app.db.database import get_prisma
from app.ml import encoder, scorer, explainer

logger = logging.getLogger(__name__)

TOP_N_SAVE = 20     # save top N matches to DB
TOP_N_RETURN = 10   # return top N to API caller
MIN_SKILL_OVERLAP_RATIO = 0.25  # avoid recommending domain-mismatched jobs on a single generic skill
GENERIC_OVERLAP_SKILLS = {
    "python",
    "git",
    "excel",
    "communication",
    "problem solving",
    "teamwork",
}


# ── Helpers ───────────────────────────────────────────────────────────────────


import json


_MATCHSCORE_UPSERT_SQL = '''
INSERT INTO "MatchScore" (
    "id",
    "studentId",
    "jobId",
    "similarityScore",
    "ruleScore",
    "finalScore",
    "rank",
    "shapValues",
    "explanation",
    "status",
    "createdAt",
    "updatedAt"
)
VALUES ($1, $2, $3, $4, $5, $6, $7, CAST($8 AS jsonb), $9, CAST($10 AS "MatchStatus"), NOW(), NOW())
ON CONFLICT ("studentId", "jobId")
DO UPDATE SET
    "similarityScore" = EXCLUDED."similarityScore",
    "ruleScore" = EXCLUDED."ruleScore",
    "finalScore" = EXCLUDED."finalScore",
    "rank" = EXCLUDED."rank",
    "shapValues" = EXCLUDED."shapValues",
    "explanation" = EXCLUDED."explanation",
    "updatedAt" = NOW()
'''

def _text_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def _to_json_text(value: Any) -> str:
    """Convert objects (including numpy scalars) into JSON text for raw SQL writes."""
    def _default(obj: Any):
        if isinstance(obj, np.generic):
            return obj.item()
        raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

    return json.dumps(value if value is not None else {}, default=_default)


def _normalize_skill_name(skill: str) -> str:
    name = str(skill or "").strip().lower()
    if not name:
        return ""

    # Remove parenthetical qualifiers like "(ES6+)" to improve canonical matching.
    name = re.sub(r"\([^)]*\)", " ", name)
    name = name.replace(".js", " js")
    name = re.sub(r"[^a-z0-9#+]+", " ", name).strip()
    name = re.sub(r"\s+", " ", name)

    if name in {"js", "javascript es6", "javascript es6+"}:
        return "javascript"
    if name.startswith("javascript "):
        return "javascript"
    if name in {"node js", "nodejs"}:
        return "nodejs"
    if name in {"react js", "reactjs"}:
        return "react"
    if name in {"express js", "expressjs"}:
        return "express"

    return name


def _normalized_skill_set(skills: list[str]) -> set[str]:
    normalized = {
        _normalize_skill_name(skill)
        for skill in skills
        if _normalize_skill_name(skill)
    }
    return normalized


def has_meaningful_skill_overlap(student_skills: list[str] | None, job_skills: list[str] | None) -> bool:
    """Return True when overlap passes current skill-gating policy."""
    student_skill_set = _normalized_skill_set(student_skills or [])
    job_skill_set = _normalized_skill_set(job_skills or [])

    # If one side has no explicit skills, don't hard-block recommendation.
    if not student_skill_set or not job_skill_set:
        return True

    overlap_skills = student_skill_set.intersection(job_skill_set)
    overlap_count = len(overlap_skills)
    if overlap_count == 0:
        return False

    # Reject purely generic overlaps (e.g., only Python/Git) so domain-mismatched
    # jobs don't appear when student lacks role-specific skills.
    if all(skill in GENERIC_OVERLAP_SKILLS for skill in overlap_skills):
        return False

    overlap_ratio = overlap_count / max(1, len(job_skill_set))
    if overlap_ratio < MIN_SKILL_OVERLAP_RATIO:
        return False

    return True

def _profile_hash(student_dict: dict, text: str) -> str:
    # Includes text ensuring semantic integrity + functional metadata integrity
    data = {
        "text": text,
        "skills": student_dict.get("skills", []),
        "preferred_roles": student_dict.get("preferredRoles", []),
        "cgpa": student_dict.get("cgpa", 0),
        "backlogs": student_dict.get("backlogs", 0),
        "branch": student_dict.get("branch", ""),
        "experience": student_dict.get("experience_months", 0),
        "locations": student_dict.get("preferredLocations", [])
    }
    return hashlib.md5(json.dumps(data, sort_keys=True).encode("utf-8")).hexdigest()


def _profile_to_dict(profile, skills: list[str]) -> dict:
    """Convert Prisma StudentProfile → plain dict for ML functions.
    Emits both camelCase and snake_case keys so encoder + scorer both work."""
    exp_level = profile.experienceLevel or ""
    pref_roles = list(profile.preferredRoles or [])
    pref_locs = list(profile.preferredLocations or [])
    return {
        "skills": skills,
        "degree": profile.degree or "",
        "branch": profile.branch or "",
        "cgpa": profile.cgpa or 0.0,
        "backlogs": getattr(profile, "backlogs", 0) or 0,
        "experience_months": getattr(profile, "experienceMonths", 0) or 0,
        # snake_case for encoder / scorer
        "experience_level": exp_level,
        "preferred_roles": pref_roles,
        "preferred_locations": pref_locs,
        # camelCase for backward compat
        "experienceLevel": exp_level,
        "preferredRoles": pref_roles,
        "preferredLocations": pref_locs,
    }


def _job_to_dict(job, job_skills: list[str]) -> dict:
    """Convert Prisma Job → plain dict for ML functions.
    Emits both camelCase and snake_case keys."""
    exp_level = str(job.experienceLevel) if job.experienceLevel else ""
    return {
        "title": job.title,
        "skills": job_skills,
        "required_skills": job_skills,
        # snake_case
        "experience_level": exp_level,
        "required_experience_months": getattr(job, "requiredExperienceMonths", 0) or 0,
        "min_cgpa": job.minCgpa or 0.0,
        "backlog_allowed": getattr(job, "backlogAllowed", True),
        # camelCase
        "experienceLevel": exp_level,
        "requiredExperienceMonths": getattr(job, "requiredExperienceMonths", 0) or 0,
        "minCgpa": job.minCgpa or 0.0,
        "backlogAllowed": getattr(job, "backlogAllowed", True),
        # Shared
        "education": job.education or "Any",
        "location": job.location or "",
        "jobType": str(job.jobType) if job.jobType else "",
        "workMode": str(job.workMode) if job.workMode else "",
        "eligibleBranches": list(job.eligibleBranches or []),
    }


def _is_branch_eligible(student_branch: str | None, eligible_branches: list[str] | set[str] | None) -> bool:
    """Return True if student branch passes job branch eligibility rules.

    Treats "Any" (case-insensitive) as a wildcard branch.
    """
    normalized_allowed = {
        str(branch or "").strip().lower()
        for branch in (eligible_branches or [])
        if str(branch or "").strip()
    }
    if not normalized_allowed:
        return True
    if "any" in normalized_allowed or "*" in normalized_allowed:
        return True

    normalized_student_branch = str(student_branch or "").strip().lower()
    if not normalized_student_branch:
        return False
    return normalized_student_branch in normalized_allowed


async def _get_student_embedding(
    prisma, profile_id: str, student_dict: dict
) -> np.ndarray:
    """Return cached embedding or encode fresh."""
    text = encoder._student_text(student_dict)
    h = _profile_hash(student_dict, text)

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
    Uses 4-Stage Pipeline: Eligibility Gate -> Retrieval -> Re-ranking -> Diversity
    """
    try:
        prisma = get_prisma()

        profile = await prisma.studentprofile.find_unique(
            where={"userId": student_user_id},
            include={"studentSkills": {"include": {"skill": True}}},
        )
        if not profile:
            raise ValueError(f"No student profile for user {student_user_id}")

        if force_refresh:
            await prisma.matchscore.delete_many(where={"studentId": profile.id})

        skills = [ss.skill.name for ss in (profile.studentSkills or []) if ss.skill]
        student_dict = _profile_to_dict(profile, skills)

        jobs = await prisma.job.find_many(
            where={"isActive": True},
            include={"jobSkills": {"include": {"skill": True}}, "recruiter": True},
        )
        if not jobs:
            return []

        # ── Stage 1: Hard Gate Eligibility ──
        eligible_jobs = []
        student_skill_set = _normalized_skill_set(skills)
        for job in jobs:
            job_skills = [js.skill.name for js in (job.jobSkills or []) if js.skill]
            job_skill_set = _normalized_skill_set(job_skills)

            if float(student_dict["cgpa"]) < float(job.minCgpa or 0.0):
                continue
            if int(student_dict["backlogs"]) > 0 and not getattr(job, "backlogAllowed", True):
                continue
            if not _is_branch_eligible(student_dict.get("branch"), job.eligibleBranches):
                continue

            # Require meaningful shared skills when both profiles define skills.
            if not has_meaningful_skill_overlap(skills, job_skills):
                continue

            eligible_jobs.append((job, job_skills))

        if not eligible_jobs:
            return []

        # ── Stage 2: Retrieval ──
        student_emb = await _get_student_embedding(prisma, profile.id, student_dict)
        retrieved = []
        for job, job_skills in eligible_jobs:
            job_dict = _job_to_dict(job, job_skills)
            job_emb = await _get_job_embedding(prisma, job.id, job_dict)
            sim = encoder.cosine_similarity(student_emb, job_emb)
            retrieved.append((job, job_dict, job_skills, job_emb, sim))

        retrieved.sort(key=lambda x: x[4], reverse=True)
        top_k = retrieved[:50]  # Take top 50

        # Cold Start Trigger
        app_count = await prisma.application.count(where={"studentId": profile.id})
        is_cold_start = app_count < 3

        # ── Stage 3: XGBoost Re-ranking ──
        results = []
        if not scorer.has_model:
            # Fallback Pipeline
            for j, j_dict, j_skills, j_emb, sim in top_k:
                missing = [
                    s for s in j_skills
                    if _normalize_skill_name(s) not in student_skill_set
                ]
                results.append({
                    "job_id": j.id,
                    "job": j,
                    "job_dict": j_dict,
                    "required_skills": j_skills,
                    "missing_skills": missing,
                    "similarity_score": sim,
                    "final_score": round(sim, 4),
                    "ml_score": 0.0,
                    "shap_values": {},
                    "top_reasons": ["Matched using fallback similarity engine"],
                    "score_breakdown": {
                        "similarity_score": sim,
                        "ml_score": 0.0,
                        "final_score": round(sim, 4),
                    },
                })
        else:
            # Batch Inference Extraction
            jobs_dicts = [j_dict for _, j_dict, _, _, _ in top_k]
            similarities = [sim for _, _, _, _, sim in top_k]
            final_scores, ml_scores = scorer.score_batch(student_dict, jobs_dicts, similarities)

            for i, (j, j_dict, j_skills, j_emb, sim) in enumerate(top_k):
                final_score = final_scores[i]

                if is_cold_start:
                    final_score = (0.7 * sim) + (0.3 * final_score)

                expl = explainer.explain(student_dict, j_dict, sim)
                missing = [
                    s for s in j_skills
                    if _normalize_skill_name(s) not in student_skill_set
                ]
                results.append({
                    "job_id": j.id,
                    "job": j,
                    "job_dict": j_dict,
                    "required_skills": j_skills,
                    "missing_skills": missing,
                    "similarity_score": sim,
                    "final_score": round(final_score, 4),
                    "ml_score": ml_scores[i],
                    "shap_values": expl["shap_values"],
                    "top_reasons": expl["top_reasons"],
                    "score_breakdown": {
                        "similarity_score": sim,
                        "ml_score": ml_scores[i],
                        "final_score": round(final_score, 4),
                    },
                })

        # ── Stage 4: MMR Diversity Filter ──
        ranked_results = []
        unselected = sorted(results, key=lambda x: x["final_score"], reverse=True)

        while unselected and len(ranked_results) < TOP_N_SAVE:
            best_idx = 0
            best_mmr = -999.0

            for i, cand in enumerate(unselected):
                score = cand["final_score"]
                penalty = 0.0
                for r in ranked_results:
                    # Job model does not expose companyName directly; use recruiterId
                    # to apply same-company diversity penalty safely.
                    if getattr(cand["job"], "recruiterId", None) == getattr(r["job"], "recruiterId", None):
                        penalty += 0.2

                mmr = 0.8 * score - 0.2 * penalty
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = i

            best_cand = unselected.pop(best_idx)
            ranked_results.append(best_cand)

        # Save to DB
        for rank, result in enumerate(ranked_results, 1):
            try:
                await prisma.execute_raw(
                    _MATCHSCORE_UPSERT_SQL,
                    str(uuid4()),
                    profile.id,
                    result["job_id"],
                    float(result["similarity_score"]),
                    float(result["ml_score"]),
                    float(result["final_score"]),
                    int(rank),
                    _to_json_text(result.get("shap_values", {})),
                    " | ".join(result.get("top_reasons", [])),
                    "PENDING",
                )
            except Exception:
                logger.exception("Failed to upsert MatchScore for job %s", result["job_id"])

        return ranked_results[:TOP_N_RETURN]

    except Exception:
        logger.exception("Matching pipeline failed for user %s", student_user_id)
        return []


async def run_matching_for_job(
    job_id: str,
    recruiter_user_id: str,
) -> list[dict[str, Any]]:
    """
    Rank all students for one job posting using 4-Stage Pipeline.
    Used by recruiter to see ranked candidates.
    1. Eligibility Gate (Hard GPA/Branch checks)
    2. SBERT Retrieval (Top 100)
    3. XGBoost Re-ranking
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

    # ── Stage 1: Hard Gate Eligibility (DB-level CGPA filter) ──
    min_cgpa = float(job.minCgpa or 0.0)
    allowed_branches = {b.strip().lower() for b in (job.eligibleBranches or [])}

    profiles = await prisma.studentprofile.find_many(
        where={"cgpa": {"gte": min_cgpa}},
        include={
            "user": True,
            "studentSkills": {"include": {"skill": True}},
        },
    )

    eligible_profiles = []
    for p in profiles:
        # Exact-token branch check
        if not _is_branch_eligible(p.branch, allowed_branches):
            continue
        eligible_profiles.append(p)

    if not eligible_profiles:
        return []

    # ── Stage 2: Retrieval ──
    retrieved = []
    for p in eligible_profiles:
        try:
            skills = [ss.skill.name for ss in (p.studentSkills or []) if ss.skill]
            student_dict = _profile_to_dict(p, skills)
            student_emb = await _get_student_embedding(prisma, p.id, student_dict)
            sim = encoder.cosine_similarity(student_emb, job_emb)
            retrieved.append((p, student_dict, skills, student_emb, sim))
        except Exception:
            continue

    # Take top 100 for re-ranking
    retrieved.sort(key=lambda x: x[4], reverse=True)
    top_k = retrieved[:100]

    # ── Stage 3: XGBoost Re-ranking ──
    results: list[dict] = []
    for p, s_dict, s_skills, s_emb, sim in top_k:
        try:
            final_score = scorer.score(s_dict, job_dict, sim)
            expl = explainer.explain(s_dict, job_dict, sim)
            user = getattr(p, "user", None)

            results.append({
                "student_id": p.id,
                "student_name": p.fullName,
                "final_score": final_score,
                "similarity_score": sim,
                "top_reasons": expl["top_reasons"],
                "shap_values": expl["shap_values"],
                "skills": s_skills, # CRITICAL for recruiter view
                "email": getattr(user, "email", "") or "",
                "phone": "",
                "branch": p.branch or "",
                "cgpa": p.cgpa or 0.0,
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results[:50] # Return top 50 to recruiter
