# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: POST /auth/register — creates user + profile, returns tokens.
#                 POST /auth/login — verifies password, returns tokens.
#                 POST /auth/refresh — validates refresh token, returns new tokens.
#                 POST /auth/logout — stateless, just returns success.
# DEPENDS ON: auth_service.py, User model, StudentProfile, RecruiterProfile

from fastapi import APIRouter, HTTPException, Request, status
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.services.auth_service import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.db.database import prisma
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterRequest):
    req.email = req.email.strip().lower()
    # Check if email is already registered
    existing_user = await prisma.user.find_unique(where={"email": req.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash the password
    hashed_password = hash_password(req.password)

    # Ensure role is valid (case-insensitive)
    role_enum = req.role.upper()
    if role_enum not in ["STUDENT", "RECRUITER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be STUDENT or RECRUITER",
        )

    # Create the user and their associated profile together using Prisma transactions (nested creates)
    if role_enum == "STUDENT":
        new_user = await prisma.user.create(
            data={
                "email": req.email,
                "passwordHash": hashed_password,
                "role": role_enum,
                "studentProfile": {
                    "create": {
                        "fullName": req.name
                    }
                }
            },
            include={"studentProfile": True}
        )
        user_info = {"id": new_user.id, "email": new_user.email, "role": new_user.role, "name": req.name}

    elif role_enum == "RECRUITER":
        new_user = await prisma.user.create(
            data={
                "email": req.email,
                "passwordHash": hashed_password,
                "role": role_enum,
                "recruiterProfile": {
                    "create": {
                        "fullName": req.name,
                        "companyName": "" # Required field, default to empty string for now
                    }
                }
            },
            include={"recruiterProfile": True}
        )
        user_info = {"id": new_user.id, "email": new_user.email, "role": new_user.role, "name": req.name}

    # Generate tokens
    access_token = create_access_token(user_id=new_user.id)
    refresh_token = create_refresh_token(user_id=new_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_info
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest):
    req.email = req.email.strip().lower()
    user = await prisma.user.find_unique(
        where={"email": req.email},
        include={"studentProfile": True, "recruiterProfile": True}
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(req.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user_id=user.id)
    refresh_token = create_refresh_token(user_id=user.id)

    # Extract name based on profile type
    name = "User"
    if user.role == "STUDENT" and user.studentProfile:
        name = user.studentProfile.fullName
    elif user.role == "RECRUITER" and user.recruiterProfile:
        name = user.recruiterProfile.fullName

    user_info = {"id": user.id, "email": user.email, "role": user.role, "name": name}

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_info
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, req: RefreshRequest):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError()
        user_id = payload.get("sub")
    except ValueError:
       raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
       )
    
    user = await prisma.user.find_unique(
        where={"id": user_id},
        include={"studentProfile": True, "recruiterProfile": True}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(user_id=user.id)
    refresh_token = create_refresh_token(user_id=user.id)

    name = "User"
    if user.role == "STUDENT" and user.studentProfile:
        name = user.studentProfile.fullName
    elif user.role == "RECRUITER" and user.recruiterProfile:
        name = user.recruiterProfile.fullName

    user_info = {"id": user.id, "email": user.email, "role": user.role, "name": name}

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_info
    )


@router.post("/logout")
async def logout():
    # Stateless JWTs mean we just tell the client to discard tokens
    return {"message": "Successfully logged out"}