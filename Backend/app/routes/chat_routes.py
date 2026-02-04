from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uuid

from ..services.intent_service import detect_intent
from ..services.analytics_service import (
    location_distribution,
    skill_distribution,
    experience_distribution,
    upload_trend,
)
from ..services.embedding_service import build_vector_store, search_similar
from ..services.llm_service import generate_answer
from ..utils.db import resume_collection, chat_collection

router = APIRouter(prefix="/chat", tags=["chat"])


# -----------------------------
# Request/Response Models
# -----------------------------
class ChatMessage(BaseModel):
    id: str
    sender: str  # "user" or "assistant"
    text: str
    timestamp: str


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
# Helper: Determine CTA inclusion
# -----------------------------
def should_include_cta(intent: str, query: str) -> bool:
    factual_intents = {
        "count_resumes",
        "analytics_location",
        "analytics_skill",
        "analytics_experience",
        "analytics_trend",
        "list_candidates",
    }
    if intent in factual_intents:
        return False
    if len(query.split()) <= 6:
        return False
    return True


# -----------------------------
# MAIN CHAT ENDPOINT
# -----------------------------
@router.post("")
def chat(request: ChatRequest):
    query = request.query.strip()
    user_id = request.user_id
    chat_id = request.chat_id
    chat_history = request.chat_history or []
    
    # Log incoming request for debugging
    print(f"📩 Chat Request: query='{query}', user_id={user_id}, chat_id={chat_id}")
    print(f"📜 Chat History: {len(chat_history)} previous messages")
    
    intent = detect_intent(query)
    print(f"🧠 Detected Intent: {intent}")

    # 1️⃣ Greeting
    if intent == "greeting":
        return {
            "reply": "Hello! I'm your resume analyst assistant. I can help you explore candidate profiles, find specific skills, and answer questions about the uploaded resumes. What would you like to know?",
            "chart": None,
        }

    # 2️⃣ Resume count
    if intent == "count_resumes":
        # Filter by user if user_id provided
        filter_query = {"user_id": user_id} if user_id else {}
        count = resume_collection.count_documents(filter_query)
        return {
            "reply": f"**Answer:**\nThere are **{count}** resumes currently available in the system.",
            "chart": None,
        }

    # 3️⃣ Candidate list
    if intent == "list_candidates":
        filter_query = {"user_id": user_id} if user_id else {}
        names = list(resume_collection.find(filter_query, {"name": 1, "_id": 0}))
        names = [n.get("name") for n in names if n.get("name") and len(n.get("name", "").strip()) > 2]

        if not names:
            return {
                "reply": "**Answer:**\nNo candidate names are available yet. Please upload some resumes first.",
                "chart": None,
            }

        formatted_names = "\n".join(f"{i+1}. {name}" for i, name in enumerate(names))
        return {
            "reply": f"**Context:**\nListing all candidates from uploaded resumes.\n\n**Answer:**\n{formatted_names}\n\n**Key Points:**\n- Total candidates: {len(names)}",
            "chart": None,
        }

    # 4️⃣ Analytics
    if intent == "analytics_skill":
        return {
            "reply": "**Context:**\nAnalyzing skill distribution across all uploaded resumes.\n\n**Answer:**\nHere's the skill distribution chart based on the resume data.",
            "chart": skill_distribution(user_id),
        }

    if intent == "analytics_experience":
        return {
            "reply": "**Context:**\nAnalyzing experience levels across all candidates.\n\n**Answer:**\nHere's the experience distribution chart.",
            "chart": experience_distribution(user_id),
        }

    if intent == "analytics_location":
        return {
            "reply": "**Context:**\nAnalyzing geographic distribution of candidates.\n\n**Answer:**\nHere's the location distribution chart.",
            "chart": location_distribution(user_id),
        }

    if intent == "analytics_trend":
        return {
            "reply": "**Context:**\nAnalyzing resume upload patterns over time.\n\n**Answer:**\nHere's the upload trend chart.",
            "chart": upload_trend(user_id),
        }

    # 5️⃣ Semantic Q&A - Resume-based answering
    try:
        # Get resumes (filter by user if provided)
        filter_query = {"user_id": user_id} if user_id else {}
        resumes = list(resume_collection.find(filter_query, {"_id": 0, "raw_text": 1}))

        print(f"📄 Found {len(resumes)} resumes for context")

        if not resumes:
            return {
                "reply": "**Answer:**\nNo resumes are available yet to answer this question. Please upload some resumes first using the Upload Resume button.",
                "chart": None,
            }

        # Build vector store with available resumes
        build_vector_store(resumes)

        # Search for relevant chunks
        matched_chunks = search_similar(query, k=15)
        print(f"🔍 Found {len(matched_chunks)} relevant chunks")

        if not matched_chunks:
            return {
                "reply": "**Answer:**\nI could not find relevant information in the uploaded resumes to answer your question. The specific details you're asking about may not be present in the current resume data.",
                "chart": None,
            }

        # Generate answer with chat history for context
        context = "\n\n---\n\n".join(matched_chunks)
        include_cta = should_include_cta(intent, query)
        
        answer = generate_answer(
            context=context,
            question=query,
            chat_history=chat_history,
            include_cta=include_cta
        )
        
        print(f"✅ Generated answer: {len(answer)} characters")

        return {
            "reply": answer,
            "chart": None,
        }

    except Exception as e:
        print(f"❌ Chat processing error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "reply": "**Answer:**\nI encountered an error while processing your request. Please try rephrasing your question or try again later.",
            "chart": None,
        }


