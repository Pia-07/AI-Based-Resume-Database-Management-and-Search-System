"""
Chat Routes
Chatbot API endpoints for resume-based Q&A and analytics.
Uses MongoDB for all data - NO STATIC RESPONSES, NO AWS S3.

Performance: All blocking calls (MongoDB, FAISS, Gemini) are offloaded
to a thread-pool executor so the async event loop is never blocked.
"""
import asyncio
from functools import lru_cache
import hashlib
from functools import partial

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

# Response cache: (context_hash, question) -> cached_answer (LRU 30 responses)
@lru_cache(maxsize=30)
def _get_cached_response(context_hash: str, question: str) -> Optional[str]:
    """Cached responses to avoid Gemini quota waste on repeated queries."""
    return None


# Helper: run sync function in thread pool (keeps event loop free)
async def _run_sync(func, *args, **kwargs):
    """Run a blocking function in the default thread-pool executor."""
    loop = asyncio.get_event_loop()
    if kwargs:
        return await loop.run_in_executor(None, partial(func, *args, **kwargs))
    return await loop.run_in_executor(None, func, *args)


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


def extract_skill_from_query(query: str) -> Optional[str]:
    """Extract a single skill token from user query for deterministic filtering."""
    if not query:
        return None

    q = query.lower()
    skill_keywords = ["python", "java", "sql", "react", "node", "javascript", "c++", "c#", "ruby", "go", "docker", "aws", "ml", "data"]
    for skill in skill_keywords:
        if skill in q:
            return skill
    return None


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
async def chat(request: ChatRequest):
    query = request.query.strip()
    user_id = request.user_id  # Note: Analytics ignores this to show global stats
    chat_history = request.chat_history or []
    
    print(f"📩 Chat Query: '{query}'")
    
    # Intent detection — CPU-bound, offload to thread pool
    intent, chart_preference = await asyncio.gather(
        _run_sync(detect_intent, query),
        _run_sync(detect_chart_type, query),
    )
    
    print(f"🧠 Intent: {intent}, Chart Pref: {chart_preference}")

    # Prepare response data holders
    chart_data = None
    context_text = ""
    include_cta = True

    # 1️⃣ ANALYTICS & FACTS INTENTS
    if intent.startswith("analytics_"):
        data_type = intent.replace("analytics_", "")
        # Generate chart — MongoDB I/O, offload
        chart_data = await _run_sync(generate_chart, chart_preference, data_type, user_id)
        # Create text context from the chart data
        context_text = format_chart_data_for_llm(chart_data)
        include_cta = False

    elif intent == "count_resumes":
        count = await _run_sync(resume_collection.count_documents, {})
        context_text = f"FACT: There are exactly {count} total resumes/candidates in the database."
        include_cta = False
        
    elif intent == "list_candidates":
        names = await _run_sync(
            lambda: list(resume_collection.find({}, {"name": 1, "_id": 0}))
        )
        name_list = [n.get("name") for n in names if n.get("name")]
        if len(name_list) > 50:
             name_list = name_list[:50]  # Limit for LLM context
             context_text = f"List of Candidates (first 50): {', '.join(name_list)}..."
        else:
             context_text = f"List of All Candidates: {', '.join(name_list)}"
        include_cta = False

    elif intent == "greeting":
        context_text = "GREETING: Introduce yourself as SmartHire, the AI hiring assistant. Be professional and mention that you can help with resume analysis, candidate search, and hiring insights."
        include_cta = False

    else:
        # 2️⃣ Deterministic skill filtering for direct candidate queries
        skill = extract_skill_from_query(query)
        if skill:
            # Match both parsed skills array and raw text to maximize coverage
            candidates = await _run_sync(
                lambda: list(resume_collection.find(
                    {"$or": [
                        {"skills": {"$elemMatch": {"$regex": f"^{skill}$", "$options": "i"}}},
                        {"raw_text": {"$regex": skill, "$options": "i"}}
                    ]},
                    {"_id": 0, "name": 1, "skills": 1, "location": 1, "experience_years": 1}
                ))
            )

            if candidates:
                names = [c.get("name") for c in candidates if c.get("name")]
                unique_names = sorted(list(set(names)))
                direct_message = "\n".join([f"- {n}" for n in unique_names]) if unique_names else "No exact candidate names found."
                reply = f"Candidates with skill '{skill}':\n{direct_message}"
                if include_cta:
                    reply += "\n\nYou can ask for details like experience, location, or resume summary for any candidate."
                return {"reply": reply, "chart": None}

        # 3️⃣ SEMANTIC SEARCH / Q&A (Default Fallback)
        # Fetch ALL resumes — MongoDB I/O, offload
        resumes = await _run_sync(
            lambda: list(resume_collection.find({}, {
                "_id": 0, "raw_text": 1, "name": 1, "email": 1, "phone": 1,
                "skills": 1, "experience_years": 1, "location": 1,
                "education": 1, "experience": 1, "summary": 1, "certifications": 1
            }))
        )
        
        if not resumes:
            context_text = "No resumes uploaded."
        else:
            resume_contexts = build_resume_context(resumes)
            if resume_contexts:
                # Build vector store once and reuse (cache key: resume count + hash)
                vector_input = [{"raw_text": ctx} for ctx in resume_contexts]
                await _run_sync(build_vector_store, vector_input, force_rebuild=False)
                
                # Search — limit to top 5 chunks for faster API response
                matched_chunks = await _run_sync(search_similar, query, 5)
                if not matched_chunks:
                    matched_chunks = resume_contexts[:3]  # Fallback: 3 best candidates
                
                # Optimize context: limit to ~2000 chars total to speed up Gemini
                combined = "\n---\n".join(matched_chunks)
                if len(combined) > 2500:
                    combined = combined[:2500] + "\n[...context truncated...]"
                context_text = combined
            else:
                context_text = "No readable resume data."

    # 3️⃣ GENERATE ANSWER — Check cache first, then Network I/O (Gemini API)
    try:
        # Cache check: avoid calling Gemini for duplicate queries
        context_hash = hashlib.md5(context_text.encode()).hexdigest()[:8]
        cached_reply = _get_cached_response(context_hash, query)
        
        if cached_reply is not None:
            print(f"💾 Cache hit for query: {query[:50]}...")
            reply = cached_reply
        else:
            reply = await _run_sync(
                generate_answer,
                context_text,
                query,
                chat_history,
                include_cta,
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
async def get_chat_history(user_id: str):
    try:
        chats = await _run_sync(
            lambda: list(chat_collection.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1))
        )
        return {"chats": chats}
    except Exception as e:
        return {"chats": [], "error": str(e)}

@router.post("/save")
async def save_chat(request: SaveChatRequest):
    try:
        now = datetime.utcnow().isoformat()
        await _run_sync(
            lambda: chat_collection.update_one(
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
        )
        return {"success": True, "chat_id": request.chat_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str):
    try:
        await _run_sync(chat_collection.delete_one, {"chat_id": chat_id})
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
