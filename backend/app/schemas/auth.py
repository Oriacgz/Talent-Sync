# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Request/response shapes for auth endpoints.
# DEPENDS ON: pydantic

from pydantic import BaseModel, EmailStr
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict
class RefreshRequest(BaseModel):
    refresh_token: str