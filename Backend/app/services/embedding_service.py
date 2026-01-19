<<<<<<< HEAD
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

# In-memory vector store (for now)
resume_texts = []
resume_vectors = None


def build_vector_store(resumes):
    global resume_texts, resume_vectors

    resume_texts = [r["raw_text"] for r in resumes]
    embeddings = model.encode(resume_texts)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings).astype("float32"))

    resume_vectors = index


def search_similar(query, k=3):
    query_vec = model.encode([query]).astype("float32")
    distances, indices = resume_vectors.search(query_vec, k)

    results = []
    for idx in indices[0]:
        results.append(resume_texts[idx])

    return results
=======
from functools import lru_cache
from typing import Iterable, List

import numpy as np
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    # Small, fast model suitable for local use
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed_texts(texts: Iterable[str]) -> np.ndarray:
    model = get_embedding_model()
    embeddings = model.encode(
        list(texts),
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)
    return embeddings

>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
