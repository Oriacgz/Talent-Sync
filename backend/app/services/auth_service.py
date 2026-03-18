# WHO WRITES THIS: Backend developer
# WHAT THIS DOES: Password hashing with bcrypt. JWT creation and decoding.
#                 create_access_token() — 15min expiry.
#                 create_refresh_token() — 7day expiry.
# DEPENDS ON: passlib, python-jose, config.py

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    pass  # TODO: return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    pass  # TODO: return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int) -> str:
    pass  # TODO: encode JWT with 15min expiry

def create_refresh_token(user_id: int) -> str:
    pass  # TODO: encode JWT with 7day expiry

def decode_token(token: str) -> dict:
    pass  # TODO: decode and return payload