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
            return np.zeros((len(sentences), 3072), dtype="float32")

        # --- Rate-limit-aware batching ---
        # Gemini free tier: 100 embed requests / minute / model.
        # We use small batches (each API call = 1 request regardless of
        # how many texts are in it) and pause to stay under the limit.
        batch_size = 100
        requests_this_window = 0
        MAX_REQUESTS_PER_WINDOW = 14  # Gemini free tier is 15 requests/min
        MAX_RETRIES = 3

        total_batches = (len(sentences) + batch_size - 1) // batch_size
        for batch_idx, i in enumerate(range(0, len(sentences), batch_size)):
            batch = sentences[i:i+batch_size]
            batch_texts = [text[:2048] for text in batch]

            # Pace requests: if we've used most of our per-minute quota, wait
            if requests_this_window >= MAX_REQUESTS_PER_WINDOW:
                print(f"   ⏳ Rate-limit pause — waiting 61s to reset quota ({batch_idx+1}/{total_batches} batches done)")
                time.sleep(61)
                requests_this_window = 0

            success = False
            for attempt in range(MAX_RETRIES):
                try:
                    response = self._client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=batch_texts
                    )
                    for emb in response.embeddings:
                        embeddings.append(emb.values)
                    requests_this_window += 1
                    success = True
                    break  # success — move to next batch
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        wait = min(30 * (2 ** attempt), 120)  # 30s, 60s, 120s
                        print(f"   ⏳ Rate limited (attempt {attempt+1}/{MAX_RETRIES}), waiting {wait}s...")
                        time.sleep(wait)
                        requests_this_window = 0  # assume quota resets after wait
                    else:
                        print(f"⚠️ Gemini embedding error: {e}")
                        break  # non-rate-limit error, don't retry

            if not success:
                print(f"   ⚠️ Batch {batch_idx+1} failed after retries, using zero vectors")
                for _ in batch:
                    embeddings.append([0.0] * 3072)

            # Small inter-batch delay to spread requests
            if i + batch_size < len(sentences):
                time.sleep(0.5)

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
