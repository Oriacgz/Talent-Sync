"""Student profile APIs."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.db.database import get_prisma
from app.middleware.auth import require_role
from app.schemas.student import (
	StudentCertificationResponse,
	StudentProfileResponse,
	UpdateProfileRequest,
)
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/students", tags=["students"])


def _resume_payload(resume_url: str | None) -> dict | None:
	if not resume_url:
		return None
	name = os.path.basename(resume_url) or "Resume.pdf"
	return {"url": resume_url, "name": name}


def _compute_profile_completion(*, full_name: str | None, college: str | None, cgpa: float | None, skills: list[str], bio: str | None, resume_url: str | None) -> int:
	score = 0
	if full_name:
		score += 20
	if college and cgpa is not None:
		score += 20
	if skills:
		score += 20
	if bio:
		score += 10
	if resume_url:
		score += 30
	return min(score, 100)


def _normalize_skill_names(skills: list[str]) -> list[str]:
	seen: set[str] = set()
	cleaned: list[str] = []
	for skill in skills:
		name = str(skill or "").strip()
		if not name:
			continue
		key = name.lower()
		if key in seen:
			continue
		seen.add(key)
		cleaned.append(name)
	return cleaned


async def _ensure_student_profile(user: dict):
	prisma = get_prisma()
	profile = await prisma.studentprofile.find_unique(
		where={"userId": user["id"]},
		include={
			"studentSkills": {"include": {"skill": True}},
			"certifications": True,
		},
	)
	if profile:
		return profile

	full_name = str(user.get("name") or user.get("email") or "Student")
	return await prisma.studentprofile.create(
		data={
			"userId": user["id"],
			"fullName": full_name,
			"preferredRoles": [],
			"preferredLocations": [],
			"socialLinks": [],
		},
		include={
			"studentSkills": {"include": {"skill": True}},
			"certifications": True,
		},
	)


def _to_profile_response(user: dict, profile) -> StudentProfileResponse:
	skills = [row.skill.name for row in (profile.studentSkills or []) if row.skill]
	completion = _compute_profile_completion(
		full_name=profile.fullName,
		college=profile.college,
		cgpa=profile.cgpa,
		skills=skills,
		bio=profile.bio,
		resume_url=profile.resumeUrl,
	)

	certs = [
		StudentCertificationResponse(
			id=cert.id,
			name=cert.name,
			url=cert.url,
			publicId=cert.publicId,
			uploadedAt=cert.uploadedAt,
		)
		for cert in (profile.certifications or [])
	]

	return StudentProfileResponse(
		id=profile.id,
		userId=profile.userId,
		email=str(user.get("email") or ""),
		fullName=profile.fullName,
		bio=profile.bio,
		college=profile.college,
		degree=profile.degree,
		branch=profile.branch,
		graduationYear=profile.graduationYear,
		cgpa=profile.cgpa,
		gpa=profile.cgpa,
		location=profile.location,
		preferredRoles=profile.preferredRoles or [],
		preferredLocations=profile.preferredLocations or [],
		experienceLevel=profile.experienceLevel,
		socialLinks=profile.socialLinks or [],
		resume=_resume_payload(profile.resumeUrl),
		resumeUrl=profile.resumeUrl,
		resumePublic=bool(profile.resumePublic),
		certificationsPublic=bool(profile.certificationsPublic),
		certificates=certs,
		skills=skills,
		profileCompletion=completion,
	)


@router.get("/me/profile", response_model=StudentProfileResponse)
async def get_profile(user: dict = Depends(require_role("STUDENT"))):
	profile = await _ensure_student_profile(user)
	return _to_profile_response(user, profile)


@router.put("/me/profile", response_model=StudentProfileResponse)
async def update_profile(
	payload: UpdateProfileRequest,
	user: dict = Depends(require_role("STUDENT")),
):
	prisma = get_prisma()
	profile = await _ensure_student_profile(user)

	update_data: dict = {}
	provided = payload.model_fields_set

	if "full_name" in provided:
		update_data["fullName"] = (payload.full_name or "").strip() or profile.fullName
	if "bio" in provided:
		update_data["bio"] = payload.bio
	if "college" in provided:
		update_data["college"] = payload.college
	if "degree" in provided:
		update_data["degree"] = payload.degree
	if "branch" in provided:
		update_data["branch"] = payload.branch
	if "graduation_year" in provided:
		update_data["graduationYear"] = payload.graduation_year
	if "cgpa" in provided:
		update_data["cgpa"] = payload.cgpa
	if "location" in provided:
		update_data["location"] = payload.location
	if "linkedin_url" in provided:
		update_data["linkedinUrl"] = payload.linkedin_url
	if "github_url" in provided:
		update_data["githubUrl"] = payload.github_url
	if "portfolio_url" in provided:
		update_data["portfolioUrl"] = payload.portfolio_url
	if "preferred_roles" in provided:
		update_data["preferredRoles"] = payload.preferred_roles or []
	if "preferred_locations" in provided:
		update_data["preferredLocations"] = payload.preferred_locations or []
	if "experience_level" in provided:
		update_data["experienceLevel"] = payload.experience_level
	if "social_links" in provided:
		update_data["socialLinks"] = payload.social_links or []
	if "resume_public" in provided:
		update_data["resumePublic"] = bool(payload.resume_public)
	if "certifications_public" in provided:
		update_data["certificationsPublic"] = bool(payload.certifications_public)

	if "resume" in provided:
		if payload.resume is None:
			update_data["resumeUrl"] = None
			update_data["resumeText"] = None
		elif isinstance(payload.resume, str):
			update_data["resumeUrl"] = payload.resume
		elif isinstance(payload.resume, dict):
			resume_url = payload.resume.get("url") or payload.resume.get("resumeUrl")
			if resume_url:
				update_data["resumeUrl"] = str(resume_url)

	if update_data:
		await prisma.studentprofile.update(
			where={"id": profile.id},
			data=update_data,
		)

	if "skills" in provided and payload.skills is not None:
		normalized_skills = _normalize_skill_names(payload.skills)
		await prisma.studentskill.delete_many(where={"studentId": profile.id})
		for skill_name in normalized_skills:
			existing_skill = await prisma.skill.find_first(
				where={"name": {"equals": skill_name, "mode": "insensitive"}},
			)
			if not existing_skill:
				existing_skill = await prisma.skill.create(data={"name": skill_name})
			await prisma.studentskill.create(
				data={
					"studentId": profile.id,
					"skillId": existing_skill.id,
				},
			)

	refreshed = await prisma.studentprofile.find_unique(
		where={"id": profile.id},
		include={
			"studentSkills": {"include": {"skill": True}},
			"certifications": True,
		},
	)
	return _to_profile_response(user, refreshed)


@router.post("/me/resume")
async def upload_resume(
	file: UploadFile = File(...),
	user: dict = Depends(require_role("STUDENT")),
):
	if not file.filename:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing file name")

	content_type = str(file.content_type or "").lower()
	if content_type and "pdf" not in content_type:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF resumes are supported")

	file_bytes = await file.read()
	if not file_bytes:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

	parsed = parse_resume(file_bytes)
	prisma = get_prisma()
	profile = await _ensure_student_profile(user)

	safe_name = file.filename.replace("/", "_").replace("\\", "_")
	resume_url = f"uploaded://resume/{user['id']}/{safe_name}"

	update_data = {
		"resumeUrl": resume_url,
		"resumeText": parsed.get("text") or None,
	}
	if parsed.get("cgpa") is not None and profile.cgpa is None:
		update_data["cgpa"] = parsed["cgpa"]

	await prisma.studentprofile.update(
		where={"id": profile.id},
		data=update_data,
	)

	parsed_skills = _normalize_skill_names(parsed.get("skills") or [])
	if parsed_skills:
		existing_skill_rows = await prisma.studentskill.find_many(
			where={"studentId": profile.id},
			include={"skill": True},
		)
		existing_names = {row.skill.name.lower() for row in existing_skill_rows if row.skill}

		for skill_name in parsed_skills:
			if skill_name.lower() in existing_names:
				continue
			existing_skill = await prisma.skill.find_first(
				where={"name": {"equals": skill_name, "mode": "insensitive"}},
			)
			if not existing_skill:
				existing_skill = await prisma.skill.create(data={"name": skill_name})
			await prisma.studentskill.create(
				data={"studentId": profile.id, "skillId": existing_skill.id},
			)

	return {
		"resume": {
			"url": resume_url,
			"name": safe_name,
			"size": len(file_bytes),
		},
		"resumeUrl": resume_url,
		"extracted": {
			"skills": parsed_skills,
			"cgpa": parsed.get("cgpa"),
		},
	}


@router.post("/me/certificates", response_model=StudentCertificationResponse)
async def upload_certificate(
	file: UploadFile = File(...),
	user: dict = Depends(require_role("STUDENT")),
):
	if not file.filename:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing certificate file name")

	file_bytes = await file.read()
	if not file_bytes:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

	prisma = get_prisma()
	profile = await _ensure_student_profile(user)

	safe_name = file.filename.replace("/", "_").replace("\\", "_")
	public_id = f"cert_{uuid4().hex}"
	cert_url = f"uploaded://certificate/{user['id']}/{public_id}/{safe_name}"

	cert = await prisma.certification.create(
		data={
			"studentId": profile.id,
			"name": safe_name,
			"url": cert_url,
			"publicId": public_id,
		},
	)

	return StudentCertificationResponse(
		id=cert.id,
		name=cert.name,
		url=cert.url,
		publicId=cert.publicId,
		uploadedAt=cert.uploadedAt,
	)


@router.delete("/me/certificates/{certificate_id}")
async def delete_certificate(
	certificate_id: str,
	user: dict = Depends(require_role("STUDENT")),
):
	prisma = get_prisma()
	profile = await _ensure_student_profile(user)

	cert = await prisma.certification.find_first(
		where={"id": certificate_id, "studentId": profile.id},
	)
	if not cert:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")

	await prisma.certification.delete(where={"id": cert.id})
	return {"message": "Certificate removed", "id": cert.id}