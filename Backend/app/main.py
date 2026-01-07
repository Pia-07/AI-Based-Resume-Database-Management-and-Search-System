from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.resume_routes import router as resume_router

app = FastAPI()   # ✅ ONLY PLACE THIS EXISTS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router)

@app.get("/")
def root():
    return {"status": "API running"}
