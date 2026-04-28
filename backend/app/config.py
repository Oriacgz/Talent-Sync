# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: All environment variable settings loaded from .env file.
#                 DATABASE_URL, JWT_SECRET, Ollama config, SBERT model name.
# DEPENDS ON: pydantic-settings, .env file

from pydantic_settings import BaseSettings
import json
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://talentsync:talentsync@localhost:5432/talentsync"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change_this_default_secret_in_production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # LLM — Ollama (Llama 3.2)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_TIMEOUT: int = 5  # seconds (reduced to fail fast when Ollama missing)

    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    class Config:
        env_file = ".env"
        extra = "ignore"

    def __init__(self, **data):
        super().__init__(**data)
        # Parse CORS_ORIGINS from env if it's a string (JSON array)
        if isinstance(self.CORS_ORIGINS, str):
            try:
                self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)
            except (json.JSONDecodeError, TypeError):
                self.CORS_ORIGINS = ["http://localhost:5173"]


settings = Settings()