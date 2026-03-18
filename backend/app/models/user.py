# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Users table. Stores email, hashed password, and role.
#                 Role is ENUM: student or recruiter.
# DEPENDS ON: database.py Base

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    student = "student"
    recruiter = "recruiter"

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(Enum(UserRole), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())