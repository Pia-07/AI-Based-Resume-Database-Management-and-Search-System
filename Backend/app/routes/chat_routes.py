from fastapi import APIRouter
from pydantic import BaseModel
from ..services.response_formatter import (
    chatgpt_style_reply,
    list_to_bullets
)


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

class ChatRequest(BaseModel):
    query: str


def chatgpt_style_reply(answer: str):
    """
    Makes normal answers look like ChatGPT
    """
    return f"""
🤖 **Here’s what I found based on the resumes:**

• {answer}

📌 **Key Notes**
- Data is extracted from uploaded resumes
- Information is normalized & deduplicated
- Response is context‑aware

❓ *Would you like a chart, table, or deeper analysis?*
"""


@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query.strip()
    intent = detect_intent(query)

    print("🧠 Intent:", intent)

    # 1️⃣ Greeting
    if intent == "greeting":
        return {
            "reply": "Hi! 👋 I can search resumes, answer questions, and generate analytics 📊"
        }

    # 2️⃣ Count resumes
    if intent == "count_resumes":
        count = resume_collection.count_documents({})
        return {
            "reply": f"📄 **Total Resumes:** {count}"
        }

    # 3️⃣ List candidates
    if intent == "list_candidates":
        names = resume_collection.distinct("name")
        return {
            "reply": "👥 **Candidates:**\n" + "\n".join(f"• {n}" for n in names)
        }

    # 4️⃣ 📊 Skill chart
    if intent == "analytics_skill":
        return {
            "reply": "📊 **Skill distribution across candidates:**",
            "chart": skill_distribution()
        }

    # 5️⃣ 📊 Experience chart
    if intent == "analytics_experience":
        return {
            "reply": "📊 **Experience distribution:**",
            "chart": experience_distribution()
        }

    # 6️⃣ 📍 Location chart
    if intent == "analytics_location":
        return {
            "reply": "📍 **Candidate distribution by location:**",
            "chart": location_distribution()
        }

    # 7️⃣ 📈 Upload trend
    if intent == "analytics_trend":
        return {
            "reply": "📈 **Resume upload trend over time:**",
            "chart": upload_trend()
        }

    # 8️⃣ 🧠 SEMANTIC Q&A (ChatGPT‑like answers)
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
    build_vector_store(resumes)

    results = search_similar(query, k=20)
    if not results:
        return {
            "reply": "❌ I couldn't find relevant resume information for that query."
        }

    raw_answer = generate_answer("\n\n".join(results), query)

    return {
        "reply": chatgpt_style_reply(raw_answer)
    }
