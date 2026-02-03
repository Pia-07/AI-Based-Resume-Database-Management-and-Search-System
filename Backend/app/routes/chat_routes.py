from fastapi import APIRouter
from pydantic import BaseModel

from ..services.intent_service import detect_intent
from ..services.analytics_service import (
    location_distribution,
    skill_distribution,
    experience_distribution,
    upload_trend,
)
from ..services.embedding_service import build_vector_store, search_similar
from ..services.llm_service import generate_answer
from ..utils.db import resume_collection

router = APIRouter()


# -----------------------------
# Request Model
# -----------------------------
class ChatRequest(BaseModel):
    query: str


# -----------------------------
# CTA Decision Logic
# -----------------------------
def should_include_cta(intent: str, query: str) -> bool:
    factual_intents = {
        "count_resumes",
        "analytics_location",
        "analytics_skill",
        "analytics_experience",
        "analytics_trend",
    }

    # Never CTA for pure facts / charts
    if intent in factual_intents:
        return False

    # Very short queries → no CTA
    if len(query.split()) <= 6:
        return False

    return True


# -----------------------------
# CHAT ROUTE
# -----------------------------
@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query.strip()
    intent = detect_intent(query)

    print("🧠 Intent:", intent)

    # 1️⃣ Greeting (ONLY if user greets)
    if intent == "greeting":
        return {
            "reply": "Hello! I can help you analyze resumes, shortlist candidates, and generate insights."
        }

    # 2️⃣ Resume count (DB only)
    if intent == "count_resumes":
        count = resume_collection.count_documents({})
        return {
            "reply": f"There are {count} resumes currently available in the system."
        }

    # 3️⃣ Candidate list (DB only)
    if intent == "list_candidates":
        names = resume_collection.distinct("name")
        names = [n for n in names if n and len(n.strip()) > 2]

        if not names:
            return {"reply": "No candidate names are available yet."}

        return {
            "reply": "\n".join(f"{i+1}. {name}" for i, name in enumerate(names))
        }

    # 4️⃣ Analytics (charts only — NO LLM)
    if intent == "analytics_skill":
        return {
            "reply": "Skill distribution across all candidates.",
            "chart": skill_distribution()
        }

    if intent == "analytics_experience":
        return {
            "reply": "Experience distribution across candidates.",
            "chart": experience_distribution()
        }

    if intent == "analytics_location":
        return {
            "reply": "Candidate distribution by location.",
            "chart": location_distribution()
        }

    if intent == "analytics_trend":
        return {
            "reply": "Resume upload trend over time.",
            "chart": upload_trend()
        }

    # 5️⃣ Semantic HR Q&A (LLM + FAISS)
    resumes = list(
        resume_collection.find({}, {"_id": 0, "raw_text": 1})
    )

    if not resumes:
        return {
            "reply": "No resumes are available yet to answer this question."
        }

    build_vector_store(resumes)

    matched_chunks = search_similar(query, k=20)

    if not matched_chunks:
        return {
            "reply": "I could not find relevant information in the resumes for this query."
        }

    include_cta = should_include_cta(intent, query)

    answer = generate_answer(
        context="\n\n".join(matched_chunks),
        question=query,
        include_cta=include_cta
    )

    return {"reply": answer}
