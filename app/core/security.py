from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings

_ph = PasswordHasher()                      # Argon2id (SRS-NFR-002)

def hash_password(p: str) -> str:
    return _ph.hash(p)

def verify_password(hashed: str, p: str) -> bool:
    try:
        return _ph.verify(hashed, p)
    except (VerifyMismatchError, Exception):
        return False

def create_token(user_id: int, role: str, kind: str) -> str:
    minutes = settings.access_token_minutes if kind == "access" else settings.refresh_token_hours * 60
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "kind": kind,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])

