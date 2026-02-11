"""
Resume Routes
API endpoints for resume upload, download, and management.
No AWS/S3 dependencies - uses local file storage only.
"""
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
import os

from ..services.resume_service import process_resume
from ..services.file_service import get_file_path, file_exists
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

        # Read file content safely
        try:
            await file.seek(0)
            content = await file.read()
            
            if len(content) == 0:
                print(f"⚠️ Warning: Empty file received {file.filename}")
                continue
                
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            print(f"❌ Error saving file {file.filename}: {e}")
            continue

        # Process resume with user_id for filtering
        try:
            resume_doc = process_resume(file_path, resume_id, user_id)
        except Exception as e:
            print(f"❌ Error processing resume {resume_id}: {e}")
            continue

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
    """Download a resume PDF by its ID"""
    resume = resume_collection.find_one({"resume_id": resume_id})
    if not resume:
        return {"error": "Resume not found"}

    # Get file key from resume document
    file_key = resume.get("file_key") or resume.get("resume_s3_key")
    
    if not file_key:
        return {"error": "No file associated with this resume"}
    
    file_path = get_file_path(file_key)
    
    if file_path and os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=f"{resume_id}.pdf",
            media_type="application/pdf"
        )
    else:
        # If file doesn't exist locally, return the stored URL (for legacy data)
        file_url = resume.get("file_url") or resume.get("resume_url")
        return {"download_url": file_url if file_url else "File not found"}


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
# GET ALL RESUMES (admin/debug)
# =========================
@router.get("/resumes")
def get_all_resumes():
    """Get all resumes in the system (for debugging)"""
    resumes = list(resume_collection.find(
        {},
        {"_id": 0, "raw_text": 0}
    ))
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


# =========================
# DELETE RESUME
# =========================
@router.delete("/resume/{resume_id}")
def delete_resume(resume_id: str, user_id: Optional[str] = None):
    """Delete a resume by ID"""
    filter_query = {"resume_id": resume_id}
    if user_id:
        filter_query["user_id"] = user_id
    
    result = resume_collection.delete_one(filter_query)
    
    if result.deleted_count > 0:
        print(f"🗑️ Deleted resume: {resume_id}")
        return {"success": True, "deleted": True}
    else:
        return {"success": False, "deleted": False, "message": "Resume not found"}
