from fastapi import APIRouter
from pydantic import BaseModel
from ..utils.db import resume_collection
from ..services.embedding_service import build_vector_store, search_similar
from ..services.llm_service import generate_answer

router = APIRouter()

class ChatRequest(BaseModel):
    query: str


@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query.strip()

    # ✅ Handle greetings without FAISS / LLM
    if query.lower() in ["hi", "hello", "hey"]:
        return {
            "reply": "Hi! I can help you analyze and search resumes. What are you looking for?"
        }

    # 🔥 ALWAYS rebuild FAISS from DB
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
    build_vector_store(resumes)

    relevant_resumes = search_similar(query, k=20)

    if not relevant_resumes:
        return {
            "reply": "No relevant resumes found for your query."
        }

    # ✅ Generate answer using LLM
    answer = generate_answer(
        context="\n\n".join(relevant_resumes),
        question=query
    )

    return {
        "reply": answer
    }
