"""
backend/scripts/train_scorer.py
Trains XGBoost scorer on SBERT similarity + rule-based features.
Run: python -m scripts.train_scorer
Requires: pip install xgboost scikit-learn joblib matplotlib numpy
"""

from __future__ import annotations

import json
import csv
from datetime import datetime
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

RAW_DIR = Path("ml_training/data/raw")
PROC_DIR = Path("ml_training/data/processed")
ARTIFACTS_DIR = Path("backend/app/ml/artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_NAMES = [
    "cosine_similarity",
    "skill_overlap_count",
    "skill_overlap_ratio",
    "cgpa_meets_requirement",
    "branch_eligible",
    "experience_match",
    "role_match",
    "location_match",
    "education_match",
]


# ── Feature builder ───────────────────────────────────────────────────────────

def build_features(
    student: dict,
    job: dict,
    similarity: float,
) -> list[float]:
    """Build 9 features for a student-job pair. Must match FEATURE_NAMES order."""

    s_skills = set(s.lower() for s in student.get("skills", []))
    j_skills = set(s.lower() for s in job.get("required_skills", []))

    # 1. Cosine similarity (from SBERT)
    f_similarity = float(similarity)

    # 2. Skill overlap count
    overlap = s_skills & j_skills
    f_skill_count = float(len(overlap))

    # 3. Skill overlap ratio (overlap / student skills)
    f_skill_ratio = len(overlap) / max(len(s_skills), 1)

    # 4. CGPA meets requirement
    f_cgpa = float(student.get("cgpa", 0) >= job.get("min_cgpa", 0))

    # 5. Branch eligible
    eligible = job.get("eligible_branches", [])
    f_branch = float(
        job.get("education", "Any") == "Any"
        or student.get("branch", "") in eligible
    )

    # 6. Experience level match
    f_exp = float(
        student.get("experience_level", "") == job.get("experience_level", "")
    )

    # 7. Preferred role matches job title
    preferred = [r.lower() for r in student.get("preferred_roles", [])]
    job_title = job.get("title", "").lower()
    f_role = float(
        any(role in job_title or job_title in role for role in preferred)
    )

    # 8. Location match
    pref_locs = [l.lower() for l in student.get("preferred_locations", [])]
    job_loc = job.get("location", "").lower()
    f_location = float(job_loc in pref_locs or "remote" in pref_locs)

    # 9. Education match
    job_edu = job.get("education", "Any")
    f_edu = float(
        job_edu == "Any"
        or student.get("degree", "").lower() in job_edu.lower()
    )

    return [
        f_similarity, f_skill_count, f_skill_ratio,
        f_cgpa, f_branch, f_exp, f_role, f_location, f_edu,
    ]


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("📦 Loading data...")

    students = json.loads((RAW_DIR / "student_profiles.json").read_text())
    jobs = json.loads((RAW_DIR / "job_postings.json").read_text())
    similarity_scores = np.load(PROC_DIR / "similarity_scores.npy")

    student_map = {s["student_id"]: s for s in students}
    job_map = {j["job_id"]: j for j in jobs}

    pairs = []
    with open(RAW_DIR / "match_outcomes.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pairs.append(row)

    print(f"   Pairs loaded: {len(pairs)}")

    # Build feature matrix
    print("\n🔧 Building feature matrix...")
    X_rows, y_rows = [], []

    for i, pair in enumerate(pairs):
        student = student_map.get(pair["student_id"])
        job = job_map.get(pair["job_id"])
        if not student or not job:
            continue
        sim = float(similarity_scores[i]) if i < len(similarity_scores) else 0.0
        feats = build_features(student, job, sim)
        X_rows.append(feats)
        y_rows.append(int(pair["matched"]))

    X = np.array(X_rows, dtype=np.float32)
    y = np.array(y_rows, dtype=np.int32)

    print(f"   Feature matrix: {X.shape}")
    print(f"   Positive rate : {y.mean()*100:.1f}%")

    # Save full feature matrix
    np.save(PROC_DIR / "features.npy", X)
    (PROC_DIR / "feature_names.json").write_text(json.dumps(FEATURE_NAMES))

    # Train / test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Class imbalance weight
    pos = y_train.sum()
    neg = len(y_train) - pos
    scale_pos_weight = neg / max(pos, 1)

    print(f"\n🚀 Training XGBoost...")
    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss",
        verbosity=0,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print(f"\n📊 Test Metrics:")
    print(f"   Accuracy  : {acc:.4f}")
    print(f"   Precision : {prec:.4f}")
    print(f"   Recall    : {rec:.4f}")
    print(f"   F1        : {f1:.4f}")
    print(f"   AUC-ROC   : {auc:.4f}")

    if auc < 0.70:
        print("⚠️  AUC < 0.70 — consider checking feature engineering or data quality.")

    # Save model
    model_path = ARTIFACTS_DIR / "scorer_model.joblib"
    joblib.dump(model, model_path)
    (ARTIFACTS_DIR / "feature_names.json").write_text(json.dumps(FEATURE_NAMES))

    metadata = {
        "trained_at": datetime.utcnow().isoformat(),
        "n_samples": len(X),
        "n_features": X.shape[1],
        "test_accuracy": round(acc, 4),
        "test_f1": round(f1, 4),
        "test_auc": round(auc, 4),
        "class_distribution": {
            "positive": int(y.sum()),
            "negative": int((y == 0).sum()),
        },
        "feature_names": FEATURE_NAMES,
    }
    (ARTIFACTS_DIR / "model_metadata.json").write_text(json.dumps(metadata, indent=2))

    # Feature importance chart
    importances = model.feature_importances_
    plt.figure(figsize=(8, 5))
    bars = plt.barh(FEATURE_NAMES, importances, color="#F5C542", edgecolor="#1A1A1A")
    plt.xlabel("Importance")
    plt.title("Feature Importance — TalentSync Scorer")
    plt.tight_layout()
    plt.savefig(ARTIFACTS_DIR / "feature_importance.png", dpi=150)
    plt.close()

    print(f"\n✅ Model saved to {ARTIFACTS_DIR.resolve()}")
    print(f"   scorer_model.joblib")
    print(f"   feature_names.json")
    print(f"   model_metadata.json")
    print(f"   feature_importance.png")


if __name__ == "__main__":
    main()