from dotenv import load_dotenv
load_dotenv()

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes.auth_routes import router as auth_router
from .routes.resume_routes import router as resume_router
from .routes.chat_routes import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hook."""
    # ── STARTUP ─────────────────────────────────────────────
    print("🚀 Startup: Pre-loading models and warming caches...")

    # 1. Trigger SentenceTransformer load (singleton import does this)
    from .services.model_manager import model_manager  # noqa: F811
    print(f"✅ SentenceTransformer ready")

    # 2. Pre-warm FAISS index with existing resumes
    try:
        from .utils.db import resume_collection
        from .services.embedding_service import build_vector_store
        from .services.resume_service import get_resume_content_for_context

        resumes = list(resume_collection.find({}, {
            "_id": 0, "raw_text": 1, "name": 1, "email": 1, "phone": 1,
            "skills": 1, "experience_years": 1, "location": 1,
            "education": 1, "experience": 1, "summary": 1, "certifications": 1
        }))
        if resumes:
            contexts = []
            for r in resumes:
                ctx = get_resume_content_for_context(r)
                if ctx and len(ctx.strip()) > 10:
                    contexts.append(ctx)
            if contexts:
                vector_input = [{"raw_text": c} for c in contexts]
                build_vector_store(vector_input)
                print(f"✅ FAISS index pre-warmed with {len(contexts)} resume chunks")
            else:
                print("⚠️ Resumes exist but no readable content for FAISS")
        else:
            print("ℹ️ No resumes in DB yet — FAISS will build on first query")
    except Exception as e:
        print(f"⚠️ FAISS pre-warm failed (non-fatal): {e}")

    print("🟢 Startup complete — ready to serve requests")
    yield
    # ── SHUTDOWN ────────────────────────────────────────────
    print("🔴 Shutting down...")


app = FastAPI(lifespan=lifespan)

# Serve local uploaded files when S3 is not configured
uploads_dir = os.getenv("LOCAL_UPLOADS_DIR", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/files", StaticFiles(directory=uploads_dir), name="files")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Production: set FRONTEND_URL in Render env vars (e.g. https://smarthire.vercel.app)
        *([os.getenv("FRONTEND_URL")] if os.getenv("FRONTEND_URL") else []),
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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

