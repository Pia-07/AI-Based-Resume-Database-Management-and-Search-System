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
    query = request.query.strip().lower()

    # 1️⃣ Detect intent
    intent = detect_intent(query)

    # 2️⃣ Greeting
    if intent == "greeting":
        return {"reply": "Hi! I can help you analyze resumes and show insights."}

    # 3️⃣ Resume count
    if intent == "count_resumes":
        count = resume_collection.count_documents({})
        return {"reply": f"There are {count} resumes in the database."}

    # 4️⃣ Candidate names
    if intent == "list_candidates":
        names = resume_collection.distinct("name")
        return {"reply": "Candidates:\n" + "\n".join(names)}

    # 5️⃣ 📊 Skill chart
    if intent == "analytics_skill":
        chart = skill_distribution()
        return {
            "reply": "Here is the skill distribution across all resumes.",
            "chart": chart,
        }

    # 6️⃣ 📊 Experience chart
    if intent == "analytics_experience":
        chart = experience_distribution()
        return {
            "reply": "Here is the experience distribution.",
            "chart": chart,
        }

    # 7️⃣ 📈 Upload trend
    if intent == "analytics_trend":
        chart = upload_trend()
        return {
            "reply": "Here is the resume upload trend over time.",
            "chart": chart,
        }

    # 8️⃣ 🔍 Semantic search (FAISS)
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
    build_vector_store(resumes)

    relevant = search_similar(query, k=20)
    if not relevant:
        return {"reply": "No relevant resumes found."}

    answer = generate_answer("\n\n".join(relevant), query)
    return {"reply": answer}
