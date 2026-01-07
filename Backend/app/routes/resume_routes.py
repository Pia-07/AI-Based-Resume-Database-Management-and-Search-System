<<<<<<< HEAD
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from services.embedding_service import embed_texts
from services.index_store import ResumeStore
from services.resume_parser import parse_resume_text
from utils.pdf_reader import extract_text_from_pdf

router = APIRouter()

store = ResumeStore()


class SearchRequest(BaseModel):
    job_description: str = Field(..., description="Full job description text")
    required_skills: List[str] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=20)
    location: Optional[str] = None


@router.get("/health")
def health():
    return {"status": "ok", "resumes_indexed": len(store.resumes)}


@router.post("/resumes")
async def upload_resume(
    file: UploadFile = File(...),
    name: Optional[str] = None,
    location: Optional[str] = None,
):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    resume_id = str(uuid.uuid4())
    temp_dir = Path("temp")
    temp_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = temp_dir / f"{resume_id}.pdf"

    pdf_bytes = await file.read()
    pdf_path.write_bytes(pdf_bytes)

    text = extract_text_from_pdf(str(pdf_path))
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    parsed = parse_resume_text(text)
    parsed["resume_id"] = resume_id
    if name:
        parsed["name"] = name
    if location:
        parsed["location"] = location

    embedding = embed_texts([parsed["raw_text"]])[0]
    store.add_resume({**parsed, "embedding": embedding.tolist()})

    return {
        "message": "Resume uploaded successfully",
        "resume_id": resume_id,
        "parsed": {
            "name": parsed["name"],
            "skills": parsed["skills"],
            "experience_years": parsed["experience_years"],
            "location": parsed.get("location"),
        },
=======
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
