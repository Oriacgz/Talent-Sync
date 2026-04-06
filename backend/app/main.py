# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: FastAPI app entry point. Registers CORS, rate limiter,
#                 all routers. On startup: creates DB tables + loads SBERT model.
# DEPENDS ON: all api routers, config, Prisma db client

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db.database import prisma
from app.api import auth, students, recruiters, matches
from app.api import applications, chatbot, analytics
from app.api.jobs import router as jobs_router
from app.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle — replaces deprecated on_event."""
    await prisma.connect()
    # Pre-load SBERT model using the singleton so first request isn't slow
    try:
        from app.ml import encoder
        _ = encoder.model  # triggers lazy download/load on the shared singleton
        logger.info("SBERT model loaded successfully")
    except Exception:
        logger.warning("SBERT model could not be pre-loaded (matching will load on demand)")
    yield
    await prisma.disconnect()


app = FastAPI(title="TalentSync API", version="1.0.0", lifespan=lifespan)

# ── Rate Limiter ────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ────────────────────────────────────────────────────
app.add_middleware(CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"])

# ── Routers ─────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(recruiters.router)
app.include_router(jobs_router, prefix="/api/jobs", tags=["jobs"])
app.include_router(matches.router)
app.include_router(applications.router)
app.include_router(chatbot.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "TalentSync API is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "TalentSync API"}