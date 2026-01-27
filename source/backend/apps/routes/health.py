"""
ElderCare Connect - Health Check Route
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    """Health check endpoint"""
    return {"ok": True, "service": "eldercare-api"}