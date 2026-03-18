# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: POST /auth/register — creates user + profile, returns tokens.
#                 POST /auth/login — verifies password, returns tokens.
#                 POST /auth/refresh — validates refresh token, returns new tokens.
#                 POST /auth/logout — stateless, just returns success.
# DEPENDS ON: auth_service.py, User model, StudentProfile, RecruiterProfile

from fastapi import APIRouter
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(): pass  # TODO

@router.post("/login")
def login(): pass  # TODO

@router.post("/refresh")
def refresh(): pass  # TODO

@router.post("/logout")
def logout(): pass  # TODO