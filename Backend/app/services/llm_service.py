import os
from typing import List, Dict, Optional
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
If relevant, suggest a helpful follow-up action such as:
- Viewing more candidates
- Scheduling interviews
- Requesting detailed analysis
Only include if genuinely useful, not every response needs a follow-up.
"""
    else:
        cta_instruction = "Do NOT include any call-to-action or follow-up suggestions."

    prompt = f"""You are an AI resume analyst assistant. Your job is to answer questions ONLY using the provided resume data.

═══════════════════════════════════════════════════════════════
STRICT RULES (NON-NEGOTIABLE):
═══════════════════════════════════════════════════════════════

1. ONLY use information from the RESUME CONTEXT below
2. NEVER invent, guess, or hallucinate information
3. If the answer is NOT in the resume, say: "This information is not available in the uploaded resume."
4. Be concise, professional, and direct
5. Use markdown formatting for readability

═══════════════════════════════════════════════════════════════
RESPONSE FORMAT (FOLLOW THIS STRUCTURE):
═══════════════════════════════════════════════════════════════

**Context:**
Brief explanation of which part of the resume you're referencing (1-2 sentences max)

**Answer:**
Clear, direct answer to the question

**Key Points:**
- Use bullet points
- Keep each point short and scannable
- Only include resume-verified facts

{cta_instruction}

═══════════════════════════════════════════════════════════════
PREVIOUS CONVERSATION (for context):
═══════════════════════════════════════════════════════════════
{history_text if history_text else "No previous messages."}

═══════════════════════════════════════════════════════════════
RESUME CONTEXT:
═══════════════════════════════════════════════════════════════
{context if context else "No resume data available."}

═══════════════════════════════════════════════════════════════
USER QUESTION:
═══════════════════════════════════════════════════════════════
{question}

IMPORTANT REMINDERS:
- Generate a UNIQUE response based on the specific question
- Do NOT repeat previous answers
- If context is empty or irrelevant, clearly state the information is not available
- Match your response length to the question complexity
"""

    # If the client is not available, return an informative message instead of crashing
    if client is None:
        print("❌ Gemini client not available. Ensure 'google-generative-ai' is installed and GEMINI_API_KEY is set.")
        return "LLM service unavailable: please install 'google-generative-ai' and set GEMINI_API_KEY in your environment."

    try:
        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )
        return response.text.strip()

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return "I apologize, but I'm unable to process your request at the moment. Please try again shortly."
