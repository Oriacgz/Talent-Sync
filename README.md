# TalentSync

TalentSync is an AI-driven internship matching platform with:
- Backend: FastAPI
- Frontend: React + Vite
- Database: PostgreSQL

## Prerequisites
- Python 3.11 recommended
- Node.js 18+ and npm
- Docker Desktop (for PostgreSQL)
- Gemini API key from https://aistudio.google.com/app/apikey

## 1) Backend Local Setup

### 1.1 Create env file
From project root:

```bash
cd backend
cp .env.example .env
```

Open `.env` and set:

```env
GEMINI_API_KEY=your_real_key_here
```

### 1.2 Create virtual environment and install dependencies

```bash
cd backend
py -3.11 -m venv .venv
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 1.3 Start PostgreSQL with Docker
From project root:

```bash
docker compose up -d db
```

### 1.4 Generate Prisma client and apply migrations

```bash
cd backend
python -m prisma py fetch
python -m prisma py generate --schema prisma/schema.prisma
python -m prisma migrate deploy --schema prisma/schema.prisma
```

### 1.5 (Optional) Seed demo data

```bash
cd backend
python -m app.db.seed
```

### 1.6 Run backend server

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend URLs:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## 2) Frontend Local Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- App: http://localhost:5173

## 3) Full Stack with Docker (Alternative)
If you want backend + DB together in Docker:

```bash
docker compose up --build
```

Then run frontend locally:

```bash
cd frontend
npm install
npm run dev
```

## Quick Troubleshooting
- If `pip install -r requirements.txt` fails with `ResolutionImpossible` (`spacy` vs `fastapi-cli` / `typer`), ensure you are on Python 3.11 and re-run after pulling latest `backend/requirements.txt`.
- If `google.generativeai` import fails, reinstall backend dependencies in the active venv.
- If Prisma commands fail, make sure you are running them from `backend` directory.
- If Docker errors with daemon not running, start Docker Desktop first.