from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UserBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr
    phone: str | None = None
    department: str | None = None
    role: str
    status: str


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    department: str | None = None
    role: str | None = None
    status: str | None = None


class UserOut(UserBase):
    id: int
    last_active: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordReset(BaseModel):
    new_password: str = Field(min_length=8)
