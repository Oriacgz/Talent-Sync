# TalentSync

TalentSync is an AI-driven internship matching platform with:
- Backend: FastAPI
- Frontend: React + Vite
- Database: PostgreSQL

## Prerequisites
- Python 3.11 recommended
- Node.js 18+ and npm
- Gemini API key from https://aistudio.google.com/app/apikey
- PostgreSQL running locally on your machine

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

If `backend/.venv` already exists, reuse it and skip creating a new one.

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

### 1.3 Generate Prisma client and apply migrations

```bash
cd backend
python -m prisma py fetch
python -m prisma py generate --schema prisma/schema.prisma
python -m prisma migrate deploy --schema prisma/schema.prisma
```

### 1.4 (Optional) Seed demo data

```bash
cd backend
python -m app.db.seed
```

### 1.5 Run backend server

```bash
cd backend

(if got any error pls run this command)
python -m uvicorn --env-file .env --app-dir . app.main:app --host 0.0.0.0 --port 8000 --reload

OR

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

## Quick Troubleshooting
- If `pip install -r requirements.txt` fails with `ResolutionImpossible` (`spacy` vs `fastapi-cli` / `typer`), ensure you are on Python 3.11 and re-run after pulling latest `backend/requirements.txt`.
- If `google.generativeai` import fails, reinstall backend dependencies in the active venv.
- If Prisma commands fail, make sure you are running them from `backend` directory.
- If backend startup fails with `The Client hasn't been generated yet`, run:
	- `python -m prisma py generate --schema prisma/schema.prisma`
- If backend startup fails with `ImportError: email-validator is not installed`, run:
	- `pip install -r requirements.txt`
- If backend startup fails with `Environment variable not found: DATABASE_URL`, ensure `backend/.env` exists and run backend with `--env-file .env`.