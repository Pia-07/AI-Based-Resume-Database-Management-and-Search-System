from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.resume_routes import router as resume_router
from .routes.auth_routes import router as auth_router
<<<<<<< HEAD
from .routes.chat_routes import router as chat_router
=======
from .routes.chat_routes import router as chat_router   # ✅ ADD THIS
>>>>>>> 44832f46c10062ee200b2327854daa38c55d70f7

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register all routers
app.include_router(auth_router, prefix="/auth")
app.include_router(chat_router)
app.include_router(resume_router)
app.include_router(chat_router)   # ✅ ADD THIS

@app.get("/")
def root():
    return {"status": "API running"}