# -----------------------------
# CHAT HISTORY ENDPOINTS
# -----------------------------

@router.get("/history/{user_id}")
def get_chat_history(user_id: str):
    """Get all chats for a user"""
    try:
        print(f"🔄 Request to fetch chat history for user_id: '{user_id}'")
        
        chats = list(chat_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("updated_at", -1))
        
        # Debug: check total chats in DB
        total_chats = chat_collection.count_documents({})
        
        print(f"📂 Retrieved {len(chats)} chats for user '{user_id}'. Total chats in DB: {total_chats}")
        
        if len(chats) == 0 and total_chats > 0:
            print(f"⚠️ User '{user_id}' has 0 chats, but there are {total_chats} chats in total in the DB.")
            # Optional: log a sample chat's user_id if any exist
            sample = chat_collection.find_one({}, {"user_id": 1})
            if sample:
                print(f"ℹ️ Sample chat in DB has user_id: '{sample.get('user_id')}'")

        return {"chats": chats}
    except Exception as e:
        print(f"❌ Error fetching chat history: {e}")
        return {"chats": [], "error": str(e)}


@router.post("/save")
def save_chat(request: SaveChatRequest):
    """Save or update a chat session"""
    try:
        now = datetime.utcnow().isoformat()
        
        # Check if chat exists
        existing = chat_collection.find_one({
            "user_id": request.user_id,
            "chat_id": request.chat_id
        })
        
        if existing:
            # Update existing chat
            chat_collection.update_one(
                {"user_id": request.user_id, "chat_id": request.chat_id},
                {
                    "$set": {
                        "title": request.title,
                        "messages": request.messages,
                        "updated_at": now
                    }
                }
            )
            print(f"✅ Updated chat {request.chat_id} for user {request.user_id}")
        else:
            # Create new chat
            chat_doc = {
                "user_id": request.user_id,
                "chat_id": request.chat_id,
                "title": request.title,
                "messages": request.messages,
                "created_at": now,
                "updated_at": now
            }
            chat_collection.insert_one(chat_doc)
            print(f"✅ Created new chat {request.chat_id} for user {request.user_id}")
        
        return {"success": True, "chat_id": request.chat_id}
    except Exception as e:
        print(f"❌ Error saving chat: {e}")
        return {"success": False, "error": str(e)}


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user_id: str = None):
    """Delete a chat by ID"""
    try:
        filter_query = {"chat_id": chat_id}
        if user_id:
            filter_query["user_id"] = user_id
            
        result = chat_collection.delete_one(filter_query)
        
        if result.deleted_count > 0:
            print(f"🗑️ Deleted chat {chat_id}")
            return {"success": True, "deleted": True}
        else:
            return {"success": False, "deleted": False, "message": "Chat not found"}
    except Exception as e:
        print(f"❌ Error deleting chat: {e}")
        return {"success": False, "error": str(e)}


@router.get("/single/{chat_id}")
def get_single_chat(chat_id: str, user_id: str = None):
    """Get a single chat by ID"""
    try:
        filter_query = {"chat_id": chat_id}
        if user_id:
            filter_query["user_id"] = user_id
            
        chat = chat_collection.find_one(filter_query, {"_id": 0})
        
        if chat:
            return {"success": True, "chat": chat}
        else:
            return {"success": False, "chat": None, "message": "Chat not found"}
    except Exception as e:
        print(f"❌ Error fetching chat: {e}")
        return {"success": False, "error": str(e)}
