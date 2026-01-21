import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_answer(context, question):
    prompt = f"""
You are an AI recruiter assistant.

Use the following resumes:
{context}

Answer this question:
{question}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert recruiter"},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content
