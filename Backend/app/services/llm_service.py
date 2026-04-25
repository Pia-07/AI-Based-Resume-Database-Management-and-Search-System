import os
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dotenv import load_dotenv

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

# Thread pool for timeout-guarded Gemini calls
_llm_executor = ThreadPoolExecutor(max_workers=4)
GEMINI_TIMEOUT_SECONDS = 60


def _call_gemini(prompt: str) -> str:
    """Synchronous Gemini API call (runs in thread pool).
    Tries multiple models in case one hits its per-model quota."""
    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]
    last_error = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            last_error = e
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                print(f"⚠️ {model_name} quota exhausted, trying next model...")
                import time
                time.sleep(1)
                continue
            elif "503" in err_str or "500" in err_str or "UNAVAILABLE" in err_str:
                print(f"⚠️ {model_name} server overloaded (503/500). Retrying next model.")
                import time
                time.sleep(2)
                continue
            else:
                raise  # non-quota error, don't retry
    raise last_error



def generate_answer(
    context: str, 
    question: str, 
    chat_history: Optional[List[Dict]] = None,
    include_cta: bool = True
) -> str:
    """
    Generate a resume-based answer using the Gemini LLM.
    
    Args:
        context: Relevant resume text chunks from FAISS search
        question: User's current question
        chat_history: List of previous messages for conversational context
        include_cta: Whether to include call-to-action suggestions
    
    Returns:
        Structured response grounded in resume data
    """
    
    # Format chat history for context
    history_text = ""
    if chat_history and len(chat_history) > 0:
        history_lines = []
        for msg in chat_history[-10:]:  # Last 10 messages for context window
            role = "User" if msg.get("sender") == "user" else "Assistant"
            text = msg.get("text", "")
            if text:
                history_lines.append(f"{role}: {text}")
        if history_lines:
            history_text = "\n".join(history_lines)
    
    # CTA instruction based on parameter
    cta_instruction = ""
    if include_cta:
        cta_instruction = """
If genuinely helpful, you may optionally suggest a natural next step, such as viewing more candidates or exploring analytics. Keep it brief and only when it adds value.
"""
    else:
        cta_instruction = "Do NOT include any call-to-action or follow-up suggestions."

    prompt = f"""You are an AI resume analyst assistant. Your job is to answer questions ONLY using the provided resume data.

═══════════════════════════════════════════════════════════════
STRICT RULES (NON-NEGOTIABLE):
═══════════════════════════════════════════════════════════════

1. ONLY use information from the RESUME CONTEXT below - each section starts with [Candidate: Name]
2. NEVER invent, guess, or hallucinate information. If the count is 0, say 0.
3. If the answer is NOT in the resume context, say: "This information is not available in the uploaded resumes."
4. Reference specific candidates by name when answering
5. Be concise, professional, and direct. Do NOT use meta-labels like 'Answer:' or 'Context:'.
6. Use markdown formatting for readability.
7. **FOR ANALYTICS/COUNTS/LISTS**: You MUST return a clean Markdown Table if the user asks for comparisons, counts, or distributions.
   Example Table:
   | Location | Student Count |
   |----------|--------------|
   | Mumbai   | 12           |
   | Pune     | 8            |

═══════════════════════════════════════════════════════════════
RESPONSE FORMAT:
═══════════════════════════════════════════════════════════════

Provide a clear, natural language answer.
If listing data, use bullet points or a markdown table.
Do NOT include "Context:" or "Answer:" headers.
Do NOT generate ASCII charts or text-based graphs; the system handles visualization.

{cta_instruction}

═══════════════════════════════════════════════════════════════
PREVIOUS CONVERSATION (for context):
═══════════════════════════════════════════════════════════════
{history_text if history_text else "No previous messages."}

═══════════════════════════════════════════════════════════════
RESUME CONTEXT (Source of Truth):
═══════════════════════════════════════════════════════════════
{context if context else "No resume data available."}

═══════════════════════════════════════════════════════════════
USER QUESTION:
═══════════════════════════════════════════════════════════════
{question}

CRITICAL REMINDERS:
- Each chunk above represents REAL data
- Generate a UNIQUE response based on this specific question
- If multiple candidates match, mention all of them
- Do NOT repeat previous answers
- Reference candidate names from the context
- DO NOT generate ASCII charts or text-based graphs.
- Provide a clean, direct answer.
"""

    # If the client is not available, return an informative message instead of crashing
    if client is None:
        print("❌ Gemini client not available. Ensure 'google-generative-ai' is installed and GEMINI_API_KEY is set.")
        return "LLM service unavailable: please install 'google-generative-ai' and set GEMINI_API_KEY in your environment."

    try:
        print(f"🤖 Calling Gemini API with {len(prompt)} char prompt (timeout: {GEMINI_TIMEOUT_SECONDS}s)...")
        future = _llm_executor.submit(_call_gemini, prompt)
        result = future.result(timeout=GEMINI_TIMEOUT_SECONDS)
        print(f"✅ Gemini response received: {len(result)} chars")
        return result

    except FuturesTimeoutError:
        print(f"⏱️ Gemini API timed out after {GEMINI_TIMEOUT_SECONDS}s")
        return "I apologize, but the AI service took too long to respond. Please try again — subsequent requests are usually faster."

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        import traceback
        traceback.print_exc()
        
        err_str = str(e)
        if "503" in err_str or "UNAVAILABLE" in err_str:
             return "I'm currently receiving too many requests and the Google servers are overloaded. Please wait a moment and try again!"
        elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
             return "The API rate limit has been exceeded. Please try again in a few minutes."
             
        return f"I apologize, but I encountered an API error: {err_str}"
