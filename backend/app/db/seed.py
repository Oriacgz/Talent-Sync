# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Seeds demo data into the database for presentation.
#                 Creates 1 recruiter + 5 jobs + 3 students with complete profiles.
#                 Run once: python -m app.db.seed
# DEPENDS ON: Prisma client, auth_service (for password hashing)

import asyncio

from app.db.database import prisma
from app.services.auth_service import hash_password


async def _get_or_create_user(email: str, password: str, role: str):
    existing = await prisma.user.find_unique(where={"email": email})
    if existing:
        return existing
    return await prisma.user.create(
        data={
            "email": email,
            "passwordHash": hash_password(password),
            "role": role,
        }
    )


async def seed() -> None:
    await prisma.connect()
    try:
        student_user = await _get_or_create_user("student@demo.com", "demo1234", "STUDENT")
        recruiter_user = await _get_or_create_user("recruiter@techcorp.com", "demo1234", "RECRUITER")

        student_profile = await prisma.studentprofile.find_unique(
            where={"userId": student_user.id}
        )
        if not student_profile:
            await prisma.studentprofile.create(
                data={
                    "userId": student_user.id,
                    "fullName": "Demo Student",
                    "college": "Demo Institute of Technology",
                    "branch": "Computer Science",
                    "gpa": 8.4,
                    "skills": ["Python", "SQL", "React"],
                    "certifications": [],
                    "projects": ["Talent matching assistant", "Campus event tracker"],
                    "experienceMonths": 0,
                    "preferredRoles": ["Data Analyst", "ML Intern"],
                    "preferredLocations": ["Bangalore", "Remote"],
                }
            )

        recruiter_profile = await prisma.recruiterprofile.find_unique(
            where={"userId": recruiter_user.id}
        )
        if not recruiter_profile:
            recruiter_profile = await prisma.recruiterprofile.create(
                data={
                    "userId": recruiter_user.id,
                    "fullName": "Hiring Manager",
                    "company": "TechCorp",
                    "designation": "Talent Acquisition Lead",
                }
            )

        existing_jobs = await prisma.jobposting.find_many(
            where={"recruiterId": recruiter_profile.id}
        )
        if not existing_jobs:
            jobs = [
                {
                    "company": "TechCorp",
                    "roleTitle": "Data Analyst Intern",
                    "location": "Bangalore",
                    "domain": "Data",
                    "requiredSkills": ["Python", "SQL"],
                    "preferredSkills": ["Pandas", "Power BI"],
                    "descriptionRaw": "Analyze student hiring funnel data and dashboards.",
                },
                {
                    "company": "TechCorp",
                    "roleTitle": "ML Engineer Intern",
                    "location": "Remote",
                    "domain": "Machine Learning",
                    "requiredSkills": ["Python", "scikit-learn"],
                    "preferredSkills": ["NLP", "Model explainability"],
                    "descriptionRaw": "Prototype matching models and evaluation tooling.",
                },
                {
                    "company": "TechCorp",
                    "roleTitle": "Frontend Intern",
                    "location": "Mumbai",
                    "domain": "Frontend",
                    "requiredSkills": ["React", "JavaScript"],
                    "preferredSkills": ["CSS", "API integration"],
                    "descriptionRaw": "Build recruiter and student dashboard interfaces.",
                },
            ]
            for job in jobs:
                await prisma.jobposting.create(
                    data={
                        "recruiterId": recruiter_profile.id,
                        "company": job["company"],
                        "roleTitle": job["roleTitle"],
                        "location": job["location"],
                        "domain": job["domain"],
                        "requiredSkills": job["requiredSkills"],
                        "preferredSkills": job["preferredSkills"],
                        "descriptionRaw": job["descriptionRaw"],
                    }
                )
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(seed())