"""
Model Manager — Lightweight API-based embeddings for production.

Uses Google Gemini API for text embeddings instead of local SentenceTransformer.
This reduces RAM usage from ~800MB to under 50MB, enabling deployment on
Render's free tier (512MB limit).
"""

import os
import numpy as np
from typing import List, Union
import threading
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"


class ModelManager:
    """Thread-safe singleton that provides embeddings via Gemini API."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._api_key = GEMINI_API_KEY
        if not self._api_key:
            print("⚠️ ModelManager: GEMINI_API_KEY not set! Embeddings will fail.")
        else:
            print("✅ ModelManager: Using Gemini API for embeddings (lightweight mode)")
        self._initialized = True

    def _embed_single(self, text: str) -> List[float]:
        """Get embedding for a single text via Gemini API."""
        url = f"{GEMINI_EMBED_URL}?key={self._api_key}"
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text[:2048]}]}  # Gemini limit
        }
        try:
            resp = requests.post(url, json=payload, timeout=30)
            resp.raise_for_status()
            return resp.json()["embedding"]["values"]
        except Exception as e:
            print(f"⚠️ Gemini embedding error: {e}")
            return [0.0] * 768  # Return zero vector as fallback

    def encode(
        self,
        sentences: Union[str, List[str]],
        convert_to_numpy: bool = True,
        convert_to_tensor: bool = False,
        show_progress_bar: bool = False,
    ):
        """Encode one or more sentences using Gemini API."""
        if isinstance(sentences, str):
            sentences = [sentences]

        embeddings = []
        for sent in sentences:
            emb = self._embed_single(sent)
            embeddings.append(emb)

        result = np.array(embeddings, dtype="float32")

        if convert_to_tensor:
            # Return numpy array - callers use cos_sim which now handles numpy
            return result

        return result

    @staticmethod
    def cos_sim(a, b):
        """Cosine similarity using numpy (replaces sentence_transformers.util)."""
        if isinstance(a, np.ndarray) and isinstance(b, np.ndarray):
            # Normalize
            if a.ndim == 1:
                a = a.reshape(1, -1)
            if b.ndim == 1:
                b = b.reshape(1, -1)
            a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-8)
            b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-8)
            return np.dot(a_norm, b_norm.T)
        # Fallback
        return np.array([[0.0]])


# Module-level singleton — imported by other services
model_manager = ModelManager()
