"""
Intent Service — Detects user intent using Gemini API embeddings.

Uses cosine similarity against precomputed intent example embeddings
to classify user queries into categories.
"""

from .model_manager import model_manager
import re
import numpy as np

# Intent examples (THIS IS THE NLU BRAIN)
INTENT_EXAMPLES = {
    "greeting": [
        "hi", "hello", "hey", "good morning", "hyy", "hi there",
        "what can you do", "how can you help", "how to use this", "help me"
    ],
    "count_resumes": [
        "how many resumes do you have",
        "number of resumes",
        "total candidates",
        "count candidates"
    ],
    "list_candidates": [
        "list all candidates",
        "show candidate names",
        "who are the candidates",
        "names of applicants"
    ],
    "analytics_skill": [
        "skill distribution",
        "skills chart",
        "most common skills",
        "chart for skills"
    ],
    "analytics_experience": [
        "experience distribution",
        "experience chart",
        "years of experience",
        "seniority levels"
    ],
    "analytics_location": [
        "location chart",
        "location distribution",
        "bar chart for locations",
        "candidates by location",
        "where are candidates from"
    ],
    "analytics_trend": [
        "resume upload trend",
        "growth over time",
        "monthly resumes",
        "timeline of uploads"
    ],
    "semantic_search": [
        # Skills-based queries
        "find python developer",
        "java candidates",
        "ml engineer with experience",
        "search for data scientist"
    ]
}

# Lazy-load intent embeddings (computed on first use, not at import time)
_intent_embeddings = None


def _get_intent_embeddings():
    """Lazy-load intent embeddings on first call to avoid startup overhead."""
    global _intent_embeddings
    if _intent_embeddings is None:
        print("🧠 Computing intent embeddings via Gemini API...")
        _intent_embeddings = {
            intent: model_manager.encode(examples, convert_to_numpy=True)
            for intent, examples in INTENT_EXAMPLES.items()
        }
        print("✅ Intent embeddings ready")
    return _intent_embeddings


def detect_intent(query: str, threshold=0.45):
    """Detect user intent from query. Lower threshold means more queries go to semantic search."""
    # Fast-track for greetings
    clean_query = re.sub(r'[^\w\s]', '', query.lower().strip())
    greetings = {"hi", "hello", "hey", "hyy", "hii", "helo", "greeting", "greetings"}
    if clean_query in greetings or clean_query.startswith(("hi ", "hello ", "hey ")):
        return "greeting"

    intent_embeddings = _get_intent_embeddings()
    query_embedding = model_manager.encode(query, convert_to_numpy=True)

    best_intent = "unknown"
    best_score = 0

    for intent, embeddings in intent_embeddings.items():
        score = model_manager.cos_sim(query_embedding, embeddings).max().item()
        if score > best_score:
            best_score = score
            best_intent = intent

    print(f"🧠 Intent detection: '{query[:50]}...' → {best_intent} (score: {best_score:.3f}, threshold: {threshold})")

    if best_score < threshold:
        return "unknown"

    return best_intent


def detect_chart_type(query: str, default="bar"):
    """
    Detect explicit chart type preference from query.
    """
    q = query.lower()
    if "pie" in q:
        return "pie"
    if "bar" in q:
        return "bar"
    if "line" in q:
        return "line"
    if "trend" in q:
        return "line"
    if "distribution" in q:
        return "bar"

    return default
