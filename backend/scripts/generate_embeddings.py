"""
backend/scripts/generate_embeddings.py
Encodes student profiles + job postings using SBERT.
Run: python -m scripts.generate_embeddings
Requires: pip install sentence-transformers tqdm numpy pandas
"""

from __future__ import annotations
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

# Step 2: Use existing encoder
sys.path.insert(0, 'backend')
from app.ml.encoder import ProfileEncoder

RAW_DIR = Path("ml_training/data/raw")
ARTIFACTS_DIR = Path("backend/app/ml/artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# Step 1: Text representations
def student_to_text(row):
    skills = row['skills'] if isinstance(row['skills'], list) else str(row['skills']).split('|')
    gpa = row.get('cgpa', row.get('gpa', ''))
    exp_months = row.get('experience_months', 0)
    return f"Skills: {', '.join(skills)}. Degree: {row['degree']}. Branch: {row['branch']}. GPA: {gpa}. Experience: {exp_months} months. Preferred roles: {row['preferred_roles']}."

def job_to_text(row):
    req_skills = row['required_skills'] if isinstance(row['required_skills'], list) else str(row['required_skills']).split('|')
    title = row.get('title', row.get('role_title', ''))
    domain = row.get('domain', '')
    min_gpa = row.get('min_gpa', '')
    desc_raw = str(row.get('description_raw', row.get('description', '')))[:200]
    return f"Role: {title}. Required skills: {', '.join(req_skills)}. Domain: {domain}. Min GPA: {min_gpa}. Description: {desc_raw}."

# Step 3: Batch processing
def encode_in_batches(texts, encoder, batch_size=32):
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        batch_embeddings = encoder.model.encode(batch)
        embeddings.extend(batch_embeddings)
        print(f"Encoded {min(i+batch_size, len(texts))}/{len(texts)}")
    return np.array(embeddings)

def main():
    print("📦 Loading raw data...")
    students_df = pd.read_csv(RAW_DIR / "student_profiles.csv")
    jobs_df = pd.read_csv(RAW_DIR / "job_postings.csv")

    student_texts = [student_to_text(row) for _, row in students_df.iterrows()]
    job_texts = [job_to_text(row) for _, row in jobs_df.iterrows()]

    print("🤖 Loading ProfileEncoder...")
    encoder = ProfileEncoder()

    print("\n🔄 Encoding student profiles...")
    student_embeddings = encode_in_batches(student_texts, encoder, batch_size=32)

    print("\n🔄 Encoding job postings...")
    job_embeddings = encode_in_batches(job_texts, encoder, batch_size=32)

    # Id mapping
    student_id_to_index = {sid: i for i, sid in enumerate(students_df['student_id'])}
    job_id_to_index = {jid: i for i, jid in enumerate(jobs_df['job_id'])}

    # Step 5: Save artifacts
    print("\n💾 Saving artifacts...")
    np.save(ARTIFACTS_DIR / "student_embeddings.npy", student_embeddings)
    np.save(ARTIFACTS_DIR / "job_embeddings.npy", job_embeddings)

    with open(ARTIFACTS_DIR / "student_id_map.json", "w") as f:
        json.dump(student_id_to_index, f)
        
    with open(ARTIFACTS_DIR / "job_id_map.json", "w") as f:
        json.dump(job_id_to_index, f)

    print("Embeddings saved successfully")
    print(f"Student embeddings shape: {student_embeddings.shape}")
    print(f"Job embeddings shape: {job_embeddings.shape}")

if __name__ == "__main__":
    main()