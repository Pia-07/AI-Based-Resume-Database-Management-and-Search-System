from fastapi import APIRouter, UploadFile, File
import uuid
import os

from ..utils.db import resume_collection
from ..utils.pdf_reader import extract_text_from_pdf
from ..services.resume_parser import parse_resume_text

router = APIRouter()

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    print("🚀 upload_resume API called")

    resume_id = str(uuid.uuid4())

    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{resume_id}.pdf"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    raw_text = extract_text_from_pdf(file_path)
    parsed = parse_resume_text(raw_text)

    resume_collection.insert_one({
        "resume_id": resume_id,
        "skills": parsed.get("skills", []),
        "raw_text": raw_text
    })

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume_id
    }
