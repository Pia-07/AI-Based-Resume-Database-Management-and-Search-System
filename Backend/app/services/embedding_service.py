import faiss
import numpy as np
import hashlib
from typing import List, Dict, Optional

from .model_manager import model_manager

# In-memory FAISS store with caching
_chunk_texts: List[str] = []
_chunk_metadata: List[Dict] = []  # Track which resume each chunk belongs to
_faiss_index: Optional[faiss.IndexFlatL2] = None
_cache_hash: Optional[str] = None  # Hash of resume data for cache invalidation


def _compute_cache_hash(resumes: List[Dict]) -> str:
    """Compute a hash of resume data to detect changes."""
    content = "".join(sorted([r.get("raw_text", "")[:100] for r in resumes]))
    return hashlib.md5(content.encode()).hexdigest()


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks for better semantic search.
    
    Args:
        text: The raw text to chunk
        chunk_size: Target size of each chunk in characters
        overlap: Number of characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if not text or len(text.strip()) == 0:
        return []
    
    text = text.strip()
    
    # If text is smaller than chunk size, return as single chunk
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Get chunk
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary if possible
        if end < len(text):
            # Look for sentence endings in the last 100 chars of the chunk
            last_period = chunk.rfind('. ')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            
            if break_point > chunk_size // 2:  # Only if we found a good break point
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1
        
        if chunk.strip():
            chunks.append(chunk.strip())
        
        # Move start forward, accounting for overlap
        start = end - overlap if end < len(text) else len(text)
    
    return chunks


def build_vector_store(resumes: List[Dict], force_rebuild: bool = False) -> bool:
    """
    Build / rebuild FAISS index from resumes with intelligent chunking.
    Uses caching to avoid rebuilding on every request.
    
    Args:
        resumes: List of resume documents with 'raw_text' field
        force_rebuild: If True, rebuild even if cache is valid
    
    Returns:
        True if index was rebuilt, False if cache was used
    """
    global _chunk_texts, _chunk_metadata, _faiss_index, _cache_hash

    if not resumes:
        _chunk_texts = []
        _chunk_metadata = []
        _faiss_index = None
        _cache_hash = None
        print("⚠️ No resumes found to index")
        return False

    # Check if we can use cached index
    new_hash = _compute_cache_hash(resumes)
    if not force_rebuild and _cache_hash == new_hash and _faiss_index is not None:
        print(f"✅ Using cached FAISS index ({_faiss_index.ntotal} chunks)")
        return False

    # Build new index with chunking
    print(f"🔄 Building FAISS index from {len(resumes)} resumes...")
    
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
        _faiss_index = None
        _cache_hash = None
        return False

    # Create embeddings
    print(f"📐 Creating embeddings for {len(_chunk_texts)} chunks...")
    embeddings = model_manager.encode(
        _chunk_texts,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype("float32")

    # Build FAISS index
    dim = embeddings.shape[1]
    _faiss_index = faiss.IndexFlatL2(dim)
    _faiss_index.add(embeddings)
    
    _cache_hash = new_hash

    print(f"✅ FAISS index built: {_faiss_index.ntotal} chunks from {len(resumes)} resumes")
    print(f"📐 Embedding dimension: {dim}")
    
    return True


def search_similar(query: str, k: int = 10) -> List[str]:
    """
    Search top-k similar chunks and return context.
    
    Args:
        query: Search query
        k: Number of chunks to return
    
    Returns:
        List of relevant text chunks
    """
    if _faiss_index is None or _faiss_index.ntotal == 0:
        print("❌ FAISS index empty or not initialized")
        return []

    # Create query embedding
    query_vec = model_manager.encode(
        [query],
        convert_to_numpy=True,
    ).astype("float32")

    # Search
    k = min(k, _faiss_index.ntotal)
    distances, indices = _faiss_index.search(query_vec, k)

    results = []
    seen_resumes = set()  # Track which resumes we've included
    
    for idx, distance in zip(indices[0], distances[0]):
        if idx < len(_chunk_texts) and idx >= 0:
            chunk = _chunk_texts[idx]
            metadata = _chunk_metadata[idx]
            
            # Add resume context header for first chunk from each resume
            resume_name = metadata.get("resume_name", "Unknown")
            if resume_name not in seen_resumes:
                results.append(f"[Candidate: {resume_name}]\n{chunk}")
                seen_resumes.add(resume_name)
            else:
                results.append(chunk)

    print(f"🔍 FAISS search: '{query[:50]}...' → {len(results)} chunks (distance range: {distances[0][0]:.2f} - {distances[0][-1]:.2f})")
    return results


def get_index_stats() -> Dict:
    """Get statistics about the current FAISS index."""
    if _faiss_index is None:
        return {"status": "not_initialized", "chunks": 0, "resumes": 0}
    
    unique_resumes = len(set(m.get("resume_name") for m in _chunk_metadata))
    return {
        "status": "ready",
        "chunks": _faiss_index.ntotal,
        "resumes": unique_resumes,
        "cache_hash": _cache_hash[:8] if _cache_hash else None
    }


def debug_faiss():
    """Print debug info about FAISS index."""
    stats = get_index_stats()
    print(f"📊 FAISS Index Stats: {stats}")
    if _chunk_texts:
        print(f"   Sample chunk: {_chunk_texts[0][:100]}...")
