from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.errors import DomainError
from app.core.security import decode_token
from app.core.audit import audit_ctx, AuditContext

bearer = HTTPBearer(auto_error=False)

def current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    from app.modules.auth.models import User
    if not creds:
        raise DomainError("UNAUTHORIZED", "Token tidak ditemukan", 401)
    try:
        p = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise DomainError("UNAUTHORIZED", "Token tidak valid/kedaluwarsa", 401)
    if p.get("kind") != "access":
        raise DomainError("UNAUTHORIZED", "Jenis token salah", 401)
    user = db.get(User, int(p["sub"]))
    if not user or not user.is_active:
        raise DomainError("UNAUTHORIZED", "Akun nonaktif", 401)
    audit_ctx.set(AuditContext(user_id=user.id, ip=request.client.host if request.client else None))
    return user

def require(*perms: str):
    """Contoh: Depends(require('harvest:receive'))"""
    def dep(user = Depends(current_user)):
        granted = {p.code for p in user.role.permissions}
        if "*" not in granted and not set(perms) <= granted:
            raise DomainError(
                "FORBIDDEN",
                "Peran Anda tidak berhak melakukan aksi ini",
                403,
                {"required": list(perms)},
            )
        return user
    return dep

