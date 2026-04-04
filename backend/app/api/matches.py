"""Match APIs for student and recruiter experiences."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.database import get_prisma
from app.middleware.auth import require_role
from app.schemas.match import MatchResponse

router = APIRouter(prefix="/matches", tags=["matches"])

_UI_STATUS_PREFIX = "__TS_UI_STATUS__:"


def _collect_required_skills(job) -> list[str]:
	return [row.skill.name for row in (job.jobSkills or []) if row.skill]


def _collect_student_skills(student) -> list[str]:
	return [row.skill.name for row in (student.studentSkills or []) if row.skill]


def _match_status_label(raw_status: str | None) -> str:
	status_map = {
		"PENDING": "unseen",
		"REVIEWED": "reviewed",
		"ACCEPTED": "accepted",
		"DECLINED": "declined",
	}
	normalized = str(raw_status or "PENDING").upper()
	return status_map.get(normalized, normalized.lower())


def _split_cover_note(cover_note: str | None) -> tuple[str | None, str | None]:
	if not cover_note:
		return None, None
	if not cover_note.startswith(_UI_STATUS_PREFIX):
		return None, cover_note
	head, _, tail = cover_note.partition("\n")
	marker = head.replace(_UI_STATUS_PREFIX, "", 1).strip().upper() or None
	return marker, tail or None


def _application_ui_status(app) -> str | None:
	if not app:
		return None
	marker, _ = _split_cover_note(getattr(app, "coverNote", None))
	if marker in {"REVIEWED", "SELECTED"}:
		return marker
	if str(app.status).upper() == "HIRED":
		return "SELECTED"
	return str(app.status).upper()


def _serialize_student_match(match_row, student_skills: set[str]) -> MatchResponse:
	job = match_row.job
	required_skills = _collect_required_skills(job)
	required_lower = {skill.lower() for skill in required_skills}
	missing_skills = [skill for skill in required_skills if skill.lower() not in student_skills]

	company = None
	if getattr(job, "recruiter", None):
		company = job.recruiter.companyName

	shap_values = match_row.shapValues if isinstance(match_row.shapValues, dict) else {}

	return MatchResponse(
		id=match_row.id,
		studentId=match_row.studentId,
		jobId=match_row.jobId,
		title=job.title,
		roleTitle=job.title,
		company=company,
		companyName=company,
		location=job.location,
		score=float(match_row.finalScore),
		similarityScore=float(match_row.similarityScore),
		ruleScore=float(match_row.ruleScore),
		finalScore=float(match_row.finalScore),
		rank=match_row.rank,
		status=_match_status_label(match_row.status),
		requiredSkills=required_skills,
		missingSkills=missing_skills,
		shapValues=shap_values,
		explanation=match_row.explanation,
		createdAt=match_row.createdAt,
	)


@router.get("/me", response_model=list[MatchResponse])
async def my_matches(
	limit: int = Query(default=50, ge=1, le=200),
	user: dict = Depends(require_role("STUDENT")),
):
	prisma = get_prisma()

	student = await prisma.studentprofile.find_unique(
		where={"userId": user["id"]},
		include={"studentSkills": {"include": {"skill": True}}},
	)
	if not student:
		return []

	student_skills = {skill.lower() for skill in _collect_student_skills(student)}

	rows = await prisma.matchscore.find_many(
		where={"studentId": student.id},
		include={
			"job": {
				"include": {
					"recruiter": True,
					"jobSkills": {"include": {"skill": True}},
				}
			},
		},
		order={"finalScore": "desc"},
		take=limit,
	)

	return [_serialize_student_match(row, student_skills) for row in rows]


@router.get("/{match_id}/detail", response_model=MatchResponse)
async def match_detail(
	match_id: str,
	user: dict = Depends(require_role("STUDENT")),
):
	prisma = get_prisma()
	student = await prisma.studentprofile.find_unique(
		where={"userId": user["id"]},
		include={"studentSkills": {"include": {"skill": True}}},
	)
	if not student:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

	row = await prisma.matchscore.find_first(
		where={"id": match_id, "studentId": student.id},
		include={
			"job": {
				"include": {
					"recruiter": True,
					"jobSkills": {"include": {"skill": True}},
				}
			},
		},
	)
	if not row:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

	student_skills = {skill.lower() for skill in _collect_student_skills(student)}
	return _serialize_student_match(row, student_skills)


@router.get("/job/{job_id}/candidates")
async def job_candidates(
	job_id: str,
	user: dict = Depends(require_role("RECRUITER")),
):
	prisma = get_prisma()

	recruiter = await prisma.recruiterprofile.find_unique(where={"userId": user["id"]})
	if not recruiter:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

	if job_id.lower() == "all":
		recruiter_jobs = await prisma.job.find_many(where={"recruiterId": recruiter.id})
		job_ids = [job.id for job in recruiter_jobs]
		if not job_ids:
			return []
		where_clause = {"jobId": {"in": job_ids}}
	else:
		job = await prisma.job.find_unique(where={"id": job_id})
		if not job:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
		if job.recruiterId != recruiter.id:
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view candidates for your jobs")
		where_clause = {"jobId": job_id}

	match_rows = await prisma.matchscore.find_many(
		where=where_clause,
		include={
			"job": {"include": {"jobSkills": {"include": {"skill": True}}}},
			"student": {
				"include": {
					"studentSkills": {"include": {"skill": True}},
				}
			},
		},
		order={"finalScore": "desc"},
		take=500,
	)

	if not match_rows:
		return []

	student_job_pairs = [{"studentId": row.studentId, "jobId": row.jobId} for row in match_rows]
	applications = await prisma.application.find_many(
		where={"OR": student_job_pairs},
	)
	app_by_pair = {(app.studentId, app.jobId): app for app in applications}

	candidates: list[dict] = []
	for row in match_rows:
		student = row.student
		job = row.job
		app = app_by_pair.get((row.studentId, row.jobId))

		skills = _collect_student_skills(student)
		shap_values = row.shapValues if isinstance(row.shapValues, dict) else {}
		required_skills = _collect_required_skills(job)
		missing = [skill for skill in required_skills if skill.lower() not in {s.lower() for s in skills}]

		candidates.append(
			MatchResponse(
				id=row.id,
				studentId=row.studentId,
				jobId=row.jobId,
				fullName=student.fullName,
				college=student.college,
				gpa=student.cgpa,
				skills=skills,
				score=float(row.finalScore),
				finalScore=float(row.finalScore),
				similarityScore=float(row.similarityScore),
				ruleScore=float(row.ruleScore),
				shapValues=shap_values,
				explanation=row.explanation,
				status=_application_ui_status(app) or _match_status_label(row.status),
				applicationId=app.id if app else None,
				title=job.title,
				roleTitle=job.title,
				requiredSkills=required_skills,
				missingSkills=missing,
				createdAt=row.createdAt,
			).model_dump()
		)

	return candidates