"""
ElderCare Connect - Auth Routes (Stage 1)
Email-based registration and login
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserPublic)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    Stage 1: Only caregivers can register via this endpoint.
    Elders will be created by caregivers in Stage 2.
    """
    # Check if email already exists
    existing = db.query(models.User).filter(
        models.User.email == body.email
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user with email-based auth
    user = models.User(
        email=body.email,
        display_name=body.display_name,
        role=body.role,
        password_hash=hash_password(body.password),
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT access token on success.
    """
    # Find user by email
    user = db.query(models.User).filter(
        models.User.email == body.email
    ).first()
    
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update last_login_at
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Generate JWT token
    token = create_access_token(user.id)
    
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        user=schemas.UserPublic.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserPublic)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
):
    """Get current authenticated user info"""
    return current_user