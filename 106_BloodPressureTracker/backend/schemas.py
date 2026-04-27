from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class RecordBase(BaseModel):
    measured_at: datetime
    systolic: int
    diastolic: int
    pulse: Optional[int] = None
    memo: Optional[str] = None

    @field_validator("systolic")
    @classmethod
    def systolic_range(cls, v):
        if not (30 <= v <= 300):
            raise ValueError("収縮期血圧は30〜300の範囲で入力してください")
        return v

    @field_validator("diastolic")
    @classmethod
    def diastolic_range(cls, v):
        if not (20 <= v <= 200):
            raise ValueError("拡張期血圧は20〜200の範囲で入力してください")
        return v

    @field_validator("pulse")
    @classmethod
    def pulse_range(cls, v):
        if v is not None and not (20 <= v <= 300):
            raise ValueError("脈拍は20〜300の範囲で入力してください")
        return v


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass


class Record(RecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MonthlySummary(BaseModel):
    month: str
    avg_systolic: float
    avg_diastolic: float
    avg_pulse: Optional[float]
    count: int


# ── Auth schemas ──────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("パスワードは6文字以上にしてください")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
