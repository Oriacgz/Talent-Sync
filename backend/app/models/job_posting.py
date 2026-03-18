# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Job postings table. Stores job details and SBERT embedding.
#                 required_skills and preferred_skills are JSON arrays.
#                 embedding_vector is pre-computed from job description.
# DEPENDS ON: database.py Base, users table (FK for recruiter)

from sqlalchemy import (Column, Integer, String, Float,
    Boolean, JSON, ForeignKey, DateTime, Text)
from sqlalchemy.sql import func
from app.db.database import Base

class JobPosting(Base):
    __tablename__ = "job_postings"
    id               = Column(Integer, primary_key=True)
    recruiter_id     = Column(Integer, ForeignKey("users.id"))
    title            = Column(String, nullable=False)
    description      = Column(Text)
    required_skills  = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    domain           = Column(String, default="Any")
    location         = Column(String)
    min_gpa          = Column(Float, default=0.0)
    stipend          = Column(Integer, default=0)
    duration_months  = Column(Integer, default=3)
    embedding_vector = Column(JSON, nullable=True)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())