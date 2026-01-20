import os
from openai import OpenAI

def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

def generate_answer(context: str, query: str) -> str:
    client = get_client()
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=f"Context:\n{context}\n\nQuestion:\n{query}"
    )
    return response.output_text
