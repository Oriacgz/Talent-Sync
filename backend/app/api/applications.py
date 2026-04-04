"""Application APIs."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_prisma
from app.middleware.auth import require_role
from app.schemas.application import (
	ApplicationResponse,
	CreateApplicationRequest,
	UpdateStatusRequest,
)

router = APIRouter(prefix="/applications", tags=["applications"])

_UI_STATUS_PREFIX = "__TS_UI_STATUS__:"


def _split_cover_note(cover_note: str | None) -> tuple[str | None, str | None]:
	if not cover_note:
		return None, None
	if not cover_note.startswith(_UI_STATUS_PREFIX):
		return None, cover_note

	head, _, tail = cover_note.partition("\n")
	marker = head.replace(_UI_STATUS_PREFIX, "", 1).strip().upper() or None
	return marker, tail or None


def _compose_cover_note(status_marker: str | None, note: str | None) -> str | None:
	clean_note = (note or "").strip()
	if status_marker:
		if clean_note:
			return f"{_UI_STATUS_PREFIX}{status_marker}\n{clean_note}"
		return f"{_UI_STATUS_PREFIX}{status_marker}"
	return clean_note or None


def _to_db_status(requested_status: str) -> tuple[str, str | None]:
	requested = requested_status.upper()

	# DB enum does not currently include REVIEWED/SELECTED.
	# Persist canonical DB status plus a lightweight UI marker in coverNote.
	if requested == "REVIEWED":
		return "APPLIED", "REVIEWED"
	if requested == "SELECTED":
		return "HIRED", "SELECTED"
	if requested == "HIRED":
		return "HIRED", "SELECTED"
	if requested in {"APPLIED", "SHORTLISTED", "REJECTED"}:
		return requested, None
	raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value")


def _to_ui_status(db_status: str, cover_note: str | None) -> str:
	marker, _ = _split_cover_note(cover_note)
	if marker in {"REVIEWED", "SELECTED"}:
		return marker
	if db_status == "HIRED":
		return "SELECTED"
	return db_status


def _serialize_application(app, *, match_score: float | None = None) -> ApplicationResponse:
	ui_status = _to_ui_status(str(app.status), app.coverNote)
	job = getattr(app, "job", None)
	company_name = None
	if job and getattr(job, "recruiter", None):
		company_name = job.recruiter.companyName

	return ApplicationResponse(
		id=app.id,
		studentId=app.studentId,
		jobId=app.jobId,
		status=ui_status,
		appliedAt=app.appliedAt,
		updatedAt=app.updatedAt,
		jobTitle=getattr(job, "title", None),
		company=company_name,
		matchScore=match_score,
	)


@router.post("", response_model=ApplicationResponse)
async def apply(
	payload: CreateApplicationRequest,
	user: dict = Depends(require_role("STUDENT")),
):
	prisma = get_prisma()

	student = await prisma.studentprofile.find_unique(where={"userId": user["id"]})
	if not student:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complete your profile before applying")

	job = await prisma.job.find_unique(
		where={"id": payload.job_id},
		include={"recruiter": True},
	)
	if not job or not job.isActive:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or inactive")

	existing = await prisma.application.find_first(
		where={"studentId": student.id, "jobId": payload.job_id},
		include={"job": {"include": {"recruiter": True}}},
	)
	if existing:
		return _serialize_application(existing)

	created = await prisma.application.create(
		data={
			"studentId": student.id,
			"jobId": payload.job_id,
			"status": "APPLIED",
			"coverNote": payload.cover_note,
		},
		include={"job": {"include": {"recruiter": True}}},
	)
	return _serialize_application(created)


@router.get("/me", response_model=list[ApplicationResponse])
async def my_applications(user: dict = Depends(require_role("STUDENT"))):
	prisma = get_prisma()

	student = await prisma.studentprofile.find_unique(where={"userId": user["id"]})
	if not student:
		return []

	apps = await prisma.application.find_many(
		where={"studentId": student.id},
		include={"job": {"include": {"recruiter": True}}},
		order={"appliedAt": "desc"},
	)

	match_rows = await prisma.matchscore.find_many(where={"studentId": student.id})
	score_by_job_id = {row.jobId: row.finalScore for row in match_rows}

	return [
		_serialize_application(app, match_score=score_by_job_id.get(app.jobId))
		for app in apps
	]


@router.patch("/{app_id}/status", response_model=ApplicationResponse)
async def update_status(
	app_id: str,
	payload: UpdateStatusRequest,
	user: dict = Depends(require_role("RECRUITER")),
):
	prisma = get_prisma()

	app = await prisma.application.find_unique(
		where={"id": app_id},
		include={"job": {"include": {"recruiter": True}}},
	)
	if not app:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

	if not app.job or not app.job.recruiter or app.job.recruiter.userId != user["id"]:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update applications for your jobs")

	db_status, marker = _to_db_status(payload.status)
	_, existing_note = _split_cover_note(app.coverNote)

	updated = await prisma.application.update(
		where={"id": app.id},
		data={
			"status": db_status,
			"coverNote": _compose_cover_note(marker, existing_note),
		},
		include={"job": {"include": {"recruiter": True}}},
	)

	match_row = await prisma.matchscore.find_first(
		where={"studentId": updated.studentId, "jobId": updated.jobId},
	)
	return _serialize_application(updated, match_score=getattr(match_row, "finalScore", None))