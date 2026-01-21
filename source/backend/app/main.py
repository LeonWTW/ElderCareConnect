from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routes import health, users, notes

def create_app() -> FastAPI:
    app = FastAPI(title="ElderCare Connect API")

    # Create tables on startup (fine for class projects; later use migrations)
    Base.metadata.create_all(bind=engine)

    # CORS: allow your frontend to call backend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5500",  # VSCode Live Server default
            "http://127.0.0.1:5500",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(notes.router)

    return app

app = create_app()
