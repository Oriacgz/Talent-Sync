"""
backend/scripts/generate_embeddings.py
Encodes student profiles + job postings using SBERT.
Run: python -m scripts.generate_embeddings
Requires: pip install sentence-transformers tqdm numpy
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import csv

RAW_DIR = Path("ml_training/data/raw")
OUT_DIR = Path("ml_training/data/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
BATCH_SIZE = 64


# ── Text builders ─────────────────────────────────────────────────────────────

def student_to_text(s: dict) -> str:
    skills = ", ".join(s.get("skills", []))
    roles = ", ".join(s.get("preferred_roles", []))
    locations = ", ".join(s.get("preferred_locations", []))
    return (
        f"Skills: {skills}. "
        f"Degree: {s.get('degree', '')} {s.get('branch', '')}. "
        f"Roles: {roles}. "
        f"Experience: {s.get('experience_level', '')}. "
        f"Location: {locations}."
    )


def job_to_text(j: dict) -> str:
    skills = ", ".join(j.get("required_skills", []))
    return (
        f"Title: {j.get('title', '')}. "
        f"Required Skills: {skills}. "
        f"Experience: {j.get('experience_level', '')}. "
        f"Education: {j.get('education', '')}. "
        f"Location: {j.get('location', '')}. "
        f"Type: {j.get('job_type', '')}. "
        f"Mode: {j.get('work_mode', '')}."
    )


def encode_in_batches(
    model: SentenceTransformer,
    texts: list[str],
    desc: str,
) -> np.ndarray:
    all_embeddings = []
    for i in tqdm(range(0, len(texts), BATCH_SIZE), desc=desc):
        batch = texts[i: i + BATCH_SIZE]
        embeddings = model.encode(batch, convert_to_numpy=True, show_progress_bar=False)
        all_embeddings.append(embeddings)
    return np.vstack(all_embeddings)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print(f"📦 Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    # Load raw data
    students = json.loads((RAW_DIR / "student_profiles.json").read_text())
    jobs = json.loads((RAW_DIR / "job_postings.json").read_text())

    student_ids = [s["student_id"] for s in students]
    job_ids = [j["job_id"] for j in jobs]

    # Build text
    student_texts = [student_to_text(s) for s in students]
    job_texts = [job_to_text(j) for j in jobs]

    # Encode
    t0 = time.time()
    print("\n🔄 Encoding student profiles...")
    student_embeddings = encode_in_batches(model, student_texts, "Students")

    print("\n🔄 Encoding job postings...")
    job_embeddings = encode_in_batches(model, job_texts, "Jobs")
    elapsed = time.time() - t0

    # Save embeddings
    np.save(OUT_DIR / "student_embeddings.npy", student_embeddings)
    np.save(OUT_DIR / "job_embeddings.npy", job_embeddings)
    (OUT_DIR / "student_ids.json").write_text(json.dumps(student_ids))
    (OUT_DIR / "job_ids.json").write_text(json.dumps(job_ids))

    # Build lookup maps
    sid_to_idx = {sid: i for i, sid in enumerate(student_ids)}
    jid_to_idx = {jid: i for i, jid in enumerate(job_ids)}

    # Compute similarity scores for match_outcomes pairs
    print("\n🔄 Computing similarity scores for match pairs...")
    pairs = []
    with open(RAW_DIR / "match_outcomes.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pairs.append(row)

    similarity_scores = []
    for pair in tqdm(pairs, desc="Similarities"):
        s_idx = sid_to_idx.get(pair["student_id"])
        j_idx = jid_to_idx.get(pair["job_id"])
        if s_idx is not None and j_idx is not None:
            sim = cosine_similarity(student_embeddings[s_idx], job_embeddings[j_idx])
        else:
            sim = 0.0
        similarity_scores.append(sim)

    similarity_scores_arr = np.array(similarity_scores, dtype=np.float32)
    np.save(OUT_DIR / "similarity_scores.npy", similarity_scores_arr)

    # Stats
    print(f"\n✅ Embeddings generated in {elapsed:.1f}s")
    print(f"   Student embeddings : {student_embeddings.shape}")
    print(f"   Job embeddings     : {job_embeddings.shape}")
    print(f"   Similarity scores  : {similarity_scores_arr.shape}")
    print(f"   Similarity mean    : {similarity_scores_arr.mean():.4f}")
    print(f"   Similarity std     : {similarity_scores_arr.std():.4f}")
    print(f"   Output             : {OUT_DIR.resolve()}")


if __name__ == "__main__":
    main()