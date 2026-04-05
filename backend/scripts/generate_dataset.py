"""
backend/scripts/generate_dataset.py
Generates synthetic student profiles, job postings, and match outcome pairs.
Run: python -m scripts.generate_dataset
Output: ml_training/data/raw/
"""

from __future__ import annotations

import csv
import json
import random
import uuid
from pathlib import Path

import numpy as np

random.seed(42)
np.random.seed(42)

# ── Output paths ──────────────────────────────────────────────────────────────
OUT_DIR = Path("ml_training/data/raw")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Pools ─────────────────────────────────────────────────────────────────────
SKILL_POOL = [
    "Python", "JavaScript", "React", "TypeScript", "Node.js", "FastAPI",
    "Django", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes",
    "AWS", "GCP", "Git", "Linux", "Machine Learning", "Deep Learning", "NLP",
    "PyTorch", "TensorFlow", "Scikit-learn", "Pandas", "NumPy",
    "Data Analysis", "Tableau", "Power BI", "Excel", "Java", "C++",
    "Figma", "REST APIs", "GraphQL", "System Design", "Statistics",
    "Computer Vision",
]

ROLES_POOL = [
    "Software Engineer", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "ML Engineer", "Data Scientist", "Data Analyst",
    "DevOps Engineer", "Cloud Engineer", "Product Analyst",
    "NLP Engineer", "Computer Vision Engineer", "Business Analyst",
]

LOCATIONS_POOL = [
    "Bangalore", "Mumbai", "Hyderabad", "Pune", "Delhi",
    "Chennai", "Kolkata", "Remote", "Noida", "Gurgaon",
]

BRANCHES = ["CSE", "IT", "ECE", "EE", "ME", "DS", "AIML"]
DEGREES = ["B.Tech", "BCA", "MCA", "M.Tech", "B.Sc"]
EXP_LEVELS = ["FRESHER", "INTERN", "JUNIOR"]
JOB_EXP_LEVELS = ["FRESHER", "INTERN", "JUNIOR", "MID"]
JOB_TYPES = ["FULL_TIME", "INTERNSHIP", "CONTRACT"]
WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"]
EDU_REQ = ["Any", "B.Tech", "M.Tech"]
MIN_CGPAS = [0.0, 6.0, 6.5, 7.0, 7.5]


# ── Generators ────────────────────────────────────────────────────────────────

def make_student() -> dict:
    return {
        "student_id": str(uuid.uuid4()),
        "skills": random.sample(SKILL_POOL, random.randint(3, 8)),
        "degree": random.choice(DEGREES),
        "branch": random.choice(BRANCHES),
        "cgpa": round(random.uniform(5.0, 10.0), 2),
        "experience_level": random.choice(EXP_LEVELS),
        "preferred_roles": random.sample(ROLES_POOL, random.randint(1, 3)),
        "preferred_locations": random.sample(LOCATIONS_POOL, random.randint(1, 3)),
        "graduation_year": random.choice([2024, 2025, 2026]),
    }


def make_job() -> dict:
    return {
        "job_id": str(uuid.uuid4()),
        "title": random.choice(ROLES_POOL),
        "required_skills": random.sample(SKILL_POOL, random.randint(3, 6)),
        "experience_level": random.choice(JOB_EXP_LEVELS),
        "education": random.choice(EDU_REQ),
        "job_type": random.choice(JOB_TYPES),
        "work_mode": random.choice(WORK_MODES),
        "location": random.choice(LOCATIONS_POOL),
        "min_cgpa": random.choice(MIN_CGPAS),
        "eligible_branches": random.sample(BRANCHES, random.randint(2, 4)),
    }


def compute_match(student: dict, job: dict) -> int:
    """Deterministic match label based on 5 rules."""
    rules_met = 0

    # Rule 1: skill overlap >= 2
    overlap = len(set(student["skills"]) & set(job["required_skills"]))
    if overlap >= 2:
        rules_met += 1

    # Rule 2: cgpa meets requirement
    if student["cgpa"] >= job["min_cgpa"]:
        rules_met += 1

    # Rule 3: branch eligible or education is Any
    if job["education"] == "Any" or student["branch"] in job["eligible_branches"]:
        rules_met += 1

    # Rule 4: experience level match
    if student["experience_level"] == job["experience_level"]:
        rules_met += 1

    # Rule 5: preferred role matches job title (partial)
    role_match = any(
        role.lower() in job["title"].lower() or job["title"].lower() in role.lower()
        for role in student["preferred_roles"]
    )
    if role_match:
        rules_met += 1

    return 1 if rules_met >= 4 else 0


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("🔧 Generating dataset...")

    # Generate profiles
    students = [make_student() for _ in range(2000)]
    jobs = [make_job() for _ in range(200)]

    # Generate pairs
    pairs: list[dict] = []
    student_sample = random.sample(students, min(500, len(students)))
    for student in student_sample:
        job_sample = random.sample(jobs, random.randint(5, 15))
        for job in job_sample:
            label = compute_match(student, job)
            pairs.append({
                "student_id": student["student_id"],
                "job_id": job["job_id"],
                "matched": label,
            })

    # Ensure we have ~5000 pairs
    while len(pairs) < 5000:
        s = random.choice(students)
        j = random.choice(jobs)
        pairs.append({
            "student_id": s["student_id"],
            "job_id": j["job_id"],
            "matched": compute_match(s, j),
        })

    pairs = pairs[:5000]

    # Add 10% label noise for realism
    noise_indices = random.sample(range(len(pairs)), int(0.10 * len(pairs)))
    for i in noise_indices:
        pairs[i]["matched"] = 1 - pairs[i]["matched"]

    # Save files
    (OUT_DIR / "student_profiles.json").write_text(json.dumps(students, indent=2))
    (OUT_DIR / "job_postings.json").write_text(json.dumps(jobs, indent=2))

    with open(OUT_DIR / "match_outcomes.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["student_id", "job_id", "matched"])
        writer.writeheader()
        writer.writerows(pairs)

    # Stats
    positive = sum(p["matched"] for p in pairs)
    print(f"\n✅ Dataset generated!")
    print(f"   Students : {len(students)}")
    print(f"   Jobs     : {len(jobs)}")
    print(f"   Pairs    : {len(pairs)}")
    print(f"   Positive rate: {positive/len(pairs)*100:.1f}%")
    print(f"   Output   : {OUT_DIR.resolve()}")


if __name__ == "__main__":
    main()