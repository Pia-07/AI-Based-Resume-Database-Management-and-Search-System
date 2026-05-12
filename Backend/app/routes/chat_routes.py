"""
Chat Routes
Chatbot API endpoints for resume-based Q&A and analytics.
Uses MongoDB for all data - NO STATIC RESPONSES, NO AWS S3.

Performance: All blocking calls (MongoDB, FAISS, Gemini) are offloaded
to a thread-pool executor so the async event loop is never blocked.
"""
import asyncio
import re
from functools import lru_cache, partial
import hashlib

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


# Common tech skills to scan from raw_text when skills[] is empty
_KNOWN_SKILLS = [
    "python", "java", "javascript", "c++", "c#", "react", "node", "nodejs",
    "sql", "mysql", "mongodb", "postgresql", "html", "css", "php", "django",
    "flask", "flutter", "android", "kotlin", "swift", "aws", "azure", "docker",
    "kubernetes", "git", "machine learning", "deep learning", "tensorflow",
    "pytorch", "nlp", "data science", "excel", "powerbi", "tableau", "typescript",
    "spring", "laravel", "fastapi", "linux", "rest api", "graphql", "firebase",
]


def _extract_skills_from_raw(raw_text: str, max_skills: int = 6) -> list:
    """Scan raw_text for known skill keywords when skills[] array is empty."""
    if not raw_text:
        return []
    text_lower = raw_text.lower()
    found = []
    for s in _KNOWN_SKILLS:
        if s in text_lower and s not in found:
            found.append(s)
        if len(found) >= max_skills:
            break
    return found


