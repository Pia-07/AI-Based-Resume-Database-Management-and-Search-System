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
from google import genai
from google.genai import errors
import time

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

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
            self._client = None
        else:
            print("✅ ModelManager: Using Google GenAI SDK for embeddings (batch mode)")
            try:
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                print(f"⚠️ ModelManager client init error: {e}")
                self._client = None
        self._initialized = True

    def encode(
        self,
        sentences: Union[str, List[str]],
        convert_to_numpy: bool = True,
        convert_to_tensor: bool = False,
        show_progress_bar: bool = False,
    ):
        """Encode one or more sentences using Gemini API in batches."""
        if isinstance(sentences, str):
            sentences = [sentences]
            
        if not sentences:
            return np.array([[]], dtype="float32")

        embeddings = []
        
        if not self._client:
            print("⚠️ ModelManager: No client available, returning zeros.")
            return np.zeros((len(sentences), 768), dtype="float32")

        # Batch in chunks of 50 to avoid hitting rate limits or payload size limits
        batch_size = 50
        for i in range(0, len(sentences), batch_size):
            batch = sentences[i:i+batch_size]
            # Truncate each text to 2048 chars for safety
            batch_texts = [text[:2048] for text in batch]
            
            try:
                response = self._client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=batch_texts
                )
                
                for emb in response.embeddings:
                    embeddings.append(emb.values)
                    
                # Small sleep to be nice to the rate limits if there are many batches
                if i + batch_size < len(sentences):
                    time.sleep(1.0)
                    
            except Exception as e:
                print(f"⚠️ Gemini batch embedding error: {e}")
                # Fallback zero vectors for this batch
                for _ in batch:
                    embeddings.append([0.0] * 768)

        result = np.array(embeddings, dtype="float32")

        if convert_to_tensor:
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
