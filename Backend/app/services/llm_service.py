import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_answer(context, question):
    prompt = f"""
You are an AI recruiter assistant.

Rules:
- If the user greets (hi, hello, hey), greet politely.
- Answer ONLY using the resume data provided.
- If resume data is not relevant, say so politely.

Resumes:
{context}

User question:
{question}
"""

    try:
        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print("Gemini error:", e)
        return "AI service is temporarily unavailable. Please try again."
