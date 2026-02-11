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
        print(f"🤖 Calling Gemini API with {len(prompt)} char prompt...")
        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )
        result = response.text.strip()
        print(f"✅ Gemini response received: {len(result)} chars")
        return result

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        import traceback
        traceback.print_exc()
        return "I apologize, but I'm unable to process your request at the moment. Please try again shortly."
