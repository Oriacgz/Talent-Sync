# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: FastAPI dependencies for auth.
#                 get_current_user() — decodes JWT, returns User object.
#                 require_role("student") — ensures user has correct role.
#                 Inject into any route with Depends().
# DEPENDS ON: jose (JWT), sqlalchemy, User model

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    pass  # TODO: decode JWT, query user, return

def require_role(role: str):
    def checker(current_user: User = Depends(get_current_user)):
        pass  # TODO: check role, raise 403 if wrong
    return checker