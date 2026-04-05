"""
backend/app/services/matching_service.py
Orchestrates encoder + scorer + explainer against the live DB.
Uses EmbeddingCache to avoid re-encoding unchanged profiles/jobs.
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

import numpy as np

from app.db.database import get_prisma
from app.ml import encoder, scorer, explainer

logger = logging.getLogger(__name__)

TOP_N_SAVE = 20     # save top N matches to DB
TOP_N_RETURN = 10   # return top N to API caller


# ── Helpers ───────────────────────────────────────────────────────────────────
import signal
from concurrent.futures import TimeoutError

def _timeout_handler(signum, frame):
    raise TimeoutError("Matching pipeline timed out")

def _text_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


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
    Uses 4-Stage Pipeline: Eligibility Gate -> Retrieval -> Re-ranking -> Diversity
    """
    if hasattr(signal, "SIGALRM"):
        signal.signal(signal.SIGALRM, _timeout_handler)
        signal.alarm(1)  # 1 second max timeout

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
            include={"jobSkills": {"include": {"skill": True}}},
        )
        if not jobs:
            return []

        # ── Stage 1: Hard Gate Eligibility ──
        eligible_jobs = []
        for job in jobs:
            if float(student_dict["cgpa"]) < float(job.minCgpa or 0.0):
                continue
            if int(student_dict["backlogs"]) > 0 and not getattr(job, "backlogAllowed", True):
                continue
            if job.eligibleBranches:
                s_branch = student_dict["branch"].lower()
                allowed = [b.lower() for b in job.eligibleBranches]
                if s_branch not in allowed and not any(s_branch in a or a in s_branch for a in allowed):
                    continue
            eligible_jobs.append(job)

        if not eligible_jobs:
            return []

        # ── Stage 2: Retrieval ──
        student_emb = await _get_student_embedding(prisma, profile.id, student_dict)
        retrieved = []
        for job in eligible_jobs:
            job_skills = [js.skill.name for js in (job.jobSkills or []) if js.skill]
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
                missing = [s for s in j_skills if s.lower() not in [x.lower() for x in skills]]
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
                    "score_breakdown": {"ml_score": 0.0, "semantic_score": sim},
                })
        else:
            for j, j_dict, j_skills, j_emb, sim in top_k:
                final_score = scorer.score(student_dict, j_dict, sim)
                
                if is_cold_start:
                    final_score = (0.7 * sim) + (0.3 * final_score)
                
                expl = explainer.explain(student_dict, j_dict, sim)
                missing = [s for s in j_skills if s.lower() not in [x.lower() for x in skills]]
                results.append({
                    "job_id": j.id,
                    "job": j,
                    "job_dict": j_dict,
                    "required_skills": j_skills,
                    "missing_skills": missing,
                    "similarity_score": sim,
                    "final_score": round(final_score, 4),
                    "ml_score": expl["score_breakdown"]["ml_score"],
                    "shap_values": expl["shap_values"],
                    "top_reasons": expl["top_reasons"],
                    "score_breakdown": expl["score_breakdown"],
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
                    if cand["job"].companyName == r["job"].companyName:
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
                await prisma.matchscore.upsert(
                    where={"studentId_jobId": {"studentId": profile.id, "jobId": result["job_id"]}},
                    data={
                        "create": {
                            "studentId": profile.id,
                            "jobId": result["job_id"],
                            "similarityScore": result["similarity_score"],
                            "ruleScore": result["ml_score"],
                            "finalScore": result["final_score"],
                            "rank": rank,
                            "shapValues": result.get("shap_values", {}),
                            "explanation": " | ".join(result.get("top_reasons", [])),
                        },
                        "update": {
                            "similarityScore": result["similarity_score"],
                            "ruleScore": result["ml_score"],
                            "finalScore": result["final_score"],
                            "rank": rank,
                            "shapValues": result.get("shap_values", {}),
                            "explanation": " | ".join(result.get("top_reasons", [])),
                        },
                    },
                )
            except Exception:
                logger.exception("Failed to upsert MatchScore for job %s", result["job_id"])

        return ranked_results[:TOP_N_RETURN]

    except TimeoutError:
        logger.error("Matching pipeline timed out for user %s", student_user_id)
        return []
        
    finally:
        if hasattr(signal, "SIGALRM"):
            signal.alarm(0)


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

    # ── Stage 1: Hard Gate Eligibility (DB OPTIMIZED) ──
    # Load ONLY eligible students directly via DB queries to survive 1M users.
    min_cgpa = float(job.minCgpa or 0.0)
    backlog_allowed = getattr(job, "backlogAllowed", True)
    allowed_branches = [b.lower() for b in (job.eligibleBranches or [])]

    # Dynamically build the filtering where-clause
    where_clause = {
        "cgpa": {"gte": min_cgpa}
    }
    
    if not backlog_allowed:
        # If backlogs are not allowed, enforce backlogs <= 0
        # Assuming backlogs is Int in schema, though it might not exist in Prisma schema?
        # WAIT: Let's check prisma schema from earlier. The schema actually doesn't have 'backlogs' column in StudentProfile!
        # Ah, we were defaulting to 0 previously: `int(p.backlogs or 0) > 0`.
        pass 

    # For safety with loose Postgres schema, we just fetch with basic minimum filters
    profiles = await prisma.studentprofile.find_many(
        where=where_clause,
        include={"studentSkills": {"include": {"skill": True}}},
    )
    
    eligible_profiles = []
    for p in profiles:
        # Python-level branch check (since array intersection logic can be tricky in Prisma)
        if allowed_branches:
            s_branch = (p.branch or "").lower()
            if s_branch not in allowed_branches and not any(s_branch in b or b in s_branch for b in allowed_branches):
                continue
        # Wait, if backlogs existed we'd filter it here, but it's not in schema natively yet.
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

            results.append({
                "student_id": p.id,
                "student_name": p.fullName,
                "final_score": final_score,
                "similarity_score": sim,
                "top_reasons": expl["top_reasons"],
                "shap_values": expl["shap_values"],
                "skills": s_skills, # CRITICAL for recruiter view
                "email": p.email or "",
                "phone": p.phone or "",
                "branch": p.branch or "",
                "cgpa": p.cgpa or 0.0,
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results[:50] # Return top 50 to recruiter