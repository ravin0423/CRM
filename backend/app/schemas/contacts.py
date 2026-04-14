from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    phone: str | None = None
    company: str | None = None
    lifecycle_stage: str | None = Field(default=None, max_length=32)


class ContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    company: str | None = None
    lifecycle_stage: str | None = None


class ContactOut(BaseModel):
    id: int
    email: str
    name: str | None
    phone: str | None
    company: str | None
    lifecycle_stage: str | None
    created_at: datetime


class DealCreate(BaseModel):
    contact_id: int
    name: str
    amount: float | None = None
    stage: str = "prospecting"
    probability: int | None = None


class DealUpdate(BaseModel):
    name: str | None = None
    amount: float | None = None
    stage: str | None = None
    probability: int | None = None
    contact_id: int | None = None


class DealOut(BaseModel):
    id: int
    contact_id: int
    name: str
    amount: float | None
    stage: str
    probability: int | None
    created_at: datetime