def build_candidate_context(candidates: list, top_n: int, skill: str = None, location_filter: str = None) -> str:
    """Deduplicate, rank, and format candidates into a structured LLM context."""
    # Deduplicate by name (keep one per unique name)
    seen = set()
    unique = []
    for c in candidates:
        name = (c.get("name") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        unique.append(c)

    # Rank: by experience_years desc, then by number of skills desc
    def rank_key(c):
        exp = c.get("experience_years") or 0
        try:
            exp = float(exp)
        except (TypeError, ValueError):
            exp = 0.0
        skill_count = len(c.get("skills") or [])
        return (-exp, -skill_count)

    unique.sort(key=rank_key)
    top_candidates = unique[:top_n]

    if not top_candidates:
        return "No candidates found matching the given criteria."

    lines = []
    for i, c in enumerate(top_candidates, 1):
        name = c.get("name", "Unknown")
        loc = c.get("location") or "N/A"
        exp = c.get("experience_years") or 0

        # Use skills[] if available, else fall back to scanning raw_text
        skills_arr = c.get("skills") or []
        if not skills_arr:
            skills_arr = _extract_skills_from_raw(c.get("raw_text", ""))
        skills_list = ", ".join(skills_arr[:6]) if skills_arr else "Not parsed"

        lines.append(f"{i}. {name} | Location: {loc} | Experience: {exp} yrs | Skills: {skills_list}")

    actual_count = len(top_candidates)
    # Use actual count — if fewer results than requested, be honest about it
    if actual_count < top_n:
        header = f"Found {actual_count} candidate{'s' if actual_count != 1 else ''} (requested {top_n})"
    else:
        header = f"Top {actual_count} candidates"
    if skill:
        header += f" with '{skill}'"
    if location_filter:
        header += f" near {location_filter}"
    header += f" (ranked by experience, then skills breadth):"

    return header + "\n" + "\n".join(lines)


def extract_skill_from_query(query: str) -> Optional[str]:
    """Extract a single skill token from user query for deterministic filtering."""
    if not query:
        return None

    q = query.lower()
    skill_keywords = [
        "python", "java", "sql", "react", "node", "javascript", "c++", "c#", "ruby",
        "go", "docker", "aws", "ml", "data", "android", "flutter", "php", "django",
        "machine learning", "deep learning", "nodejs", "typescript", "kotlin", "swift",
        "sde", "software", "frontend", "backend", "fullstack", "devops", "cloud",
        "testing", "qa", "css", "html", "mongodb", "mysql", "postgresql"
    ]
    for skill in skill_keywords:
        if skill in q:
            return skill
    return None


def extract_top_n_from_query(query: str) -> int:
    """Extract the requested number of results (e.g. 'top 5', 'top 10') from the query. Defaults to 10."""
    import re
    # Match patterns like 'top 5', 'top 10', 'give me 5', '5 candidates'
    match = re.search(r'\b(top\s*)?(\d+)\b', query.lower())
    if match:
        n = int(match.group(2))
        if 1 <= n <= 50:  # Sanity check
            return n
    return 10  # Default


def extract_location_from_query(query: str) -> Optional[str]:
    """Extract a location keyword from the query (e.g. 'near ahmedabad' -> 'ahmedabad')."""
    import re
    q = query.lower()
    # Look for 'near X', 'from X', 'in X', 'live in X'
    match = re.search(r'(?:near|from|in|live\s+(?:in|near)|located\s+(?:in|near))\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)', q)
    if match:
        return match.group(1).strip().title()  # e.g. 'Ahmedabad'
    return None


def extract_candidate_name_from_query(query: str) -> Optional[str]:
    """Extract a candidate name from detail-request queries.
    Handles patterns like:
      'give me details for dev parekh'
      'details about hetvi'
      'tell me about kailash kanjariya'
      'show profile of harsh'
      'info on pia patel'
    """
    import re
    q = query.strip()
    patterns = [
        r'(?:details?\s+(?:for|about|of|on)|profile\s+(?:of|for)|info(?:rmation)?\s+(?:on|about|for)|tell\s+me\s+about|show\s+(?:me\s+)?(?:details?|profile|info)\s+(?:of|for|about))\s+(.+)',
        r'(?:who\s+is|about)\s+(.+)',
        r'(.+?)\s+(?:resume|profile|details?|information|background)',
    ]
    for pat in patterns:
        match = re.search(pat, q, re.IGNORECASE)
        if match:
            name = match.group(1).strip().rstrip('?.')
            # Filter out generic words that aren't names
            generic = {'the', 'a', 'an', 'all', 'candidates', 'students', 'applicants', 'me'}
            if name.lower() not in generic and len(name) > 2:
                return name
    return None


def build_candidate_detail(candidate: dict) -> str:
    """Format a candidate's full profile as a readable response."""
    name = candidate.get("name", "Unknown")
    email = candidate.get("email", "N/A")
    phone = candidate.get("phone", "N/A")
    location = candidate.get("location", "N/A")
    exp = candidate.get("experience_years", 0)
    skills = candidate.get("skills") or []
    if not skills:
        skills = _extract_skills_from_raw(candidate.get("raw_text", ""), max_skills=10)
    summary = candidate.get("summary", "") or ""
    education = candidate.get("education", []) or []
    experience = candidate.get("experience", []) or []
    certifications = candidate.get("certifications", []) or []

    lines = [f"## {name}\n"]
    lines.append(f"📍 **Location:** {location}")
    lines.append(f"📧 **Email:** {email}")
    lines.append(f"📞 **Phone:** {phone}")
    lines.append(f"💼 **Experience:** {exp} years")

    if skills:
        lines.append(f"🛠️ **Skills:** {', '.join(skills[:12])}")

    if summary:
        lines.append(f"\n📝 **Summary:**\n{summary[:500]}")

    if education:
        lines.append("\n🎓 **Education:**")
        for edu in education[:3]:
            if isinstance(edu, dict):
                deg = edu.get('degree', '')
                inst = edu.get('institution', '')
                yr = edu.get('year', '')
                lines.append(f"  - {deg} — {inst} {('(' + str(yr) + ')') if yr else ''}")
            elif isinstance(edu, str):
                lines.append(f"  - {edu}")

    if experience:
        lines.append("\n💼 **Work Experience:**")
        for job in experience[:3]:
            if isinstance(job, dict):
                title = job.get('title', '')
                company = job.get('company', '')
                duration = job.get('duration', '')
                lines.append(f"  - {title} at {company} {('(' + duration + ')') if duration else ''}")
            elif isinstance(job, str):
                lines.append(f"  - {job}")

    if certifications:
        lines.append(f"\n🏆 **Certifications:** {', '.join(str(c) for c in certifications[:5])}")

    return "\n".join(lines)


def format_chart_data_for_llm(chart_data: dict) -> str:
    """Format chart data as text so LLM can explain it and generate a table."""
    if not chart_data or not chart_data.get("labels"):
        return "No analytics data available."
    
    text = f"Analytics Data for {chart_data.get('title', 'Requested Metric')}:\n"
    labels = chart_data.get("labels", [])
    values = chart_data.get("values", [])
    
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
    user_id = request.user_id
    chat_history = request.chat_history or []
    
    print(f"📩 Chat Query: '{query}'")

    # 🚨 PREEMPTIVE CHECK: Bypass all LLM/Intent logic if index is currently building
    index_stats = get_index_stats()
    if index_stats.get("status") == "building":
         return {
             "reply": "I am currently analyzing and indexing all the resumes in the background. Please wait a minute while I finish my scan before asking complex queries!",
             "chart": None
         }

    # 👤 FAST-TRACK: Candidate detail lookup (runs before intent detection)
    candidate_name = extract_candidate_name_from_query(query)
    if candidate_name:
        # Search by name (case-insensitive, partial match)
        name_parts = candidate_name.strip().split()
        # Build a regex that matches all parts of the name
        name_regex = ".*".join(re.escape(p) for p in name_parts)
        candidate = await _run_sync(
            lambda: resume_collection.find_one(
                {"name": {"$regex": name_regex, "$options": "i"}},
                {"_id": 0, "name": 1, "email": 1, "phone": 1, "location": 1,
                 "skills": 1, "experience_years": 1, "summary": 1,
                 "education": 1, "experience": 1, "certifications": 1, "raw_text": 1}
            )
        )
        if candidate:
            print(f"👤 Candidate detail lookup: found '{candidate.get('name')}'")
            return {"reply": build_candidate_detail(candidate), "chart": None}
        else:
            print(f"👤 Candidate detail lookup: '{candidate_name}' not found, falling through")

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
        chart_data = await _run_sync(generate_chart, chart_preference, data_type, user_id)
        context_text = format_chart_data_for_llm(chart_data)
        include_cta = False

    elif intent == "count_resumes":
        count = await _run_sync(resume_collection.count_documents, {})
        context_text = f"FACT: There are exactly {count} total resumes/candidates in the database."
        include_cta = False
        
    elif intent == "list_candidates":
        top_n = extract_top_n_from_query(query)
        location_filter = extract_location_from_query(query)
        skill = extract_skill_from_query(query)

        mongo_filter = {}
        if skill:
            mongo_filter["$or"] = [
                {"skills": {"$elemMatch": {"$regex": skill, "$options": "i"}}},
                {"raw_text": {"$regex": skill, "$options": "i"}}
            ]
        if location_filter:
            mongo_filter["location"] = {"$regex": location_filter, "$options": "i"}

        candidates = await _run_sync(
            lambda: list(resume_collection.find(
                mongo_filter,
                {"_id": 0, "name": 1, "skills": 1, "location": 1, "experience_years": 1, "raw_text": 1}
            ))
        )
        # ✅ SHORT-CIRCUIT: Return directly without calling LLM — data is already structured
        reply_text = build_candidate_context(candidates, top_n, skill, location_filter)
        return {"reply": reply_text, "chart": None}

    elif intent == "greeting":
        context_text = "GREETING: Introduce yourself as SmartHire, the AI hiring assistant. Be professional and mention that you can help with resume analysis, candidate search, and hiring insights."
        include_cta = False

    else:
        # 2️⃣ Deterministic skill + location filtering for direct candidate queries
        skill = extract_skill_from_query(query)
        location_filter = extract_location_from_query(query)
        top_n = extract_top_n_from_query(query)

        if skill or location_filter:
            mongo_filter = {}
            if skill:
                mongo_filter["$or"] = [
                    {"skills": {"$elemMatch": {"$regex": skill, "$options": "i"}}},
                    {"raw_text": {"$regex": skill, "$options": "i"}}
                ]
            if location_filter:
                mongo_filter["location"] = {"$regex": location_filter, "$options": "i"}

            candidates = await _run_sync(
                lambda: list(resume_collection.find(
                    mongo_filter,
                    {"_id": 0, "name": 1, "skills": 1, "location": 1, "experience_years": 1, "raw_text": 1}
                ))
            )

            if candidates:
                # ✅ SHORT-CIRCUIT: Return pre-ranked list directly, no LLM needed
                reply_text = build_candidate_context(candidates, top_n, skill, location_filter)
                return {"reply": reply_text, "chart": None}

        # 3️⃣ SEMANTIC SEARCH / Q&A — Check if vector index is ready
        index_stats = get_index_stats()
        
        if index_stats.get("chunks", 0) > 0:
            # Index already warmly built, just search
            matched_chunks = await _run_sync(search_similar, query, 10)
            if not matched_chunks:
                context_text = "SYSTEM NOTE: No specifically relevant content found."
            else:
                context_text = "\n\n---\n\n".join(matched_chunks)
        else:
            # First-time build: Fetch ALL resumes
            resumes = await _run_sync(
                lambda: list(resume_collection.find({}, {
                    "_id": 0, "raw_text": 1, "name": 1, "email": 1, "phone": 1,
                    "skills": 1, "experience_years": 1, "location": 1,
                    "education": 1, "experience": 1, "summary": 1, "certifications": 1
                }))
            )
            
            if not resumes:
                context_text = "SYSTEM NOTE: No resumes are uploaded in the database yet."
            else:
                resume_contexts = build_resume_context(resumes)
                if resume_contexts:
                    vector_input = [{"raw_text": ctx} for ctx in resume_contexts]
                    await _run_sync(build_vector_store, vector_input)
                    matched_chunks = await _run_sync(search_similar, query, 10)
                    context_text = "\n\n---\n\n".join(matched_chunks) if matched_chunks else ""
                else:
                    context_text = "SYSTEM NOTE: Resumes exist but have no readable content."

    # 3️⃣ GENERATE ANSWER — Check cache first, then Network I/O (Gemini API)
    try:
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
