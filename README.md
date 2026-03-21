# TalentSync

## Quick Start
1. Create `backend/.env` from `backend/.env.example`.
2. Set `GEMINI_API_KEY` from https://aistudio.google.com/app/apikey.
3. Start backend and database:
docker-compose up -d
4. Start frontend:
cd frontend && npm install && npm run dev

## API Docs
http://localhost:8000/docs

## Notes
- Ollama is removed. Chatbot now uses Gemini API.
- Backend startup runs `prisma generate` and `prisma migrate deploy` before uvicorn.

## Team
- Frontend: components/shared, pages, store, services
- Backend:  app/api, app/services, app/middleware
- ML:       app/ml, scripts/