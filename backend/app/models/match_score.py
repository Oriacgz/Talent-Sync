# WHO WRITES THIS: Backend developer / ML developer
# WHAT THIS DOES: Stores computed match scores between student and job.
#                 shap_values is a JSON object explaining the score breakdown.
#                 Recomputed when student profile or job changes.
# DEPENDS ON: database.py Base, users table (FK), job_postings (FK)

from sqlalchemy import Column, Integer, Float, JSON, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class MatchScore(Base):
    __tablename__ = "match_scores"
    id               = Column(Integer, primary_key=True)
    student_id       = Column(Integer, ForeignKey("users.id"))
    job_id           = Column(Integer, ForeignKey("job_postings.id"))
    semantic_score   = Column(Float, default=0.0)
    academic_score   = Column(Float, default=0.0)
    preference_score = Column(Float, default=0.0)
    hybrid_score     = Column(Float, default=0.0)
    shap_values      = Column(JSON, nullable=True)
    computed_at      = Column(DateTime(timezone=True), server_default=func.now())