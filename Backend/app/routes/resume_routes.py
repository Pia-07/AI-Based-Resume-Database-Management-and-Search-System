from fastapi import APIRouter, UploadFile, File
import uuid

router = APIRouter()

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    resume_id = str(uuid.uuid4())

    # Save file temporarily
    file_path = f"temp/{resume_id}.pdf"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume_id,
        "file_path": file_path
    }
