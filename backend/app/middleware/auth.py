# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: FastAPI dependencies for auth.
#                 get_current_user() - decodes JWT and returns current user.
#                 require_role("student") - ensures user has correct role.
# DEPENDS ON: auth_service, Prisma client

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.database import get_prisma
from app.services.auth_service import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    prisma = get_prisma()
    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user.model_dump()


def require_role(role: str):
    async def checker(current_user: dict = Depends(get_current_user)):
        current_role = str(current_user.get("role", "")).upper()
        if current_role != role.upper():
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return checker