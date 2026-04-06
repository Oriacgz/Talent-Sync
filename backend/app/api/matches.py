"""
backend/app/api/matches.py
Match API endpoints — student gets their matches,
recruiter sees ranked candidates for their job.

Register in main.py:
    from app.api.matches import router as matches_router
    app.include_router(matches_router, prefix="/api/matches", tags=["matches"])
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.database import get_prisma
from app.middleware.auth import get_current_user
from app.schemas.match import CandidateMatchResponse, MatchResponse
from app.services.matching_service import (
    run_matching_for_job,
    run_matching_for_student,
)

router = APIRouter(prefix="/matches", tags=["matches"])
logger = logging.getLogger(__name__)


# ── Student endpoints ─────────────────────────────────────────────────────────

@router.get("", response_model=list[MatchResponse])
async def get_my_matches(
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_user),
):
    """
    GET /api/matches?limit=10
    Student: returns top N matched jobs (default 10, max 50).
    Uses cached MatchScore records if available,
    triggers fresh matching if none exist.
    """
    if str(current_user.get("role", "")).upper() != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their matches.",
        )

    prisma = get_prisma()
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found in token")

    # Check for existing cached matches
    profile = await prisma.studentprofile.find_unique(
        where={"userId": user_id}
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Complete onboarding first.",
        )

    cached = await prisma.matchscore.find_many(
        where={"studentId": profile.id},
        order={"finalScore": "desc"},
        take=limit,
        include={"job": {"include": {"recruiter": True, "jobSkills": {"include": {"skill": True}}}}},
    )

    if cached:
        # Build application lookup
        applications = await prisma.application.find_many(
            where={"studentId": profile.id}
        )
        applied_job_ids = {a.jobId for a in applications}

        # Build student skill set for computing missing skills
        student_profile_full = await prisma.studentprofile.find_unique(
            where={"id": profile.id},
            include={"studentSkills": {"include": {"skill": True}}},
        )
        student_skill_set = set()
        if student_profile_full and student_profile_full.studentSkills:
            student_skill_set = {
                ss.skill.name.lower() for ss in student_profile_full.studentSkills if ss.skill
            }

        return [
            MatchResponse(
                job_id=m.jobId,
                job_title=m.job.title,
                company=m.job.recruiter.companyName if m.job.recruiter else "Unknown",
                location=m.job.location,
                work_mode=str(m.job.workMode) if m.job.workMode else None,
                job_type=str(m.job.jobType) if m.job.jobType else None,
                salary_min=m.job.salaryMin,
                salary_max=m.job.salaryMax,
                required_skills=[
                    js.skill.name for js in (m.job.jobSkills or []) if js.skill
                ],
                missing_skills=[
                    js.skill.name for js in (m.job.jobSkills or [])
                    if js.skill and js.skill.name.lower() not in student_skill_set
                ],
                similarity_score=m.similarityScore,
                ml_score=m.ruleScore,
                final_score=m.finalScore,
                top_reasons=(
                    m.explanation.split(" | ") if m.explanation else []
                ),
                shap_values=dict(m.shapValues) if m.shapValues else {},
                score_breakdown={
                    "similarity_score": m.similarityScore,
                    "ml_score": m.ruleScore,
                    "final_score": m.finalScore,
                },
                applied=m.jobId in applied_job_ids,
                rank=m.rank,
            )
            for m in cached
        ]

    # No cache — run matching fresh
    return await _run_and_format(user_id, profile)


@router.get("/refresh", response_model=list[MatchResponse])
async def refresh_matches(
    current_user=Depends(get_current_user),
):
    """
    GET /api/matches/refresh
    Forces a fresh matching run, ignoring cached scores.
    """
    if str(current_user.get("role", "")).upper() != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can refresh their matches.",
        )

    prisma = get_prisma()
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found in token")
    profile = await prisma.studentprofile.find_unique(
        where={"userId": user_id}
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found.",
        )

    return await _run_and_format(user_id, profile, force_refresh=True)


async def _run_and_format(user_id: str, profile, force_refresh: bool = False) -> list[MatchResponse]:
    """Run matching and format results as MatchResponse list."""
    prisma = get_prisma()

    try:
        results = await run_matching_for_student(user_id, force_refresh=force_refresh)
    except Exception as exc:
        logger.exception("Matching failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Matching engine error. Please try again shortly.",
        ) from exc

    if not results:
        return []

    # Application lookup
    applications = await prisma.application.find_many(
        where={"studentId": profile.id}
    )
    applied_job_ids = {a.jobId for a in applications}

    formatted = []
    for i, r in enumerate(results, 1):
        job = r["job"]
        recruiter = getattr(job, "recruiter", None)
        formatted.append(
            MatchResponse(
                job_id=r["job_id"],
                job_title=job.title,
                company=recruiter.companyName if recruiter else "Unknown",
                location=job.location,
                work_mode=str(job.workMode) if job.workMode else None,
                job_type=str(job.jobType) if job.jobType else None,
                salary_min=job.salaryMin,
                salary_max=job.salaryMax,
                required_skills=r.get("required_skills", []),
                missing_skills=r.get("missing_skills", []),
                similarity_score=r["similarity_score"],
                ml_score=r["ml_score"],
                final_score=r["final_score"],
                top_reasons=r["top_reasons"],
                shap_values=r["shap_values"],
                score_breakdown=r["score_breakdown"],
                applied=r["job_id"] in applied_job_ids,
                rank=i,
            )
        )
    return formatted


# ── Recruiter endpoint ────────────────────────────────────────────────────────

@router.get("/job/{job_id}", response_model=list[CandidateMatchResponse])
async def get_candidates_for_job(
    job_id: str,
    current_user=Depends(get_current_user),
):
    """
    GET /api/matches/job/{job_id}
    Recruiter: returns ranked list of students for their job.
    """
    if str(current_user.get("role", "")).upper() != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view candidates.",
        )

    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found in token")

    try:
        results = await run_matching_for_job(
            job_id=job_id,
            recruiter_user_id=user_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.exception("Candidate matching failed for job %s", job_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Matching engine error.",
        ) from exc

    return [
        CandidateMatchResponse(
            student_id=r["student_id"],
            student_name=r["student_name"],
            final_score=r["final_score"],
            similarity_score=r["similarity_score"],
            top_reasons=r["top_reasons"],
            shap_values=r["shap_values"],
            skills=r.get("skills", []),
            email=r.get("email"),
            phone=r.get("phone"),
            branch=r.get("branch"),
            cgpa=r.get("cgpa"),
        )
        for r in results
    ]