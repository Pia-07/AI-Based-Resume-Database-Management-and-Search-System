import json
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np


class ResumeStore:
    """
    Simple on-disk store for resume metadata + embeddings.
    Embeddings are stored normalized to enable fast cosine similarity.
    """

    def __init__(self, path: str = "data/resumes.json") -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.resumes: List[Dict] = []
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            with open(self.path, "r", encoding="utf-8") as f:
                self.resumes = json.load(f)
        else:
            self.resumes = []

    def _persist(self) -> None:
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.resumes, f, indent=2)

    def add_resume(self, resume: Dict) -> None:
        embedding = np.array(resume["embedding"], dtype=np.float32)
        norm = np.linalg.norm(embedding) + 1e-12
        resume["embedding"] = (embedding / norm).tolist()
        self.resumes.append(resume)
        self._persist()

    def search(
        self,
        query_embedding: np.ndarray,
        required_skills: Optional[List[str]] = None,
        top_k: int = 5,
        location: Optional[str] = None,
    ) -> List[Dict]:
        required_skills = required_skills or []
        query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-12)

        results = []
        for resume in self.resumes:
            if location and resume.get("location"):
                if location.lower() not in resume["location"].lower():
                    continue

            emb = np.array(resume["embedding"], dtype=np.float32)
            semantic_score = float(np.dot(query_norm, emb))

            resume_skills = set([s.lower() for s in resume.get("skills", [])])
            req_skills = set([s.lower() for s in required_skills])
            matched_skills = list(resume_skills.intersection(req_skills))

            skill_overlap = (
                len(matched_skills) / len(req_skills) if req_skills else 0.0
            )

            final_score = 0.7 * semantic_score + 0.3 * skill_overlap

            results.append(
                {
                    "resume_id": resume["resume_id"],
                    "name": resume.get("name"),
                    "location": resume.get("location"),
                    "skills": resume.get("skills", []),
                    "experience_years": resume.get("experience_years"),
                    "email": resume.get("email"),
                    "phone": resume.get("phone"),
                    "score": round(final_score, 4),
                    "semantic_score": round(semantic_score, 4),
                    "skill_overlap": round(skill_overlap, 4),
                    "matched_skills": matched_skills,
                    "summary": resume.get("raw_text", "")[:500],
                }
            )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

