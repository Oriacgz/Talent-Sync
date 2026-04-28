# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: FastAPI dependencies for auth.
#                 get_current_user() - decodes JWT and returns current user.
#                 require_role("student") - ensures user has correct role.
# DEPENDS ON: auth_service, Prisma client

from datetime import datetime, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.database import get_prisma
from app.services.auth_service import decode_token

security = HTTPBearer()

# Simple in-memory user cache to prevent hitting the DB on every request.
# Format: { user_id: (user_dict, timestamp) }
_USER_CACHE: dict = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


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

    now = datetime.now(timezone.utc)
    if user_id in _USER_CACHE:
        cached_user, cached_time = _USER_CACHE[user_id]
        if (now - cached_time).total_seconds() < CACHE_TTL_SECONDS:
            return cached_user

    prisma = get_prisma()
    user = await prisma.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    data = user.model_dump()
    data.pop("passwordHash", None)
    
    # Prevent cache from growing infinitely
    if len(_USER_CACHE) > 5000:
        _USER_CACHE.clear()
        
    _USER_CACHE[user_id] = (data, now)
    
    return data


def require_role(role: str):
    async def checker(current_user: dict = Depends(get_current_user)):
        current_role = str(current_user.get("role", "")).upper()
        if current_role != role.upper():
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user

    return checker