from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ResumeModel(BaseModel):
    resume_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    skills: List[str]
    education: Optional[str] = None

    graduation_year: Optional[int] = None
    experience_years: int = 0
    is_fresher: bool

    location: Optional[str] = None

    raw_text: str

    created_at: datetime = datetime.utcnow()
