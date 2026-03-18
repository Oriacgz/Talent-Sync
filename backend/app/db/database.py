# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Creates SQLAlchemy engine and session.
#                 get_db() is a FastAPI dependency injected into every route.
# DEPENDS ON: sqlalchemy, config.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()