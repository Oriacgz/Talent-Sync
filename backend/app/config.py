# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: All environment variable settings loaded from .env file.
#                 DATABASE_URL, JWT_SECRET, OLLAMA config, SBERT model name.
# DEPENDS ON: pydantic-settings, .env file

from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://talentsync:talentsync@localhost:5432/talentsync"
    JWT_SECRET: str = "change_this"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    SBERT_MODEL_NAME: str = "all-MiniLM-L6-v2"
    CORS_ORIGINS: list = ["http://localhost:5173"]
    class Config:
        env_file = ".env"
settings = Settings()