from .model_manager import model_manager
import re

# Intent examples (THIS IS THE NLU BRAIN)
INTENT_EXAMPLES = {
    "greeting": [
        "hi", "hello", "hey", "good morning", "hyy", "hi there"
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

# Precompute embeddings using the shared model_manager
intent_embeddings = {
    intent: model_manager.encode(examples, convert_to_tensor=True)
    for intent, examples in INTENT_EXAMPLES.items()
}


def detect_intent(query: str, threshold=0.45):
    """Detect user intent from query. Lower threshold means more queries go to semantic search."""
    query_embedding = model_manager.encode(query, convert_to_tensor=True)

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
        # Pie is often better for distribution unless lots of categories
        return "bar" 
    
    return default
