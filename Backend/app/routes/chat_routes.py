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
    intent = detect_intent(query)

    print("🧠 Intent:", intent)

    # 1️⃣ Greeting
    if intent == "greeting":
        return {
            "reply": "Hi! I can search resumes and generate analytics 📊"
        }

    # 2️⃣ Count resumes
    if intent == "count_resumes":
        count = resume_collection.count_documents({})
        return {
            "reply": f"There are {count} resumes in the database."
        }

    # 3️⃣ List candidates
    if intent == "list_candidates":
        names = resume_collection.distinct("name")
        return {
            "reply": "Candidates:\n" + "\n".join(names)
        }

    # 4️⃣ 📊 Skill chart
    if intent == "analytics_skill":
        return {
            "reply": "Here is the skill distribution across all candidates:",
            "chart": skill_distribution()
        }

    # 5️⃣ 📊 Experience chart
    if intent == "analytics_experience":
        return {
            "reply": "Here is the experience distribution:",
            "chart": experience_distribution()
        }

    # 6️⃣ 📈 Upload trend
    if intent == "analytics_trend":
        return {
            "reply": "Here is the resume upload trend over time:",
            "chart": upload_trend()
        }

    # 7️⃣ Semantic resume Q&A (ONLY here we call LLM)
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
    build_vector_store(resumes)

    results = search_similar(query, k=20)
    if not results:
        return {
            "reply": "I couldn't find relevant resumes for that query."
        }

    answer = generate_answer("\n\n".join(results), query)
    return {
        "reply": answer
    }
