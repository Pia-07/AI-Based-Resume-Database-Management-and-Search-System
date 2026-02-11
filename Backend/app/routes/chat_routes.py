"""
Chat Routes
Chatbot API endpoints for resume-based Q&A and analytics.
Uses MongoDB for all data - NO STATIC RESPONSES, NO AWS S3.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import json

from ..services.intent_service import detect_intent, detect_chart_type
from ..services.analytics_service import (
    generate_chart,
)
from ..services.embedding_service import build_vector_store, search_similar, get_index_stats
from ..services.llm_service import generate_answer
from ..services.resume_service import get_resume_content_for_context
from ..utils.db import resume_collection, chat_collection

router = APIRouter(prefix="/chat", tags=["chat"])


# -----------------------------
# Request/Response Models
# -----------------------------
class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    chat_id: Optional[str] = None
    chat_history: Optional[List[Dict]] = None


class SaveChatRequest(BaseModel):
    user_id: str
    chat_id: str
    title: str
    messages: List[Dict]


# -----------------------------
# Helper: Build resume context
# -----------------------------
def build_resume_context(resumes: List[dict]) -> List[str]:
    contexts = []
    for resume in resumes:
        context = get_resume_content_for_context(resume)
        if context and len(context.strip()) > 10:
            contexts.append(context)
    return contexts


def format_chart_data_for_llm(chart_data: dict) -> str:
    """Format chart data as text so LLM can explain it and generate a table."""
    if not chart_data or not chart_data.get("labels"):
        return "No analytics data available."
    
    text = f"Analytics Data for {chart_data.get('title', 'Requested Metric')}:\n"
    labels = chart_data.get("labels", [])
    values = chart_data.get("values", [])
    
    # Create a structured list for the LLM
    text += "The following data represents the chart. PLEASE PRESENT THIS AS A MARKDOWN TABLE:\n"
    for i, (label, value) in enumerate(zip(labels, values)):
        if i >= 15: break
        text += f"- {label}: {value}\n"
        
    return text


# -----------------------------
# MAIN CHAT ENDPOINT
# -----------------------------
@router.post("")
def chat(request: ChatRequest):
    query = request.query.strip()
    user_id = request.user_id # Note: Analytics ignores this to show global stats
    chat_history = request.chat_history or []
    
    print(f"📩 Chat Query: '{query}'")
    
    intent = detect_intent(query)
    chart_preference = detect_chart_type(query)
    
    print(f"🧠 Intent: {intent}, Chart Pref: {chart_preference}")

    # Prepare response data holders
    chart_data = None
    context_text = ""
    include_cta = True

    # 1️⃣ ANALYTICS & FACTS INTENTS
    if intent.startswith("analytics_"):
        data_type = intent.replace("analytics_", "")
        # Generate chart
        chart_data = generate_chart(chart_preference, data_type, user_id)
        # Create text context from the chart data
        context_text = format_chart_data_for_llm(chart_data)
        include_cta = False

    elif intent == "count_resumes":
        count = resume_collection.count_documents({})
        context_text = f"FACT: There are exactly {count} total resumes/candidates in the database."
        include_cta = False
        
    elif intent == "list_candidates":
        names = list(resume_collection.find({}, {"name": 1, "_id": 0}))
        name_list = [n.get("name") for n in names if n.get("name")]
        if len(name_list) > 50:
             name_list = name_list[:50] # Limit for LLM context
             context_text = f"List of Candidates (first 50): {', '.join(name_list)}..."
        else:
             context_text = f"List of All Candidates: {', '.join(name_list)}"
        include_cta = False

    elif intent == "greeting":
        context_text = "GREETING: Introduce yourself as SmartHire, the AI hiring assistant. Be professional and mention that you can help with resume analysis, candidate search, and hiring insights."
        include_cta = False

    else:
        # 2️⃣ SEMANTIC SEARCH / Q&A (Default Fallback)
        # Fetch ALL resumes
        resumes = list(resume_collection.find({}, {
            "_id": 0, "raw_text": 1, "name": 1, "email": 1, "phone": 1,
            "skills": 1, "experience_years": 1, "location": 1,
            "education": 1, "experience": 1, "summary": 1, "certifications": 1
        }))
        
        if not resumes:
            context_text = "SYSTEM NOTE: No resumes are uploaded in the database yet."
        else:
            resume_contexts = build_resume_context(resumes)
            if resume_contexts:
                # Build vector store
                vector_input = [{"raw_text": ctx} for ctx in resume_contexts]
                build_vector_store(vector_input)
                
                # Search
                matched_chunks = search_similar(query, k=10)
                if not matched_chunks:
                    matched_chunks = resume_contexts[:5] # Fallback
                
                context_text = "\n\n---\n\n".join(matched_chunks)
            else:
                context_text = "SYSTEM NOTE: Resumes exist but have no readable content."

    # 3️⃣ GENERATE ANSWER
    # We pass the constructed context (whether analytics stats or resume chunks) to the LLM
    try:
        reply = generate_answer(
            context=context_text,
            question=query,
            chat_history=chat_history,
            include_cta=include_cta
        )
    except Exception as e:
        print(f"❌ LLM Error: {e}")
        reply = "I apologize, but I encountered an error generating the response."

    return {
        "reply": reply,
        "chart": chart_data
    }


# -----------------------------
# HISTORY MANAGEMENT
# -----------------------------

@router.get("/history/{user_id}")
def get_chat_history(user_id: str):
    try:
        chats = list(chat_collection.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1))
        return {"chats": chats}
    except Exception as e:
        return {"chats": [], "error": str(e)}

@router.post("/save")
def save_chat(request: SaveChatRequest):
    try:
        now = datetime.utcnow().isoformat()
        chat_collection.update_one(
            {"user_id": request.user_id, "chat_id": request.chat_id},
            {
                "$set": {
                    "title": request.title,
                    "messages": request.messages,
                    "updated_at": now
                },
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
        return {"success": True, "chat_id": request.chat_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/{chat_id}")
def delete_chat(chat_id: str):
    try:
        chat_collection.delete_one({"chat_id": chat_id})
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
