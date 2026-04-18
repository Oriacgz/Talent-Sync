"""
backend/app/api/matches.py
Match API endpoints — student gets their matches,
recruiter sees ranked candidates for their job.

Register in main.py:
    from app.api.matches import router as matches_router
    app.include_router(matches_router, prefix="/api/matches", tags=["matches"])
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.database import get_prisma
from app.middleware.auth import get_current_user
from app.schemas.match import CandidateMatchResponse, MatchResponse
from app.services.matching_service import (
    has_meaningful_skill_overlap,
    run_matching_for_job,
    run_matching_for_student,
)

router = APIRouter(prefix="/matches", tags=["matches"])
logger = logging.getLogger(__name__)

_ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "ml" / "artifacts"


def _to_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _latest_model_timestamp() -> datetime | None:
    """Return latest model artifact timestamp for cache invalidation."""
    metadata_path = _ARTIFACTS_DIR / "model_metadata.json"
    if metadata_path.exists():
        try:
            payload = json.loads(metadata_path.read_text(encoding="utf-8"))
            trained_at = payload.get("trained_at")
            if trained_at:
                # Support both naive and timezone-aware ISO values.
                return _to_utc(datetime.fromisoformat(str(trained_at)))
        except Exception:
            logger.exception("Failed to parse model metadata timestamp")

    model_path = _ARTIFACTS_DIR / "scorer_model.pkl"
    if model_path.exists():
        return datetime.fromtimestamp(model_path.stat().st_mtime, tz=timezone.utc)
    return None


def _safe_shap_values(raw: Any) -> dict:
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        return dict(raw)
    except Exception:
        return {}


def _student_onboarding_complete(profile: Any) -> bool:
    """Mirror chatbot onboarding completion signals for student access gates."""
    if not profile:
        return False

    return any(
        [
            bool(getattr(profile, "degree", None)),
            bool(getattr(profile, "branch", None)),
            bool(getattr(profile, "graduationYear", None)),
            bool(getattr(profile, "college", None)),
            bool(getattr(profile, "cgpa", None)),
            bool(getattr(profile, "preferredWorkMode", None)),
            bool(getattr(profile, "experienceLevel", None)),
            bool(getattr(profile, "preferredRoles", None)),
            bool(getattr(profile, "studentSkills", None)),
            bool(getattr(profile, "bio", None)),
            bool(getattr(profile, "resumeUrl", None)),
        ]
    )


def _merge_ranked_with_applied(
    ranked: list[dict[str, Any]],
    applied: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not ranked:
        return applied
    if not applied:
        return ranked

    merged = list(ranked)
    seen_student_ids = {
        str(row.get("student_id", "")).strip()
        for row in ranked
        if str(row.get("student_id", "")).strip()
    }
    for candidate in applied:
        student_id = str(candidate.get("student_id", "")).strip()
        if not student_id or student_id in seen_student_ids:
            continue
        merged.append(candidate)
        seen_student_ids.add(student_id)
    return merged


async def _get_applied_candidates_for_job(job_id: str) -> list[dict[str, Any]]:
    prisma = get_prisma()

    applications = await prisma.application.find_many(
        where={"jobId": job_id},
        order={"appliedAt": "desc"},
        include={
            "student": {
                "include": {
                    "user": True,
                    "studentSkills": {"include": {"skill": True}},
                }
            }
        },
    )
    if not applications:
        return []

    student_ids = [
        app.studentId for app in applications
        if getattr(app, "studentId", None)
    ]
    match_rows = await prisma.matchscore.find_many(
        where={
            "jobId": job_id,
            "studentId": {"in": student_ids},
        }
    ) if student_ids else []
    match_by_student_id = {row.studentId: row for row in match_rows}

    candidates: list[dict[str, Any]] = []
    for app in applications:
        student = getattr(app, "student", None)
        if not student:
            continue

        match_row = match_by_student_id.get(app.studentId)
        top_reasons: list[str] = []
        if match_row and getattr(match_row, "explanation", None):
            top_reasons = [
                part.strip()
                for part in str(match_row.explanation).split(" | ")
                if part and part.strip()
            ]
        if not top_reasons:
            top_reasons = ["Student has applied to this job."]

        student_skills = [
            ss.skill.name
            for ss in (getattr(student, "studentSkills", None) or [])
            if getattr(ss, "skill", None)
        ]
        user = getattr(student, "user", None)

        candidates.append(
            {
                "student_id": student.id,
                "student_name": student.fullName,
                "final_score": float(getattr(match_row, "finalScore", 0.0) or 0.0),
                "similarity_score": float(getattr(match_row, "similarityScore", 0.0) or 0.0),
                "top_reasons": top_reasons,
                "shap_values": _safe_shap_values(getattr(match_row, "shapValues", None)),
                "skills": student_skills,
                "email": getattr(user, "email", "") or "",
                "phone": "",
                "branch": student.branch or "",
                "cgpa": float(student.cgpa or 0.0),
            }
        )

    candidates.sort(key=lambda row: float(row.get("final_score", 0.0) or 0.0), reverse=True)
    return candidates


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
        where={"userId": user_id},
        include={"studentSkills": True},
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Complete onboarding first.",
        )

    if not _student_onboarding_complete(profile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete onboarding before viewing matches.",
        )

    cached = await prisma.matchscore.find_many(
        where={"studentId": profile.id},
        order={"finalScore": "desc"},
        include={"job": {"include": {"recruiter": True, "jobSkills": {"include": {"skill": True}}}}},
    )

    student_profile_full = await prisma.studentprofile.find_unique(
        where={"id": profile.id},
        include={"studentSkills": {"include": {"skill": True}}},
    )
    student_skills = [
        ss.skill.name
        for ss in (getattr(student_profile_full, "studentSkills", None) or [])
        if getattr(ss, "skill", None)
    ]

    if cached:
        active_cached = [
            m for m in cached
            if getattr(m, "job", None) and getattr(m.job, "isActive", False)
        ]
        filtered_cached = [
            m
            for m in active_cached
            if has_meaningful_skill_overlap(
                student_skills,
                [
                    js.skill.name
                    for js in (getattr(m.job, "jobSkills", None) or [])
                    if getattr(js, "skill", None)
                ],
            )
        ]

        has_skill_mismatch_cached_rows = len(filtered_cached) != len(active_cached)
        has_inactive_cached_rows = len(active_cached) != len(cached)
        profile_updated_timestamp = _to_utc(getattr(profile, "updatedAt", None))

        model_timestamp = _latest_model_timestamp()
        latest_cache_timestamp = _to_utc(
            max((m.updatedAt for m in active_cached if getattr(m, "updatedAt", None)), default=None)
        )
        latest_active_job = await prisma.job.find_first(
            where={"isActive": True},
            order={"updatedAt": "desc"},
        )
        latest_active_job_timestamp = _to_utc(getattr(latest_active_job, "updatedAt", None))

        should_refresh = False
        refresh_reasons: list[str] = []

        if model_timestamp and (
            latest_cache_timestamp is None or latest_cache_timestamp < model_timestamp
        ):
            should_refresh = True
            refresh_reasons.append("model_updated")

        if latest_active_job_timestamp and (
            latest_cache_timestamp is None or latest_cache_timestamp < latest_active_job_timestamp
        ):
            should_refresh = True
            refresh_reasons.append("jobs_updated")

        if has_inactive_cached_rows:
            should_refresh = True
            refresh_reasons.append("inactive_jobs_in_cache")

        if has_skill_mismatch_cached_rows:
            should_refresh = True
            refresh_reasons.append("cached_rows_fail_skill_gate")

        if profile_updated_timestamp and (
            latest_cache_timestamp is None or latest_cache_timestamp < profile_updated_timestamp
        ):
            should_refresh = True
            refresh_reasons.append("profile_updated")

        if should_refresh:
            logger.info(
                "Match cache is stale for student %s (cache=%s, model=%s, jobs=%s, reasons=%s); refreshing.",
                profile.id,
                latest_cache_timestamp,
                model_timestamp,
                latest_active_job_timestamp,
                ",".join(refresh_reasons),
            )
            return await _run_and_format(user_id, profile, force_refresh=True)

        cached = filtered_cached[:limit]

    if cached:
        # Build application lookup
        applications = await prisma.application.find_many(
            where={"studentId": profile.id}
        )
        applied_job_ids = {a.jobId for a in applications}

        # Build student skill set for computing missing skills
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
        where={"userId": user_id},
        include={"studentSkills": True},
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found.",
        )

    if not _student_onboarding_complete(profile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete onboarding before viewing matches.",
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

    applied_candidates = await _get_applied_candidates_for_job(job_id)
    results = _merge_ranked_with_applied(results, applied_candidates)

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