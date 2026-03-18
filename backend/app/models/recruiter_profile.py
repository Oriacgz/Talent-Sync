# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Recruiter profile table. Company info linked to user.
# DEPENDS ON: database.py Base, users table (FK)

from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name    = Column(String)
    company_name = Column(String)
    industry     = Column(String)
    company_size = Column(String)
    website      = Column(String, nullable=True)