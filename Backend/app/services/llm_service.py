import os
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dotenv import load_dotenv
import hashlib
from functools import lru_cache
import time

try:
    from google import genai
    load_dotenv()
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except ModuleNotFoundError:
    genai = None
    client = None
    load_dotenv()
    print("⚠️ 'google-generative-ai' package not installed.")

_llm_executor = ThreadPoolExecutor(max_workers=4)
GEMINI_TIMEOUT_SECONDS = 60
_quota_reset_time = 0
_quota_exceeded = False


def _call_gemini(prompt: str) -> str:
    """Synchronous Gemini API call with multi-model fallback."""
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]
    last_error = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(model=model_name, contents=prompt)
            return response.text.strip()
        except Exception as e:
            last_error = e
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                print(f"⚠️ {model_name} quota exhausted, trying next model...")
                time.sleep(1)
                continue
            elif "503" in err_str or "500" in err_str or "UNAVAILABLE" in err_str:
                print(f"⚠️ {model_name} server overloaded. Retrying next model.")
                time.sleep(2)
                continue
            else:
                raise
    raise last_error


def generate_answer(context: str, question: str, chat_history: Optional[List[Dict]] = None, include_cta: bool = True) -> str:
    """Generate a resume-based answer using the Gemini LLM (with quota protection)."""
    global _quota_reset_time, _quota_exceeded

    if _quota_exceeded and time.time() < _quota_reset_time:
        return "⏸️ API quota exceeded. Please wait a moment and try again."
    elif _quota_exceeded:
        _quota_exceeded = False

    history_text = ""
    if chat_history and len(chat_history) >= 2:
        last_msg = chat_history[-2]
        if last_msg:
            role = "User" if last_msg.get("sender") == "user" else "Assistant"
            text = last_msg.get("text", "")
            if text and len(text) < 200:
                history_text = f"Previous: {role}: {text}"

    prompt = f"""You are a resume analyst. Answer ONLY from the provided resume data.

RULES:
1. Use ONLY the Resume Context below — never invent or assume data.
2. Say "Not available" ONLY if the data is truly missing.
3. If given a pre-ranked numbered list of candidates, present it as a clean markdown table with columns: Rank | Name | Location | Experience | Skills.
4. Do NOT add extra candidates beyond what is listed. Do NOT reorder the list.
5. Be concise and direct. No extra commentary, no CTAs.

{("Previous: " + history_text) if history_text else ""}

RESUME DATA:
{context if context else "No resume data available."}

QUESTION: {question}

ANSWER:"""

    if client is None:
        return "LLM service unavailable: please install 'google-generative-ai' and set GEMINI_API_KEY."

    try:
        print(f"🤖 Calling Gemini API with {len(prompt)} char prompt (timeout: {GEMINI_TIMEOUT_SECONDS}s)...")
        future = _llm_executor.submit(_call_gemini, prompt)
        result = future.result(timeout=GEMINI_TIMEOUT_SECONDS)
        print(f"✅ Gemini response received: {len(result)} chars")
        return result

    except FuturesTimeoutError:
        print(f"⏱️ Gemini API timed out after {GEMINI_TIMEOUT_SECONDS}s")
        return "I apologize, but the AI service took too long to respond. Please try again."

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            _quota_exceeded = True
            _quota_reset_time = time.time() + 60
            return "🔄 API quota hit. Please wait or upgrade to paid plan."

        print(f"❌ Gemini API error: {e}")
        import traceback
        traceback.print_exc()

        if "503" in error_msg or "UNAVAILABLE" in error_msg:
            return "Google servers are overloaded. Please wait a moment and try again!"

        return f"I apologize, but I encountered an API error: {error_msg}"
