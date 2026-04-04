"""Recruiter profile APIs."""

from __future__ import annotations

from fastapi import APIRouter, Body, Depends

from app.db.database import get_prisma
from app.middleware.auth import require_role

router = APIRouter(prefix="/recruiters", tags=["recruiters"])


async def _ensure_recruiter_profile(user: dict):
	prisma = get_prisma()
	profile = await prisma.recruiterprofile.find_unique(where={"userId": user["id"]})
	if profile:
		return profile

	full_name = str(user.get("name") or user.get("email") or "Recruiter")
	company_name = ""
	return await prisma.recruiterprofile.create(
		data={
			"userId": user["id"],
			"fullName": full_name,
			"companyName": company_name,
		},
	)


def _serialize_profile(user: dict, profile) -> dict:
	return {
		"id": profile.id,
		"userId": profile.userId,
		"email": user.get("email"),
		"fullName": profile.fullName,
		"companyName": profile.companyName,
		"companyWebsite": profile.companyWebsite,
		"industry": profile.industry,
		"companySize": profile.companySize,
		"location": profile.location,
		"bio": profile.bio,
	}


@router.get("/me/profile")
async def get_profile(user: dict = Depends(require_role("RECRUITER"))):
	profile = await _ensure_recruiter_profile(user)
	return _serialize_profile(user, profile)


@router.put("/me/profile")
async def update_profile(
	payload: dict = Body(default={}),
	user: dict = Depends(require_role("RECRUITER")),
):
	prisma = get_prisma()
	profile = await _ensure_recruiter_profile(user)

	update_data: dict = {}
	if "fullName" in payload or "full_name" in payload:
		update_data["fullName"] = str(payload.get("fullName") or payload.get("full_name") or profile.fullName)
	if "companyName" in payload or "company_name" in payload:
		update_data["companyName"] = str(payload.get("companyName") or payload.get("company_name") or profile.companyName)
	if "companyWebsite" in payload or "company_website" in payload:
		update_data["companyWebsite"] = payload.get("companyWebsite") or payload.get("company_website")
	if "industry" in payload:
		update_data["industry"] = payload.get("industry")
	if "companySize" in payload or "company_size" in payload:
		update_data["companySize"] = payload.get("companySize") or payload.get("company_size")
	if "location" in payload:
		update_data["location"] = payload.get("location")
	if "bio" in payload:
		update_data["bio"] = payload.get("bio")

	if update_data:
		profile = await prisma.recruiterprofile.update(
			where={"id": profile.id},
			data=update_data,
		)

	return _serialize_profile(user, profile)