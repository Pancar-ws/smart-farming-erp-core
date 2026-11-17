# modules/auth/router.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require, current_user
from . import service
from .models import User
from .schemas import LoginIn, LoginOut, TokenRefreshIn, TokenOut, UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])
users_router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/login", response_model=LoginOut)
def login(request: Request, body: LoginIn, db: Session = Depends(get_db)):
    return service.login(db, body.username, body.password)

@router.post("/refresh", response_model=TokenOut)
def refresh(body: TokenRefreshIn, db: Session = Depends(get_db)):
    return service.refresh(db, body.refresh_token)

@router.get("/me")
def me(user: User = Depends(current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.code,
        "member_id": user.member_id,
        "permissions": sorted(p.code for p in user.role.permissions),
    }

@users_router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(require("admin:user"))):
    return db.scalars(select(User).order_by(User.id)).all()

@users_router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), user: User = Depends(require("admin:user"))):
    return service.create_user(db, body)

@users_router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), user: User = Depends(require("admin:user"))):
    return service.update_user(db, user_id, body)

