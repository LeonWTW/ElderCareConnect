from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My Site API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/hello")
def hello(name: str = "world"):
    return {"message": f"Hello, {name}!"}