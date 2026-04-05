"""
backend/scripts/preprocess_data.py
Preprocesses raw CSVs into a clean merged DataFrame ready for ML.
Handles: pipe-delimited lists, column renames, join logic, feature engineering.
Saves processed output to ml_training/data/processed/merged_dataset.csv
"""

import os
import pandas as pd
from pathlib import Path

RAW_DIR = Path("ml_training/data/raw")
PROC_DIR = Path("ml_training/data/processed")
PROC_DIR.mkdir(parents=True, exist_ok=True)

def parse_pipe_list(val):
    if pd.isna(val) or val == "":
        return []
    return [item.strip() for item in str(val).split("|")]

def main():
    print("📂 Loading raw CSVs...")
    
    # Check if files exist
    students_path = RAW_DIR / "student_profiles.csv"
    jobs_path = RAW_DIR / "job_postings.csv"
    outcomes_path = RAW_DIR / "match_outcomes.csv"
    
    if not all(p.exists() for p in [students_path, jobs_path, outcomes_path]):
        print(f"❌ Error: One or more raw CSV files missing in {RAW_DIR}")
        return

    students = pd.read_csv(students_path)
    jobs = pd.read_csv(jobs_path)
    outcomes = pd.read_csv(outcomes_path)

    print(f"   Students: {students.shape}")
    print(f"   Jobs: {jobs.shape}")
    print(f"   Outcomes: {outcomes.shape}")

    # Step 1: Parse pipe-delimited columns into lists
    pipe_cols_students = ["skills", "certifications", "preferred_roles", "preferred_locations"]
    pipe_cols_jobs = ["required_skills", "preferred_skills"]
    
    for col in pipe_cols_students:
        if col in students.columns:
            students[col] = students[col].apply(parse_pipe_list)
            
    for col in pipe_cols_jobs:
        if col in jobs.columns:
            jobs[col] = jobs[col].apply(parse_pipe_list)

    # Step 2: Join logic
    print("\n🔗 Joining datasets...")
    # Join outcomes with students on student_id
    df = outcomes.merge(students, on="student_id", how="inner")
    # Join with jobs on job_id
    df = df.merge(jobs, on="job_id", how="inner")

    # Step 3: Consistency checks & Renames
    # The user mentioned GPA/CGPA column name consistency.
    # In student_profiles.csv it's 'gpa', in job_postings.csv it's 'min_gpa'.
    # We'll stick to 'was_selected' as target.
    
    if "matched" in df.columns and "was_selected" not in df.columns:
        df = df.rename(columns={"matched": "was_selected"})

    # Cap certification_bonus to 1.0 (binary)
    if "certification_bonus" in df.columns:
        df["certification_bonus"] = df["certification_bonus"].clip(upper=1.0)

    print(f"   Merged Shape: {df.shape}")

    # Step 4: Save processed output
    output_path = PROC_DIR / "merged_dataset.csv"
    
    # When saving to CSV, lists will be converted back to strings by default (usually as string representation).
    # However, for ML training, we often want the list structure preserved if reading back.
    # Since we're saving to CSV, we'll save it such that it can be read back and re-parsed if needed.
    # Re-converting lists to pipes for the CSV file but keeping them as lists in the DataFrame.
    
    df_to_save = df.copy()
    for col in pipe_cols_students + pipe_cols_jobs:
        if col in df_to_save.columns:
            df_to_save[col] = df_to_save[col].apply(lambda x: "|".join(x) if isinstance(x, list) else x)

    df_to_save.to_csv(output_path, index=False)
    print(f"✅ Saved merged dataset to {output_path}")

    # Step 5: Print class distribution
    if "was_selected" in df.columns:
        counts = df["was_selected"].value_counts(normalize=True) * 100
        print("\n📊 Class Distribution (was_selected):")
        for val, pct in counts.items():
            print(f"   {val}: {pct:.2f}%")
        
        pos_rate = counts.get(1, 0)
        print(f"   Expected positive rate: ~13.66% (Actual: {pos_rate:.2f}%)")

if __name__ == "__main__":
    main()
