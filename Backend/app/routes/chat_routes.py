from fastapi import APIRouter
from pydantic import BaseModel
from ..utils.db import resume_collection
from ..services.embedding_service import build_vector_store, search_similar
from ..services.llm_service import generate_answer

router = APIRouter()

class ChatRequest(BaseModel):
    query: str


# -------------------------
# Build vector store ONCE
# -------------------------
resumes = list(resume_collection.find({}, {"_id": 0, "raw_text": 1}))
build_vector_store(resumes)


# -------------------------
# Chat endpoint
# -------------------------
@router.post("/chat")
def chat(request: ChatRequest):
    query = request.query

    # Retrieve relevant resume chunks
    relevant_resumes = search_similar(query)

    if not relevant_resumes:
        return {"reply": "No relevant resumes found."}

    context = "\n\n".join(relevant_resumes)

    # Generate AI answer
    answer = generate_answer(context, query)

    return {"reply": answer}
