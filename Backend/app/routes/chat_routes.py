from fastapi import APIRouter
from pydantic import BaseModel

from ..services.intent_service import detect_intent
from ..services.analytics_service import (
    skill_distribution,
    experience_distribution,
    upload_trend,
)
from ..services.embedding_service import build_vector_store, search_similar
from ..services.llm_service import generate_answer
from ..utils.db import resume_collection

router = APIRouter()

class ChatRequest(BaseModel):
    query: str


@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query.strip()
    intent = detect_intent(query)

    print("🧠 Intent:", intent)

    if intent == "greeting":
        return {"reply": "Hi! I can search resumes and generate analytics 📊"}

    if intent == "count_resumes":
        return {"reply": f"There are {resume_collection.count_documents({})} resumes."}

    if intent == "list_candidates":
        names = resume_collection.distinct("name")
        return {"reply": "Candidates:\n" + "\n".join(names)}

    if intent == "analytics_skill":
        return {"chart": skill_distribution()}

    if intent == "analytics_experience":
        return {"chart": experience_distribution()}

    if intent == "analytics_trend":
        return {"chart": upload_trend()}

    # Semantic search
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
    build_vector_store(resumes)

    results = search_similar(query, k=20)
    answer = generate_answer("\n\n".join(results), query)

    return {"reply": answer}
