"""Analytics APIs."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_prisma
from app.middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/analytics", tags=["analytics"])

_UI_STATUS_PREFIX = "__TS_UI_STATUS__:"


def _ui_status(app_status: str, cover_note: str | None) -> str:
	if cover_note and cover_note.startswith(_UI_STATUS_PREFIX):
		marker = cover_note.replace(_UI_STATUS_PREFIX, "", 1).split("\n", 1)[0].strip().upper()
		if marker in {"REVIEWED", "SELECTED"}:
			return marker
	if app_status.upper() == "HIRED":
		return "SELECTED"
	return app_status.upper()


@router.get("/platform")
async def platform_stats(user: dict = Depends(get_current_user)):
	prisma = get_prisma()

	total_students = await prisma.studentprofile.count()
	total_recruiters = await prisma.recruiterprofile.count()
	total_jobs = await prisma.job.count()
	active_jobs = await prisma.job.count(where={"isActive": True})
	total_applications = await prisma.application.count()
	total_matches = await prisma.matchscore.count()

	# Use SQL aggregate instead of loading all rows into memory
	avg_score = 0.0
	if total_matches > 0:
		try:
			result = await prisma.query_raw(
				'SELECT AVG("finalScore") as avg_score FROM "MatchScore"'
			)
			if result and result[0].get("avg_score") is not None:
				avg_score = float(result[0]["avg_score"])
		except Exception:
			# Fallback: if raw query fails, use bounded fetch
			match_rows = await prisma.matchscore.find_many(take=1000)
			if match_rows:
				avg_score = sum(float(row.finalScore) for row in match_rows) / len(match_rows)

	return {
		"totalStudents": total_students,
		"totalRecruiters": total_recruiters,
		"totalJobs": total_jobs,
		"activeJobs": active_jobs,
		"totalApplications": total_applications,
		"totalMatches": total_matches,
		"averageMatchScore": round(avg_score, 4),
	}


@router.get("/recruiter/me")
async def recruiter_analytics(user: dict = Depends(require_role("RECRUITER"))):
	prisma = get_prisma()

	recruiter = await prisma.recruiterprofile.find_unique(where={"userId": user["id"]})
	if not recruiter:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

	jobs = await prisma.job.find_many(where={"recruiterId": recruiter.id})
	job_ids = [job.id for job in jobs]
	if not job_ids:
		return {
			"totals": {
				"applicants": 0,
				"reviewed": 0,
				"shortlisted": 0,
				"accepted": 0,
				"averageMatchScore": 0,
				"totalMatches": 0,
				"jobsPosted": 0,
			},
			"applicationsByDay": [],
			"topSkills": [],
		}

	apps = await prisma.application.find_many(
		where={"jobId": {"in": job_ids}},
		include={
			"student": {
				"include": {
					"studentSkills": {"include": {"skill": True}},
				}
			},
		},
	)
	matches = await prisma.matchscore.find_many(where={"jobId": {"in": job_ids}})

	totals_counter = Counter()
	for app in apps:
		status_label = _ui_status(str(app.status), app.coverNote)
		totals_counter[status_label] += 1

	avg_score = 0.0
	if matches:
		avg_score = sum(float(row.finalScore) for row in matches) / len(matches)

	# Last 14-day applications histogram.
	now = datetime.now(timezone.utc).date()
	by_day = Counter()
	for app in apps:
		day_key = app.appliedAt.date().isoformat()
		by_day[day_key] += 1

	applications_by_day = []
	for offset in range(13, -1, -1):
		day = now - timedelta(days=offset)
		key = day.isoformat()
		applications_by_day.append(
			{
				"day": key,
				"value": by_day.get(key, 0),
			}
		)

	skill_counter = Counter()
	for app in apps:
		if not app.student:
			continue
		for skill_row in app.student.studentSkills or []:
			if skill_row.skill and skill_row.skill.name:
				skill_counter[skill_row.skill.name] += 1

	top_skills = [
		{"skill": skill, "count": count}
		for skill, count in skill_counter.most_common(10)
	]

	return {
		"totals": {
			"jobsPosted": len(jobs),
			"applicants": len(apps),
			"reviewed": totals_counter.get("REVIEWED", 0),
			"shortlisted": totals_counter.get("SHORTLISTED", 0),
			"accepted": totals_counter.get("SELECTED", 0),
			"averageMatchScore": round(avg_score, 4),
			"totalMatches": len(matches),
		},
		"applicationsByDay": applications_by_day,
		"topSkills": top_skills,
	}