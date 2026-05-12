"""
Embedding Service — Vector search using numpy cosine similarity.

Replaces FAISS with pure numpy for Render free-tier compatibility.
Uses Gemini API embeddings via model_manager.
Includes disk-based caching to avoid re-embedding on every restart.
"""

import os
import json
import numpy as np
import hashlib
from typing import List, Dict, Optional

from .model_manager import model_manager

# Cache directory for persisted embeddings
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".cache")
CACHE_FILE = os.path.join(CACHE_DIR, "embeddings_cache.npz")
CACHE_META_FILE = os.path.join(CACHE_DIR, "embeddings_meta.json")

# In-memory vector store
_chunk_texts: List[str] = []
_chunk_metadata: List[Dict] = []
_embeddings_matrix: Optional[np.ndarray] = None
_cache_hash: Optional[str] = None
_is_building: bool = False


def _compute_cache_hash(resumes: List[Dict]) -> str:
    """Compute a hash of resume data to detect changes."""
    content = "".join(sorted([r.get("raw_text", "")[:100] for r in resumes]))
    return hashlib.md5(content.encode()).hexdigest()


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks for better semantic search.
    """
    if not text or len(text.strip()) == 0:
        return []

    text = text.strip()

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if end < len(text):
            last_period = chunk.rfind('. ')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)

            if break_point > chunk_size // 2:
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1

        if chunk.strip():
            chunks.append(chunk.strip())

        start = end - overlap if end < len(text) else len(text)

    return chunks


def _save_cache(cache_hash: str):
    """Save embeddings and metadata to disk."""
    global _embeddings_matrix, _chunk_texts, _chunk_metadata
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        np.savez_compressed(CACHE_FILE, embeddings=_embeddings_matrix)
        meta = {
            "cache_hash": cache_hash,
            "chunk_texts": _chunk_texts,
            "chunk_metadata": _chunk_metadata,
        }
        with open(CACHE_META_FILE, "w") as f:
            json.dump(meta, f)
        print(f"💾 Embeddings cached to disk ({len(_chunk_texts)} chunks)")
    except Exception as e:
        print(f"⚠️ Failed to save embedding cache: {e}")


def _load_cache(expected_hash: str) -> bool:
    """Try to load embeddings from disk cache. Returns True if successful."""
    global _embeddings_matrix, _chunk_texts, _chunk_metadata, _cache_hash
    try:
        if not os.path.exists(CACHE_FILE) or not os.path.exists(CACHE_META_FILE):
            return False

        with open(CACHE_META_FILE, "r") as f:
            meta = json.load(f)

        if meta.get("cache_hash") != expected_hash:
            print("ℹ️ Disk cache hash mismatch — will rebuild embeddings")
            return False

        data = np.load(CACHE_FILE)
        _embeddings_matrix = data["embeddings"].astype("float32")
        _chunk_texts = meta["chunk_texts"]
        _chunk_metadata = meta["chunk_metadata"]
        _cache_hash = expected_hash

        print(f"⚡ Loaded embeddings from disk cache ({len(_chunk_texts)} chunks) — zero API calls!")
        return True
    except Exception as e:
        print(f"⚠️ Failed to load embedding cache: {e}")
        return False


def build_vector_store(resumes: List[Dict], force_rebuild: bool = False) -> bool:
    """
    Build / rebuild vector index from resumes with intelligent chunking.
    Uses disk caching to avoid regenerating embeddings on every restart.
    """
    global _chunk_texts, _chunk_metadata, _embeddings_matrix, _cache_hash, _is_building

    if _is_building:
        print("⚠️ Vector index build already in progress. Skipping duplicate build.")
        return False

    if not resumes:
        _chunk_texts = []
        _chunk_metadata = []
        _embeddings_matrix = None
        _cache_hash = None
        print("⚠️ No resumes found to index")
        return False

    # Check if we can use in-memory cached index
    new_hash = _compute_cache_hash(resumes)
    if not force_rebuild and _cache_hash == new_hash and _embeddings_matrix is not None:
        print(f"✅ Using in-memory cached vector index ({len(_chunk_texts)} chunks)")
        return False

    # Try to load from disk cache (avoids API calls entirely)
    if not force_rebuild and _load_cache(new_hash):
        return True

    _is_building = True
    # Build new index with chunking
    print(f"🔄 Building vector index from {len(resumes)} resumes...")

    _chunk_texts = []
    _chunk_metadata = []

    for i, resume in enumerate(resumes):
        raw_text = resume.get("raw_text", "")
        resume_name = resume.get("name", f"Resume_{i}")

        if not raw_text:
            continue

        chunks = _chunk_text(raw_text, chunk_size=500, overlap=100)

        for j, chunk in enumerate(chunks):
            _chunk_texts.append(chunk)
            _chunk_metadata.append({
                "resume_index": i,
                "resume_name": resume_name,
                "chunk_index": j,
                "total_chunks": len(chunks)
            })

    if not _chunk_texts:
        print("⚠️ No valid text chunks extracted from resumes")
        _embeddings_matrix = None
        _cache_hash = None
        _is_building = False
        return False

    # Create embeddings via Gemini API
    print(f"📐 Creating embeddings for {len(_chunk_texts)} chunks via Gemini API...")
    _embeddings_matrix = model_manager.encode(
        _chunk_texts,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype("float32")

    _cache_hash = new_hash

    # Save to disk for next startup
    _save_cache(new_hash)

    print(f"✅ Vector index built: {len(_chunk_texts)} chunks from {len(resumes)} resumes")
    print(f"📐 Embedding dimension: {_embeddings_matrix.shape[1]}")

    _is_building = False
    return True



def search_similar(query: str, k: int = 10) -> List[str]:
    """
    Search top-k similar chunks using cosine similarity.
    """
    if _embeddings_matrix is None or len(_chunk_texts) == 0:
        print("❌ Vector index empty or not initialized")
        return []

    # Create query embedding
    query_vec = model_manager.encode(
        [query],
        convert_to_numpy=True,
    ).astype("float32")

    # Compute cosine similarity
    query_norm = query_vec / (np.linalg.norm(query_vec, axis=1, keepdims=True) + 1e-8)
    data_norm = _embeddings_matrix / (np.linalg.norm(_embeddings_matrix, axis=1, keepdims=True) + 1e-8)
    similarities = np.dot(data_norm, query_norm.T).flatten()

    # Get top-k indices
    k = min(k, len(_chunk_texts))
    top_indices = np.argsort(similarities)[::-1][:k]

    results = []
    seen_resumes = set()

    for idx in top_indices:
        if idx < len(_chunk_texts):
            chunk = _chunk_texts[idx]
            metadata = _chunk_metadata[idx]

            resume_name = metadata.get("resume_name", "Unknown")
            if resume_name not in seen_resumes:
                results.append(f"[Candidate: {resume_name}]\n{chunk}")
                seen_resumes.add(resume_name)
            else:
                results.append(chunk)

    print(f"🔍 Vector search: '{query[:50]}...' → {len(results)} chunks (top sim: {similarities[top_indices[0]]:.3f})")
    return results


def get_index_stats() -> Dict:
    """Get statistics about the current vector index."""
    if _embeddings_matrix is None:
        status = "building" if _is_building else "not_initialized"
        return {"status": status, "chunks": 0, "resumes": 0}

    unique_resumes = len(set(m.get("resume_name") for m in _chunk_metadata))
    status = "building" if _is_building else "ready"
    return {
        "status": status,
        "chunks": len(_chunk_texts),
        "resumes": unique_resumes,
        "cache_hash": _cache_hash[:8] if _cache_hash else None
    }


def debug_faiss():
    """Print debug info about vector index."""
    stats = get_index_stats()
    print(f"📊 Vector Index Stats: {stats}")
    if _chunk_texts:
        print(f"   Sample chunk: {_chunk_texts[0][:100]}...")
