# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: FastAPI app entry point. Registers CORS, rate limiter,
#                 all routers. On startup: creates DB tables + loads SBERT model.
# DEPENDS ON: all api routers, config, Prisma db client

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import prisma
from app.api import auth, students, recruiters, jobs, matches
from app.api import applications, chatbot, analytics

app = FastAPI(title="TalentSync API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(recruiters.router)
app.include_router(jobs.router)
app.include_router(matches.router)
app.include_router(applications.router)
app.include_router(chatbot.router)
app.include_router(analytics.router)

@app.on_event("startup")
async def startup():
    await prisma.connect()
    # TODO: from app.ml.encoder import load_model; load_model()


@app.on_event("shutdown")
async def shutdown():
    await prisma.disconnect()

@app.get("/")
def root():
    return {"message": "TalentSync API is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "TalentSync API"}