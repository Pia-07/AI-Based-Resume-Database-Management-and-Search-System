from sentence_transformers import SentenceTransformer, util

# Load once
intent_model = SentenceTransformer(
    "all-MiniLM-L6-v2",
    cache_folder="./models"
)

# Intent examples (THIS IS THE NLU BRAIN)
INTENT_EXAMPLES = {
    "greeting": [
        "hi", "hello", "hey", "good morning", "hyy"
    ],
    "count_resumes": [
        "how many resumes do you have",
        "number of resumes",
        "total candidates"
    ],
    "list_candidates": [
        "list all candidates",
        "show candidate names",
        "who are the candidates"
    ],
    "analytics_skill": [
        "skill distribution",
        "skills chart",
        "most common skills"
    ],
    "analytics_experience": [
        "experience distribution",
        "experience chart",
        "years of experience"
    ],
    "analytics_trend": [
        "resume upload trend",
        "growth over time",
        "monthly resumes"
    ],
    "semantic_search": [
        "find python developer",
        "java candidates",
        "ml engineer with experience"
    ]
}

# Precompute embeddings
intent_embeddings = {
    intent: intent_model.encode(examples, convert_to_tensor=True)
    for intent, examples in INTENT_EXAMPLES.items()
}


def detect_intent(query: str, threshold=0.55):
    query_embedding = intent_model.encode(query, convert_to_tensor=True)

    best_intent = "unknown"
    best_score = 0

    for intent, embeddings in intent_embeddings.items():
        score = util.cos_sim(query_embedding, embeddings).max().item()
        if score > best_score:
            best_score = score
            best_intent = intent

    if best_score < threshold:
        return "unknown"

    return best_intent
