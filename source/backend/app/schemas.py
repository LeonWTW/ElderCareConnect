from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["elder", "caregiver"]
   

class UserPublic(BaseModel):
    id: int
    role: str
    email: EmailStr
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class LoginRequest(BaseModel):
    username: str
    password: str

class NoteCreate(BaseModel):
    title: str
    body: str

class NotePublic(BaseModel):
    id: int
    title: str
    body: str
    created_at: datetime
    class Config:
        from_attributes = True