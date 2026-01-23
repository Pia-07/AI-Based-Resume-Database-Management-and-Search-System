from fastapi import APIRouter, UploadFile, File
from typing import List
import uuid
import os

from ..services.resume_service import process_resume
from ..services.s3_service import generate_presigned_url
from ..utils.db import resume_collection

router = APIRouter()

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# =========================
# UPLOAD MULTIPLE RESUMES
# =========================
@router.post("/upload_resume")
async def upload_resumes(files: List[UploadFile] = File(...)):
    results = []

    for file in files:
        resume_id = str(uuid.uuid4())
        file_path = f"{TEMP_DIR}/{resume_id}.pdf"

        with open(file_path, "wb") as f:
            f.write(await file.read())

        resume_doc = process_resume(file_path, resume_id)

        results.append({
            "resume_id": resume_id,
            "name": resume_doc.get("name"),
            "skills": resume_doc.get("skills"),
            "experience_years": resume_doc.get("experience_years")
        })

    return {
        "message": f"{len(results)} resumes uploaded successfully",
        "resumes": results
    }


# =========================
# DOWNLOAD RESUME
# =========================
@router.get("/download_resume/{resume_id}")
def download_resume(resume_id: str):
    resume = resume_collection.find_one({"resume_id": resume_id})
    if not resume:
        return {"error": "Resume not found"}

    signed_url = generate_presigned_url(resume["resume_s3_key"])
    return {"download_url": signed_url}
