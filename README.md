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

**⚠️ REQUIRED TEAMMATE FILES:** Because GitHub correctly ignores large data and security files natively, you MUST manually drop the following files onto your laptop before running the ML scripts:
1. Your `.env` files (Ask the repository owner for their local secrets).
2. The exact 3 offline mock datasets placed strictly inside `ml_training/data/raw/`:
    - `student_profiles.csv`
    - `job_postings.csv`
    - `match_outcomes.csv`

Once those files are mapped, generate the machine learning engine mathematically on your laptop:

```powershell
cd C:\Talent-Sync\Talent-Sync\backend
& .\.venv\Scripts\Activate.ps1
$env:PATH = "$(Resolve-Path .\.venv\Scripts);$env:PATH"
python -m scripts.preprocess_data
python -m scripts.train_scorer
```

**What this ML process actually does:**
1. `preprocess_data.py`: This merges the 3 raw CSVs and engineers 15 structured mathematical features. 
   - **The Core Math:** It natively calculates **Cosine Similarity**. By tracking the angular distance between a Student's SBERT array and a Job's SBERT array, it builds a raw baseline Semantic Match limit (e.g., 85%). It then outputs the finalized `merged_dataset.csv`.
2. `train_scorer.py`: This script leverages XGBoost Decision Trees to formally identify exactly which of those 15 features leads to accurate HR hirings based on history. It outputs three live API binaries into your `backend/app/ml/artifacts/` folder:
    - `scorer_model.pkl`: The active XGBoost decision engine.
    - `feature_scaler.pkl`: The system that compresses extreme outliers into a controlled `[0,1]` scale purely so attributes (like arbitrary Certification counts) don't dominate XGBoost.
    - `feature_names.pkl`: Strict mappings preventing FastAPI bugs.

*(Note: The system contains an ultimate Failsafe. If the XGBoost `.pkl` becomes corrupt or missing during a deployment, the backend silently catches the error and degrades cleanly to relying exclusively on the native **Cosine Similarity** percentage mapping to continue ranking jobs safely!)*

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
