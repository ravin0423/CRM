from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    status: str
    must_change_password: bool


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=6, max_length=200)
    role: Literal["admin", "agent", "viewer"] = "agent"


class UserUpdate(BaseModel):
    name: str | None = None
    role: Literal["admin", "agent", "viewer"] | None = None
    status: Literal["active", "inactive"] | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=200)
