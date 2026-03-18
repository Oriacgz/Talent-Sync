# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Student profile table. All fields a student fills in.
#                 skills and projects stored as JSON arrays.
#                 embedding_vector stores SBERT encoding (JSON list of floats).
# DEPENDS ON: database.py Base, users table (FK)

from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from app.db.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id                  = Column(Integer, primary_key=True)
    user_id             = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name           = Column(String)
    college             = Column(String)
    college_tier        = Column(Integer, default=2)
    gpa                 = Column(Float, default=0.0)
    graduation_year     = Column(Integer)
    degree              = Column(String)
    branch              = Column(String)
    skills              = Column(JSON, default=list)
    projects            = Column(JSON, default=list)
    experience_months   = Column(Integer, default=0)
    preferred_roles     = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)
    preferred_domain    = Column(String, default="Any")
    resume_url          = Column(String, nullable=True)
    embedding_vector    = Column(JSON, nullable=True)
    profile_complete    = Column(Boolean, default=False)