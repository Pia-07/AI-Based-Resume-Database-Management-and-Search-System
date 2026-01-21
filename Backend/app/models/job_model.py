from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobModel(BaseModel):
    job_id: str
    job_title: Optional[str] = None

    required_skills: List[str]
    min_experience: int = 0

    location: Optional[str] = None

    raw_jd_text: str

    created_at: datetime = datetime.utcnow()
