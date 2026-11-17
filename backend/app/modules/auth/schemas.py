from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class LoginIn(BaseModel):
    username: str
    password: str

class TokenUser(BaseModel):
    id: int
    name: str
    role: str
    permissions: list[str]

class LoginOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: TokenUser

class TokenRefreshIn(BaseModel):
    refresh_token: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    full_name: str
    role_id: int
    member_id: int | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    role_id: int | None = None
    member_id: int | None = None
    is_active: bool | None = None
    password: str | None = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role_id: int
    member_id: int | None
    is_active: bool
    last_login_at: datetime | None = None

class SettingOut(BaseModel):
    key: str
    value: Any
    description: str | None = None

