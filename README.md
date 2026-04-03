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
