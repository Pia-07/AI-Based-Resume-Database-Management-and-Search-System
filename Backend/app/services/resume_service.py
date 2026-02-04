import os
from typing import Optional
from ..utils.pdf_reader import extract_text_from_pdf
from .resume_parser import parse_resume_text
from .s3_service import upload_pdf_to_s3
from ..utils.db import resume_collection
from datetime import datetime


def process_resume(pdf_path: str, resume_id: str, user_id: Optional[str] = None):
    """
    Process a resume PDF: extract text, parse it, upload to S3, and store in MongoDB.
    
    Args:
        pdf_path: Path to the PDF file
        resume_id: Unique identifier for this resume
        user_id: Optional user ID for filtering resumes by user
    """
    raw_text = extract_text_from_pdf(pdf_path)
    parsed = parse_resume_text(raw_text)

    s3_key = f"resumes/{resume_id}.pdf"
    s3_url = upload_pdf_to_s3(pdf_path, s3_key)

    resume_doc = {
        "resume_id": resume_id,
        "user_id": user_id,  # Store user ID for filtering
        "name": parsed.get("name"),
        "email": parsed.get("email"),
        "phone": parsed.get("phone"),
        "skills": parsed.get("skills", []),
        "experience_years": parsed.get("experience_years", 0),
        "location": parsed.get("location"),
        "raw_text": raw_text,
        "resume_s3_key": s3_key,
        "resume_url": s3_url,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    resume_collection.insert_one(resume_doc)
    
    print(f"✅ Resume processed: {resume_id} for user: {user_id}")

    # Optional: delete local file after upload
    try:
        os.remove(pdf_path)
    except Exception as e:
        print(f"⚠️ Could not delete temp file: {e}")

    return resume_doc
