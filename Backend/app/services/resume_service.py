"""
Resume Processing Service
Handles PDF processing, text extraction, parsing, and storing in MongoDB.
No AWS/S3 dependencies - uses local file storage only.
"""
import os
from typing import Optional
from datetime import datetime

from ..utils.pdf_reader import extract_text_from_pdf
from .resume_parser import parse_resume_text
from .file_service import save_pdf_locally
from ..utils.db import resume_collection


def process_resume(pdf_path: str, resume_id: str, user_id: Optional[str] = None):
    """
    Process a resume PDF: extract text, parse it, save locally, and store in MongoDB.
    
    Args:
        pdf_path: Path to the PDF file
        resume_id: Unique identifier for this resume
        user_id: Optional user ID for filtering resumes by user
    
    Returns:
        The resume document that was inserted into MongoDB
    """
    # Extract text from PDF
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Parse the extracted text
    parsed = parse_resume_text(raw_text)

    # Save PDF to local storage
    file_key = f"resumes/{resume_id}.pdf"
    file_url = save_pdf_locally(pdf_path, file_key)

    # Build the resume document
    resume_doc = {
        "resume_id": resume_id,
        "user_id": user_id,
        "name": parsed.get("name"),
        "email": parsed.get("email"),
        "phone": parsed.get("phone"),
        "skills": parsed.get("skills", []),
        "experience_years": parsed.get("experience_years", 0),
        "is_fresher": parsed.get("is_fresher", True),
        "location": parsed.get("location"),
        "raw_text": raw_text,  # Full extracted text for semantic search
        "file_key": file_key,
        "file_url": file_url,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    # Insert into MongoDB
    resume_collection.insert_one(resume_doc)
    
    print(f"✅ Resume processed: {resume_id} for user: {user_id}")
    print(f"   - Name: {parsed.get('name')}")
    print(f"   - Skills: {parsed.get('skills', [])[:5]}...")
    print(f"   - Raw text length: {len(raw_text)} characters")

    # Delete temp file after processing
    try:
        os.remove(pdf_path)
    except Exception as e:
        print(f"⚠️ Could not delete temp file: {e}")

    return resume_doc


def get_resume_content_for_context(resume_doc: dict) -> str:
    """
    Build a comprehensive text representation of a resume for LLM context.
    Uses raw_text if available, otherwise builds from structured fields.
    
    Args:
        resume_doc: Resume document from MongoDB
    
    Returns:
        String representation of the resume content
    """
    # Build structured context from parsed fields first (better grounding for semantic queries)
    parts = []

    if resume_doc.get("name"):
        parts.append(f"Candidate Name: {resume_doc['name']}")

    # Add field summary for better skill-based matching
    skills = resume_doc.get("skills", [])
    if skills:
        parts.append("Skills: " + ", ".join(str(s).strip() for s in skills if s))

    location = resume_doc.get("location")
    if location:
        parts.append(f"Location: {location}")

    exp_years = resume_doc.get("experience_years", 0)
    if exp_years > 0:
        parts.append(f"Experience Years: {exp_years}")
    elif resume_doc.get("is_fresher"):
        parts.append("Experience: Fresher / Entry-level")

    if resume_doc.get("summary"):
        parts.append(f"Summary: {resume_doc['summary']}")

    if resume_doc.get("certifications"):
        certs = resume_doc.get("certifications")
        if isinstance(certs, list):
            parts.append("Certifications: " + ", ".join(str(c) for c in certs))
        else:
            parts.append(f"Certifications: {certs}")

    # If raw_text exists, append it as a fallback (complete resume details)
    raw_text = resume_doc.get("raw_text", "")
    if raw_text and len(raw_text.strip()) > 50:
        parts.append("Resume Text:")
        parts.append(raw_text.strip())

    if parts:
        return "\n".join(parts)

    return "No resume data available"    
    if resume_doc.get("name"):
        parts.append(f"Candidate Name: {resume_doc['name']}")
    
    if resume_doc.get("email"):
        parts.append(f"Email: {resume_doc['email']}")
    
    if resume_doc.get("phone"):
        parts.append(f"Phone: {resume_doc['phone']}")
    
    if resume_doc.get("location"):
        parts.append(f"Location: {resume_doc['location']}")
    
    exp_years = resume_doc.get("experience_years", 0)
    if exp_years > 0:
        parts.append(f"Experience: {exp_years} years")
    elif resume_doc.get("is_fresher"):
        parts.append("Experience: Fresher / Entry-level")
    
    skills = resume_doc.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    
    # Add education if available
    education = resume_doc.get("education", [])
    if education:
        if isinstance(education, list):
            parts.append(f"Education: {', '.join(str(e) for e in education)}")
        else:
            parts.append(f"Education: {education}")
    
    # Add experience details if available
    experience = resume_doc.get("experience", [])
    if experience:
        if isinstance(experience, list):
            parts.append(f"Work Experience: {', '.join(str(e) for e in experience)}")
        else:
            parts.append(f"Work Experience: {experience}")
    
    # Add any other relevant fields
    if resume_doc.get("summary"):
        parts.append(f"Summary: {resume_doc['summary']}")
    
    if resume_doc.get("certifications"):
        certs = resume_doc.get("certifications")
        if isinstance(certs, list):
            parts.append(f"Certifications: {', '.join(str(c) for c in certs)}")
        else:
            parts.append(f"Certifications: {certs}")
    
    return "\n".join(parts) if parts else "No resume data available"
