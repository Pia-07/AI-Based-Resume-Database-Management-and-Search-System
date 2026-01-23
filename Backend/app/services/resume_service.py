import os
from ..utils.pdf_reader import extract_text_from_pdf
from .resume_parser import parse_resume_text
from .s3_service import upload_pdf_to_s3
from ..utils.db import resume_collection

def process_resume(pdf_path: str, resume_id: str):
    raw_text = extract_text_from_pdf(pdf_path)
    parsed = parse_resume_text(raw_text)

    s3_key = f"resumes/{resume_id}.pdf"
    s3_url = upload_pdf_to_s3(pdf_path, s3_key)

    resume_doc = {
        "resume_id": resume_id,
        "name": parsed.get("name"),
        "email": parsed.get("email"),
        "phone": parsed.get("phone"),
        "skills": parsed.get("skills", []),
        "experience_years": parsed.get("experience_years", 0),
        "location": parsed.get("location"),
        "raw_text": raw_text,
        "resume_s3_key": s3_key,
        "resume_url": s3_url
    }

    resume_collection.insert_one(resume_doc)

    # Optional: delete local file after upload
    os.remove(pdf_path)

    return resume_doc
