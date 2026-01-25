"""
ElderCare Connect - Pydantic Schemas (Stage 1)
Email-based authentication
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Literal, Optional


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class RegisterRequest(BaseModel):
    """Request body for user registration (caregiver only in Stage 1)"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None
    role: Literal["elder", "caregiver"] = "caregiver"


class LoginRequest(BaseModel):
    """Request body for user login"""
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    """Public user info returned in API responses"""
    id: int
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response for successful login"""
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ============================================================================
# NOTE SCHEMAS (existing, kept for backwards compatibility)
# ============================================================================

class NoteCreate(BaseModel):
    """Request body for creating a note"""
    title: str
    body: str


class NotePublic(BaseModel):
    """Public note info returned in API responses"""
    id: int
    title: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# PLACEHOLDER SCHEMAS FOR STAGE 2/3
# ============================================================================

class ElderCreate(BaseModel):
    """Request body for creating an elder profile (Stage 2)"""
    display_name: str = Field(..., min_length=1)


class ElderPublic(BaseModel):
    """Public elder info (Stage 2)"""
    id: int
    display_name: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    """Request body for creating a task (Stage 2)"""
    title: str = Field(..., min_length=1)
    scheduled_time: Optional[str] = None  # HH:MM format


class TaskPublic(BaseModel):
    """Public task info (Stage 2)"""
    id: int
    title: str
    scheduled_time: Optional[str] = None
    is_active: bool
    created_at: datetime
    completed_today: bool = False

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    """Caregiver dashboard data for an elder (Stage 3)"""
    elder_id: int
    elder_name: Optional[str] = None
    total_tasks_today: int
    completed_tasks_today: int
    completion_rate: float
    last_checkin_at: Optional[datetime] = None