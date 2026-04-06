# Talent-Sync

TalentSync is an AI-driven internship matching platform with:
- Backend: FastAPI
- Frontend: React + Vite
- Database: PostgreSQL

## Run Whole Project (3 Terminals, Windows PowerShell)

Use 3 terminals to run the full project:
- Terminal 1: Database
- Terminal 2: Backend
- Terminal 3: Frontend

### One-Time Setup

Run these once before first start.

```powershell
# from project root
cd C:\Talent-Sync\Talent-Sync\backend
Copy-Item .env.example .env
```

Check `backend/.env` and update values only if needed:

```env
DATABASE_URL=postgresql://talentsync:talentsync@localhost:5432/talentsync
JWT_SECRET=change_this_to_something_long_and_random
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

Keep the other values from `.env.example` as they are unless you want to change Ollama or token settings.

### Use Llama 3.2 (Ollama)

If you want AI chatbot replies from Llama 3.2, run Ollama locally.

1. Install Ollama from https://ollama.com/download
2. Pull model:

```powershell
ollama pull llama3.2
```

3. Start Ollama service (if not already running):

```powershell
ollama serve
```

4. Quick check:

```powershell
ollama list
Invoke-WebRequest http://localhost:11434 -UseBasicParsing
```

When Ollama is running, backend chat endpoints use Llama 3.2 automatically.

Install backend dependencies and prepare Prisma (reuse existing `backend/.venv`):

```powershell
cd C:\Talent-Sync\Talent-Sync\backend
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
$env:PATH = "$(Resolve-Path .\.venv\Scripts);$env:PATH"
python -m prisma py fetch
python -m prisma py generate --schema prisma/schema.prisma
python -m prisma migrate deploy --schema prisma/schema.prisma
```

### ML Setup (Important)

**⚠️ REQUIRED FILES (not tracked by Git):**
1. Create your own `backend/.env` from `backend/.env.example` and fill in your local values.
2. Obtain the 3 raw mock datasets from the team's internal source and place them in `ml_training/data/raw/`:
    - `student_profiles.csv`
    - `job_postings.csv`
    - `match_outcomes.csv`

Once those files are in place, generate the ML engine locally by running these **three** scripts in order:

```powershell
cd C:\Talent-Sync\Talent-Sync\backend
& .\.venv\Scripts\Activate.ps1
$env:PATH = "$(Resolve-Path .\.venv\Scripts);$env:PATH"

# 1. Preprocess raw data
python -m scripts.preprocess_data

# 2. Generate SBERT Embeddings (Required for semantic search)
python -m scripts.generate_embeddings

# 3. Train the XGBoost Scorer
python -m scripts.train_scorer
```

**What this ML process actually does:**
1.  **`preprocess_data.py`**: Merges raw CSVs and engineers features. 
    - Output: `ml_training/data/processed/merged_dataset.csv`
2.  **`generate_embeddings.py`**: Uses sentence-transformers (SBERT) to convert text descriptions into math vectors.
    - Output (`.npy`): `student_embeddings.npy`, `job_embeddings.npy`
    - Output (`.json`): `student_id_map.json`, `job_id_map.json`
3.  **`train_scorer.py`**: Trains the XGBoost model on the engineered features and embeddings.
    - Output (`.pkl`): `scorer_model.pkl` (The Brain), `feature_scaler.pkl`, `feature_names.pkl`
    - Output (`.json`): `model_metadata.json` (Accuracy, recall, etc.)
    - Output (`.png`): `feature_importance.png` (Chart showing what the AI cares about most)

**Artifacts Location:** All binaries and maps are stored in `backend/app/ml/artifacts/`.

*(Failsafe: If the artifacts are missing, the backend degrades to basic keyword matching automatically.)*

Install frontend dependencies:

```powershell
cd C:\Talent-Sync\Talent-Sync\frontend
npm install
```

### Terminal 1 - Start Database

```powershell
cd C:\Talent-Sync\Talent-Sync
docker compose up -d db
```

### Terminal 2 - Start Backend (existing venv)

```powershell
cd C:\Talent-Sync\Talent-Sync\backend
& .\.venv\Scripts\Activate.ps1
$env:PATH = "$(Resolve-Path .\.venv\Scripts);$env:PATH"
python -m uvicorn --env-file .env --app-dir . app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 3 - Start Frontend

```powershell
cd C:\Talent-Sync\Talent-Sync\frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs

### Stop Services

- Stop backend/frontend: `Ctrl + C` in each terminal
- Stop database:

```powershell
cd C:\Talent-Sync\Talent-Sync
docker compose down
```
