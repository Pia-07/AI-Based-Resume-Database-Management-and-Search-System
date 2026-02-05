from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes.auth_routes import router as auth_router
from .routes.resume_routes import router as resume_router
from .routes.chat_routes import router as chat_router

app = FastAPI()

# Serve local uploaded files (no AWS/S3 - using local storage only)
uploads_dir = os.getenv("LOCAL_UPLOADS_DIR", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/files", StaticFiles(directory=uploads_dir), name="files")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(chat_router)
app.include_router(resume_router)

@app.get("/")
def root():
    return {"status": "API running"}
