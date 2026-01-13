from fastapi import APIRouter
from pydantic import BaseModel
from app.utils.db import resume_collection
from app.services.embedding_service import build_vector_store, search_similar
from app.services.llm_service import generate_answer

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query

    # 1️⃣ Load resumes
    resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))

    # 2️⃣ Build vector store
    build_vector_store(resumes)

    # 3️⃣ Retrieve top resumes
    relevant_resumes = search_similar(query)

    context = "\n\n".join(relevant_resumes)

    # 4️⃣ Generate AI answer
    answer = generate_answer(context, query)

    return {
        "reply": answer
    }
