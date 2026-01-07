from fastapi import APIRouter, UploadFile, File
import uuid
import os

from Backend.app.utils.db import resume_collection
from Backend.app.utils.pdf_reader import extract_text_from_pdf
from Backend.app.services.resume_parser import parse_resume_text

router = APIRouter()

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    print("🚀 upload_resume API called")

    resume_id = str(uuid.uuid4())

    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{resume_id}.pdf"

    # 1️⃣ Save PDF
    with open(file_path, "wb") as f:
        f.write(await file.read())
    print("📄 PDF saved")

    # 2️⃣ Extract text
    raw_text = extract_text_from_pdf(file_path)
    print("📝 Text extracted")

    # 3️⃣ Parse resume
    parsed = parse_resume_text(raw_text)
    print("🧠 Resume parsed")

    # 4️⃣ Insert into MongoDB
    resume_doc = {
        "resume_id": resume_id,
        "personal_info": {
            "name": parsed.get("name", "Unknown")
        },
        "skills": parsed.get("skills", []),
        "experience": {
            "experience_years": parsed.get("experience_years", 0),
            "is_fresher": parsed.get("is_fresher", True)
        },
        "raw_text": raw_text
    }

    resume_collection.insert_one(resume_doc)
    print("✅ Inserted into MongoDB")

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume_id
    }
