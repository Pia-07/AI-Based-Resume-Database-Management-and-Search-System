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
    }


@router.post("/search")
def search_candidates(payload: SearchRequest):
    if not store.resumes:
        raise HTTPException(status_code=404, detail="No resumes indexed yet")

    query_embedding = embed_texts([payload.job_description])[0]
    results = store.search(
        query_embedding=query_embedding,
        required_skills=payload.required_skills,
        top_k=payload.top_k,
        location=payload.location,
    )

    return {"count": len(results), "candidates": results}
