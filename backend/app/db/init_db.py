# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Creates all database tables on startup.
#                 Called from main.py startup event.
# DEPENDS ON: database.py, all models

def init_db():
    from app.db.database import Base, engine
    from app.models import user, student_profile, recruiter_profile
    from app.models import job_posting, match_score, application
    Base.metadata.create_all(bind=engine)