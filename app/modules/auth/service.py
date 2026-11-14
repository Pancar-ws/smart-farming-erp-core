# modules/auth/service.py
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.errors import DomainError
from app.core.security import verify_password, create_token, decode_token, hash_password
from .models import User, Role
from .schemas import UserCreate, UserUpdate

def login(db: Session, username: str, password: str) -> dict:
    u = db.scalar(select(User).where(User.username == username))
    # pesan generik: jangan bocorkan apakah username ada
    if not u or not u.is_active or not verify_password(u.password_hash, password):
        raise DomainError("INVALID_CREDENTIALS", "Username atau kata sandi salah", 401)
    u.last_login_at = datetime.now(timezone.utc)
    return {
        "access_token": create_token(u.id, u.role.code, "access"),
        "refresh_token": create_token(u.id, u.role.code, "refresh"),
        "token_type": "bearer",
        "user": {
            "id": u.id,
            "name": u.full_name,
            "role": u.role.code,
            "permissions": sorted(p.code for p in u.role.permissions),
        },
    }

def refresh(db: Session, refresh_token: str) -> dict:
    try:
        p = decode_token(refresh_token)
    except Exception:
        raise DomainError("UNAUTHORIZED", "Token tidak valid", 401)
    if p.get("kind") != "refresh":
        raise DomainError("UNAUTHORIZED", "Token salah", 401)
    u = db.get(User, int(p["sub"]))
    if not u or not u.is_active:
        raise DomainError("UNAUTHORIZED", "Pengguna tidak aktif", 401)
    return {"access_token": create_token(u.id, u.role.code, "access"), "token_type": "bearer"}

def create_user(db: Session, data: UserCreate) -> User:
    if db.scalar(select(User.id).where(User.username == data.username)):
        raise DomainError("DUPLICATE", "Username sudah digunakan", 409)
    role = db.get(Role, data.role_id)
    if not role:
        raise DomainError("NOT_FOUND", "Role tidak ditemukan", 404)
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role_id=data.role_id,
        member_id=data.member_id,
    )
    db.add(user)
    db.flush()
    return user

def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    user = db.get(User, user_id)
    if not user:
        raise DomainError("NOT_FOUND", "Pengguna tidak ditemukan", 404)
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.role_id is not None:
        user.role_id = data.role_id
    if data.member_id is not None:
        user.member_id = data.member_id
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.password_hash = hash_password(data.password)
    db.flush()
    return user

