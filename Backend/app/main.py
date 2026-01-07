from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.resume_routes import router as resume_router

app = FastAPI(title="SmartHire Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "SmartHire backend running"}


app.include_router(resume_router, prefix="/api")
