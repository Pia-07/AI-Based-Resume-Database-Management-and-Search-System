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
