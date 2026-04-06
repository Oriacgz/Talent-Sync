"""
backend/scripts/train_scorer.py
Trains XGBoost scorer on real CSV data + SBERT embeddings.
Run: .venv/Scripts/python.exe -m backend.scripts.train_scorer
Requires: pip install xgboost scikit-learn joblib matplotlib numpy pandas
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")          # headless backend — no GUI needed
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from numpy.linalg import norm
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

# Add model manager import (path fix)
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.app.ml.model_manager import save_new_model

# ── Paths ────────────────────────────────────────────────────────────────────

ROOT_DIR    = Path(__file__).resolve().parent.parent.parent
PROC_DIR    = ROOT_DIR / "ml_training" / "data" / "processed"
ARTIFACTS   = Path(__file__).resolve().parent.parent / "app" / "ml" / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

# ── Features ─────────────────────────────────────────────────────────────────
# SAFE features only — NO leakage columns
# (fairness_corrected_score, hybrid_score, rank_in_job, was_selected are EXCLUDED)

SAFE_FEATURES = [
    # Semantic signals
    "sbert_similarity",
    "semantic_score",
    "skill_overlap_ratio",
    
    # Academic / Eligibility
    "cgpa_normalized",
    "cgpa_meets_threshold",
    "backlog_penalty",
    "branch_eligible",
    
    # Experience signals
    "experience_score",
    "experience_months",
    "experience_gap",
    
    # Preference signals
    "preference_score",
    "location_match",
    "domain_match",
    
    # Profile quality signals
    "skill_gap_score",
    "profile_completeness",
]

LEAKAGE_GUARD = {
    "fairness_corrected_score",
    "hybrid_score",
    "was_selected",
    "rank_in_job",
}


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    # ── Step 1: Load data ────────────────────────────────────────────────────
    merged_path = PROC_DIR / "merged_dataset.csv"
    if not merged_path.exists():
        print("❌ merged_dataset.csv not found. Run preprocess_data.py first.")
        return

    print("📦 Loading merged dataset...")
    df = pd.read_csv(merged_path)
    print(f"   Shape: {df.shape}")
    print(f"   Class distribution:\n{df['was_selected'].value_counts()}")

    # ── Step 2: Feature engineering ──────────────────────────────────────────
    print("\n🔧 Engineering features...")
    # ── Step 2: Compute Embeddings First ─────────────────────────────────────
    emb_student_path = ARTIFACTS / "student_embeddings.npy"
    emb_job_path     = ARTIFACTS / "job_embeddings.npy"
    sid_map_path     = ARTIFACTS / "student_id_map.json"
    jid_map_path     = ARTIFACTS / "job_id_map.json"

    if all(p.exists() for p in [emb_student_path, emb_job_path, sid_map_path, jid_map_path]):
        print("   Loading SBERT embeddings for cosine similarity...")
        student_embs = np.load(emb_student_path)
        job_embs     = np.load(emb_job_path)
        with open(sid_map_path) as f:
            student_id_map = json.load(f)
        with open(jid_map_path) as f:
            job_id_map = json.load(f)

        s_indices = df["student_id"].map(student_id_map).values
        j_indices = df["job_id"].map(job_id_map).values

        s_vecs = student_embs[s_indices]        # (100k, 384)
        j_vecs = job_embs[j_indices]            # (100k, 384)

        dot   = np.sum(s_vecs * j_vecs, axis=1)
        norms = norm(s_vecs, axis=1) * norm(j_vecs, axis=1) + 1e-8
        df["sbert_similarity"] = np.clip(dot / norms, 0.0, 1.0)
    else:
        print("   ⚠ Embedding artifacts missing — skipping sbert_similarity.")
        df["sbert_similarity"] = 0.0

    # ── Step 2b: Apply shared Feature Builder   ──────────────────────────────
    print("   Applying central feature_builder.py...")
    from app.ml.feature_builder import build_features  # dynamic import ensures no circular dependency

    features_list = []
    for idx, row in df.iterrows():
        # Pass dictionaries exactly as API would
        row_dict = row.to_dict()
        f = build_features(student=row_dict, job=row_dict, similarity=row["sbert_similarity"])
        features_list.append(f)

    # Reconstruct DF exactly over the SAFE_FEATURES bounds
    feature_matrix = np.vstack(features_list)
    df_features = pd.DataFrame(feature_matrix, columns=SAFE_FEATURES)
    for col in SAFE_FEATURES:
        df[col] = df_features[col]
    
    active_features = SAFE_FEATURES

    # ── Step 3: Prepare X / y with class imbalance handling ──────────────────
    X = df[active_features].fillna(0).astype(np.float32)
    y = df["was_selected"].astype(np.int32)

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )

    scaler = MinMaxScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_test = scaler.transform(X_test_raw)

    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    scale_pos_weight = neg / max(pos, 1)
    print(f"\n⚖️  Class imbalance — scale_pos_weight: {scale_pos_weight:.2f}")
    print(f"   Train: {len(y_train):,}  |  Test: {len(y_test):,}")

    # ── Step 4: Train XGBoost ────────────────────────────────────────────────
    print("\n🚀 Training XGBoost (300 rounds, depth 4, regularized)...")
    model = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.6,
        reg_alpha=1.5,
        reg_lambda=2.0,
        min_child_weight=5,
        scale_pos_weight=scale_pos_weight,
        eval_metric="auc",
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,
    )

    # ── Step 5: Evaluate ──────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)
    auc  = roc_auc_score(y_test, y_prob)
    ap   = average_precision_score(y_test, y_prob)

    print(f"\n📊 Test Metrics:")
    print(f"   Accuracy         : {acc:.4f}")
    print(f"   Precision        : {prec:.4f}")
    print(f"   Recall           : {rec:.4f}")
    print(f"   F1               : {f1:.4f}")
    print(f"   ROC-AUC          : {auc:.4f}")
    print(f"   Avg Precision    : {ap:.4f}")

    if auc < 0.70:
        print("⚠️  AUC < 0.70 — consider improving features or data quality.")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Feature importance table
    fi = pd.DataFrame({
        "feature": active_features,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)
    print("Feature Importance:")
    print(fi.to_string(index=False))

    max_fi = fi["importance"].max()
    if max_fi > 0.30:
        raise RuntimeError(f"🚨🚨 Feature dominance detected! Max importance: {max_fi:.2f}. Aborting deployment.")

    # ── Step 6: Save Artifacts ────────────────────────────────────────────────
    print("\n💾 Saving artifacts...")

    # Metadata
    metadata = {
        "n_samples": len(X),
        "test_accuracy": round(acc, 4),
        "test_precision": round(prec, 4),
        "test_recall": round(rec, 4),
        "test_f1": round(f1, 4),
        "test_auc_roc": round(auc, 4),
        "test_avg_precision": round(ap, 4),
        "scale_pos_weight": round(scale_pos_weight, 2),
        "class_distribution": {
            "positive": int(y.sum()),
            "negative": int((y == 0).sum()),
            "positive_rate": round(y.mean() * 100, 2),
        },
        "feature_importance": {
            row["feature"]: round(row["importance"], 4)
            for _, row in fi.iterrows()
        },
        "xgboost_params": {
            "n_estimators": 300,
            "max_depth": 4,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.6,
            "reg_alpha": 1.5,
            "reg_lambda": 2.0,
            "min_child_weight": 5,
        },
    }
    
    # Save model and archive old ones
    save_new_model(model, scaler, active_features, metadata)

    # Feature importance chart
    plt.figure(figsize=(10, 6))
    plt.barh(fi["feature"], fi["importance"], color="#F5C542", edgecolor="#1A1A1A")
    plt.xlabel("Importance (Gain)")
    plt.title("Feature Importance — TalentSync XGBoost Scorer")
    plt.tight_layout()
    plt.savefig(ARTIFACTS / "feature_importance.png", dpi=150)
    plt.close()

    print(f"\n✅ All artifacts saved to {ARTIFACTS.resolve()}")
    print(f"   scorer_model.pkl          — XGBoost binary")
    print(f"   feature_scaler.pkl        — MinMaxScaler")
    print(f"   feature_names.pkl         — feature list")
    print(f"   feature_names.json        — feature list (human-readable)")
    print(f"   model_metadata.json       — training metadata")
    print(f"   feature_importance.png    — chart")


if __name__ == "__main__":
    main()