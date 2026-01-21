import re
from typing import Dict, List, Optional


def _extract_email(text: str) -> Optional[str]:
    match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return match.group(0) if match else None


def _extract_phone(text: str) -> Optional[str]:
    match = re.search(r"(\+?\d[\d\s\-]{8,}\d)", text)
    return match.group(0) if match else None


def _extract_experience_years(text: str) -> int:
    match = re.search(r"(\d+)\s*(\+)?\s*(year|yr)", text, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0


def _extract_location(text: str) -> Optional[str]:
    # very light heuristic: look for patterns like "Location: City"
    for line in text.splitlines():
        if "location" in line.lower():
            parts = line.split(":")
            if len(parts) > 1:
                return parts[1].strip()
    return None


def _extract_name(text: str) -> str:
    for line in text.splitlines():
        cleaned = line.strip()
        if cleaned:
            return cleaned[:80]
    return "Unknown Candidate"


def _extract_skills(text: str) -> List[str]:
    skills_db = [
        "python",
        "java",
        "javascript",
        "typescript",
        "c++",
        "c#",
        "machine learning",
        "deep learning",
        "nlp",
        "fastapi",
        "django",
        "react",
        "node",
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "sql",
        "postgres",
        "mongodb",
    ]
    text_lower = text.lower()
    return [skill for skill in skills_db if skill in text_lower]


def parse_resume_text(text: str) -> Dict:
    skills = _extract_skills(text)
    experience_years = _extract_experience_years(text)
    name = _extract_name(text)
    location = _extract_location(text)
    email = _extract_email(text)
    phone = _extract_phone(text)

    parsed_data = {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience_years": experience_years,
        "is_fresher": experience_years <= 1,
        "location": location,
        "raw_text": text,
    }

    return parsed_data
