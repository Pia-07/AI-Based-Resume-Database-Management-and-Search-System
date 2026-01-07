<<<<<<< HEAD
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
=======
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
>>>>>>> bd3bed210af2ea99ac8470389e356018c97d1c83


# CORS (required for React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
<<<<<<< HEAD
    return {"message": "SmartHire backend running"}


app.include_router(resume_router, prefix="/api")
=======
    return {"status": "Backend running"}

@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "Resume uploaded successfully"
    }
>>>>>>> bd3bed210af2ea99ac8470389e356018c97d1c83
