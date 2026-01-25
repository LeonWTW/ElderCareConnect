"""
ElderCare Connect - Database Models (Stage 1)
SQLAlchemy 2.0 style with mapped_column
"""
from sqlalchemy import (
    String, Integer, ForeignKey, DateTime, Text, Time, Boolean, 
    UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, time
from typing import Optional
from .db import Base


class User(Base):
    """
    User model supporting both caregivers and elders.
    - Caregivers: have email + password, can login
    - Elders (Stage 2+): may be created by caregivers without email/password
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String(20), index=True)  # "elder" or "caregiver"
    email: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    notes: Mapped[list["Note"]] = relationship("Note", back_populates="owner")
    
    # Tasks assigned to this user (if elder)
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="elder")
    
    # Check-ins made by this user (if elder)
    checkins: Mapped[list["CheckIn"]] = relationship("CheckIn", back_populates="elder")


class Note(Base):
    """Existing notes model - kept for backwards compatibility"""
    __tablename__ = "notes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship("User", back_populates="notes")


# ============================================================================
# PLACEHOLDER TABLES FOR STAGE 2/3 (models only, no endpoints yet)
# ============================================================================

class CareLink(Base):
    """
    Many-to-many relationship between caregivers and elders.
    A caregiver can manage multiple elders.
    An elder can have multiple caregivers.
    """
    __tablename__ = "care_links"
    __table_args__ = (
        UniqueConstraint("caregiver_id", "elder_id", name="uq_caregiver_elder"),
        Index("ix_care_links_caregiver_id", "caregiver_id"),
        Index("ix_care_links_elder_id", "elder_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    caregiver_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    elder_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="accepted", nullable=False
    )  # "pending", "accepted", "rejected"


class Task(Base):
    """
    Tasks assigned to elders (e.g., take medication, exercise).
    Created by caregivers for their linked elders.
    """
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    elder_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    scheduled_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    elder: Mapped[User] = relationship("User", back_populates="tasks")
    completions: Mapped[list["TaskCompletion"]] = relationship(
        "TaskCompletion", back_populates="task"
    )


class TaskCompletion(Base):
    """
    Records when a task was completed.
    Enforces one completion per task per day via unique constraint.
    """
    __tablename__ = "task_completions"
    __table_args__ = (
        UniqueConstraint("task_id", "completed_on", name="uq_task_completion_per_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id"), index=True, nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    completed_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )  # DATE portion for unique constraint
    completed_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )

    # Relationships
    task: Mapped[Task] = relationship("Task", back_populates="completions")


class CheckIn(Base):
    """
    Daily check-in by elder.
    Enforces one check-in per elder per day.
    """
    __tablename__ = "checkins"
    __table_args__ = (
        UniqueConstraint("elder_id", "checkin_on", name="uq_elder_checkin_per_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    elder_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    checkin_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )  # DATE portion for unique constraint

    # Relationships
    elder: Mapped[User] = relationship("User", back_populates="checkins")