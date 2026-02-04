from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
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
async def upload_resumes(
    files: List[UploadFile] = File(...),
    user_id: Optional[str] = Form(None)
):
    """
    Upload one or more resume PDFs. Optionally associate with a user_id.
    """
    results = []
    
    print(f"📤 Uploading {len(files)} resume(s) for user: {user_id}")

    for file in files:
        resume_id = str(uuid.uuid4())
        file_path = f"{TEMP_DIR}/{resume_id}.pdf"

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Process resume with user_id for filtering
        resume_doc = process_resume(file_path, resume_id, user_id)

        results.append({
            "resume_id": resume_id,
            "name": resume_doc.get("name"),
            "skills": resume_doc.get("skills"),
            "experience_years": resume_doc.get("experience_years")
        })

    return {
        "message": f"{len(results)} resume(s) uploaded successfully",
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


# =========================
# LIST USER RESUMES
# =========================
@router.get("/resumes/{user_id}")
def get_user_resumes(user_id: str):
    """Get all resumes uploaded by a specific user"""
    print(f"🔍 Fetching resumes for user: {user_id}")
    
    # Query for specific user OR resumes with no user assigned (legacy data)
    filter_query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}, {"user_id": None}]}
    
    resumes = list(resume_collection.find(
        filter_query,
        {"_id": 0, "raw_text": 0}  # Exclude raw text for performance
    ))
    
    print(f"📊 Found {len(resumes)} resumes for user context {user_id}")
    return {"resumes": resumes, "count": len(resumes)}


# =========================
# GET RESUME COUNT
# =========================
@router.get("/resumes/count")
def get_resume_count(user_id: Optional[str] = None):
    """Get total resume count, optionally filtered by user"""
    if user_id:
        filter_query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}, {"user_id": None}]}
    else:
        filter_query = {}
        
    count = resume_collection.count_documents(filter_query)
    
    # Add a global total count for debugging
    total_in_db = resume_collection.count_documents({})
    
    print(f"🔢 Resume Count API: user_id={user_id}, filtered_count={count}, total_in_db={total_in_db}")
    
    return {
        "count": count,
        "total_available": total_in_db,
        "user_id": user_id
    }
