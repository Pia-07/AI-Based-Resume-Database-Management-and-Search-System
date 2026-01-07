from fastapi import APIRouter, UploadFile, File

router = APIRouter()

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    return {
        "message": "Resume uploaded successfully",
        "resume_id": "uuid"
    }
