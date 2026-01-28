from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Load embedding model ONCE
model = SentenceTransformer(
    "all-MiniLM-L6-v2",
    cache_folder="./models",
)

# In-memory FAISS store
resume_texts = []
resume_vectors = None


def build_vector_store(resumes):
    """
    Build / rebuild FAISS index from resumes
    """
    global resume_texts, resume_vectors

    if not resumes:
        resume_texts = []
        resume_vectors = None
        print("⚠️ No resumes found to index")
        return

    resume_texts = [r["raw_text"] for r in resumes]

    embeddings = model.encode(
        resume_texts,
        convert_to_numpy=True,
        show_progress_bar=True,
    ).astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    resume_vectors = index

    print(f"✅ FAISS index built with {index.ntotal} resumes")
    print(f"📐 Embedding dimension: {dim}")


def search_similar(query, k=10):
    """
    Search top-k similar resumes
    """
    if resume_vectors is None or resume_vectors.ntotal == 0:
        print("❌ FAISS index empty")
        return []

    query_vec = model.encode(
        [query],
        convert_to_numpy=True,
    ).astype("float32")

    k = min(k, resume_vectors.ntotal)
    distances, indices = resume_vectors.search(query_vec, k)

    results = []
    for idx in indices[0]:
        if idx < len(resume_texts):
            results.append(resume_texts[idx])

    print(f"🔍 FAISS returned {len(results)} results for query: '{query}'")
    return results


def debug_faiss():
    if resume_vectors is None:
        print("❌ FAISS index not initialized")
    else:
        print("📊 Total vectors in FAISS:", resume_vectors.ntotal)
