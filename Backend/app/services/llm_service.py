import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
import hashlib
from functools import lru_cache
import time

# Try to import the Google Generative AI client. If it's not available, fall back
# gracefully so the backend doesn't crash at import time. This helps during local
# development when the package or API key may not be installed/configured.
try:
    from google import genai
    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except ModuleNotFoundError:
    genai = None
    client = None
    load_dotenv()
    print("⚠️ 'google-generative-ai' package not installed. Install with 'pip install google-generative-ai' and set GEMINI_API_KEY in your .env. LLM features will be disabled.")

# Response cache: stores (context_hash, question) -> answer
# LRU with 50 responses = ~5MB memory (tunable)
@lru_cache(maxsize=50)
def _get_cached_answer(context_hash: str, question: str) -> Optional[str]:
    """Retrieve cached answer if available. Returns None if not in cache."""
    return None

# Track quota state
_quota_reset_time = 0
_quota_exceeded = False


def generate_answer(
    context: str, 
    question: str, 
    chat_history: Optional[List[Dict]] = None,
    include_cta: bool = True
) -> str:
    """
    Generate a resume-based answer using the Gemini LLM (with quota protection).
    
    Args:
        context: Relevant resume text chunks from FAISS search
        question: User's current question
        chat_history: List of previous messages for conversational context
        include_cta: Whether to include call-to-action suggestions
    
    Returns:
        Structured response grounded in resume data
    """
    global _quota_reset_time, _quota_exceeded
    
    # Check if quota has been exceeded and reset time has passed
    if _quota_exceeded and time.time() < _quota_reset_time:
        return "⏸️ API quota exceeded. Please wait a moment and try again. For unlimited access, upgrade to a paid Gemini API plan: https://ai.google.dev/pricing"
    elif _quota_exceeded:
        _quota_exceeded = False  # Reset flag after waiting
    
    # OPTIMIZATION: Minimize context window for faster API response
    # Only use recent history if explicitly multi-turn
    history_text = ""
    if chat_history and len(chat_history) >= 2:
        last_msg = chat_history[-2] if len(chat_history) >= 2 else None
        if last_msg:
            role = "User" if last_msg.get("sender") == "user" else "Assistant"
            text = last_msg.get("text", "")
            if text and len(text) < 200:
                history_text = f"Previous: {role}: {text}"

    prompt = f"""You are a resume analyst. Answer ONLY from the provided resume data.


RULES:
1. Use ONLY the Resume Context below.
2. Never invent data. Say "Not available" if missing.
3. For lists/counts, use bullet points or markdown tables.
4. Be concise and direct. No metadata labels.
5. Reference candidate names from the context.
Do NOT include CTAs or suggestions.

{"Previous: " + history_text if history_text else ""}

RESUME DATA:
{context if context else "No resume data available."}

QUESTION: {question}

ANSWER:"""

    # If the client is not available, return an informative message instead of crashing
    if client is None:
        print("❌ Gemini client not available. Ensure 'google-generative-ai' is installed and GEMINI_API_KEY is set.")
        return "LLM service unavailable: please install 'google-generative-ai' and set GEMINI_API_KEY in your environment."

    try:
        print(f"🤖 Calling Gemini API with {len(prompt)} char prompt...")
        response = client.models.generate_content(
            model="models/gemini-flash",
            contents=prompt,
        )
        result = response.text.strip()
        print(f"✅ Gemini response: {len(result)} chars")
        return result if result else "Unable to generate an answer. Please try rephrasing your question."

    except Exception as e:
        error_msg = str(e)
        # Check if it's a quota/rate limit error
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            _quota_exceeded = True
            _quota_reset_time = time.time() + 60  # Wait 60 seconds before retrying
            print(f"⚠️ Gemini quota exceeded. Waiting 60 seconds before retry.")
            return "🔄 API quota hit for the day (free tier: 20 requests/day). Please wait or upgrade to paid plan for unlimited access: https://ai.google.dev/pricing"
        
        print(f"❌ Gemini API error: {e}")
        import traceback
        traceback.print_exc()
        return "Error processing your request. Please try again."
