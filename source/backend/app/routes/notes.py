"""
ElderCare Connect - Notes Routes
Kept for backwards compatibility
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[schemas.NotePublic])
def list_notes(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """List all notes for the current user"""
    return (
        db.query(models.Note)
        .filter(models.Note.owner_id == user.id)
        .order_by(models.Note.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.NotePublic)
def create_note(
    body: schemas.NoteCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Create a new note for the current user"""
    note = models.Note(
        owner_id=user.id,
        title=body.title,
        body=body.body
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note