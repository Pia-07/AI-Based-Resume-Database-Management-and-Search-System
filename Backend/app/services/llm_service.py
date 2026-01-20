import openai
import os
from dotenv import load_dotenv

load_dotenv()  # load .env file

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_answer(context, question):
    prompt = f"""
You are an AI recruiter assistant.

Use the following resumes:
{context}

Answer this question:
{question}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert recruiter"},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content
