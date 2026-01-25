"""
ElderCare Connect - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routes import health, users, notes


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    app = FastAPI(
        title="ElderCare Connect API",
        description="API for ElderCare Connect - helping elderly with memory care",
        version="0.1.0",
    )

    # Create tables on startup (fine for class projects; later use migrations)
    Base.metadata.create_all(bind=engine)

    # CORS: allow frontend to call backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5500",      # VSCode Live Server default
            "http://127.0.0.1:5500",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:3000",      # Common React dev port
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(notes.router)

    return app


app = create_app()