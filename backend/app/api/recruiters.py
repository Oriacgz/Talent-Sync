"""Recruiter profile APIs."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.db.database import get_prisma
from app.middleware.auth import require_role

router = APIRouter(prefix="/recruiters", tags=["recruiters"])


class UpdateRecruiterProfileRequest(BaseModel):
	model_config = ConfigDict(populate_by_name=True, extra="ignore")

	fullName: Optional[str] = Field(default=None, max_length=100)
	companyName: Optional[str] = Field(default=None, max_length=200)
	companyWebsite: Optional[str] = Field(default=None, max_length=500)
	industry: Optional[str] = Field(default=None, max_length=100)
	companySize: Optional[str] = Field(default=None, max_length=50)
	location: Optional[str] = Field(default=None, max_length=200)
	bio: Optional[str] = Field(default=None, max_length=2000)


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
	payload: UpdateRecruiterProfileRequest,
	user: dict = Depends(require_role("RECRUITER")),
):
	prisma = get_prisma()
	profile = await _ensure_recruiter_profile(user)

	update_data = payload.model_dump(exclude_none=True)

	if update_data:
		profile = await prisma.recruiterprofile.update(
			where={"id": profile.id},
			data=update_data,
		)

	return _serialize_profile(user, profile)