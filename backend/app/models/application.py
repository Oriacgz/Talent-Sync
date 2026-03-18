# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Application table. Tracks each student's application to a job.
#                 Status flows: applied → reviewed → shortlisted → selected/rejected
# DEPENDS ON: database.py Base, users (FK), job_postings (FK)

from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class AppStatus(str, enum.Enum):
    applied     = "applied"
    reviewed    = "reviewed"
    shortlisted = "shortlisted"
    selected    = "selected"
    rejected    = "rejected"

class Application(Base):
    __tablename__ = "applications"
    id         = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    job_id     = Column(Integer, ForeignKey("job_postings.id"))
    status     = Column(Enum(AppStatus), default=AppStatus.applied)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())