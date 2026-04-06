"""
backend/app/ml/model_manager.py
Manages model artifacts, ensuring rolling archives of old models
so that deployments are safe and rollback-able.
"""

import json
import shutil
import joblib
from pathlib import Path
from datetime import datetime

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ARCHIVE_DIR = ARTIFACTS_DIR / "archive"

def save_new_model(model, scaler, feature_names: list[str], metadata: dict) -> None:
    """Save new model atomically and archive old ones."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Archive EXISTING models
    existing_pkl = ARTIFACTS_DIR / "scorer_model.pkl"
    if existing_pkl.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_dir = ARCHIVE_DIR / f"model_run_{timestamp}"
        target_dir.mkdir(exist_ok=True)
        
        # Move all current artifacts to the new timestamped archive folder
        for item in ["scorer_model.pkl", "scorer_model.joblib", "feature_scaler.pkl", "feature_names.pkl", "feature_names.json", "model_metadata.json", "feature_importance.png"]:
            old_item = ARTIFACTS_DIR / item
            if old_item.exists():
                shutil.move(str(old_item), str(target_dir / item))
                
        print(f"Archived old model suite to {target_dir}")
        
        # Keep only the last 3 archives
        archives = sorted([d for d in ARCHIVE_DIR.iterdir() if d.is_dir() and d.name.startswith("model_run_")])
        for old_archive in archives[:-3]:
            shutil.rmtree(old_archive)
            print(f"Deleted old archive: {old_archive}")
    
    # 2. Save NEW artifacts atomically
    try:
        tmp_model = ARTIFACTS_DIR / "scorer_model.pkl.tmp"
        tmp_scaler = ARTIFACTS_DIR / "feature_scaler.pkl.tmp"
        tmp_feats = ARTIFACTS_DIR / "feature_names.pkl.tmp"
        
        joblib.dump(model, tmp_model)
        joblib.dump(scaler, tmp_scaler)
        joblib.dump(feature_names, tmp_feats)
        
        # Save JSON explicitly for human readability
        (ARTIFACTS_DIR / "feature_names.json").write_text(json.dumps(feature_names))
        
        # Save metadata
        final_metadata = {
            "trained_at": datetime.now().isoformat(),
            "n_features": len(feature_names),
            **metadata
        }
        with open(ARTIFACTS_DIR / "model_metadata.json", "w") as f:
            json.dump(final_metadata, f, indent=2)
            
        # Rename tmp files to active (Atomic overwrite)
        tmp_model.rename(ARTIFACTS_DIR / "scorer_model.pkl")
        tmp_scaler.rename(ARTIFACTS_DIR / "feature_scaler.pkl")
        tmp_feats.rename(ARTIFACTS_DIR / "feature_names.pkl")
        
        print("✅ Model suite replaced safely & atomically")
    except Exception as e:
        # Cleanup broken temp files on failure
        for tmp in [tmp_model, tmp_scaler, tmp_feats]:
            if tmp.exists(): tmp.unlink()
        print(f"❌ Failed to save new model. Restoring aborted. Error: {e}")
        raise
