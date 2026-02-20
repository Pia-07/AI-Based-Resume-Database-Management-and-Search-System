"""
Model Manager — Singleton for SentenceTransformer.

Loads the model exactly ONCE and exposes it to embedding_service
and intent_service. This halves RAM usage (~400 MB saved) and
eliminates duplicate cold-start time.
"""

from sentence_transformers import SentenceTransformer, util
import numpy as np
from typing import List, Union
import threading


class ModelManager:
    """Thread-safe singleton that owns the SentenceTransformer model."""

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
        print("⏳ ModelManager: Loading SentenceTransformer('all-MiniLM-L6-v2')...")
        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            cache_folder="./models",
        )
        self._initialized = True
        print("✅ ModelManager: SentenceTransformer loaded successfully")

    # --- public API ---

    def encode(
        self,
        sentences: Union[str, List[str]],
        convert_to_numpy: bool = True,
        convert_to_tensor: bool = False,
        show_progress_bar: bool = False,
    ):
        """Encode one or more sentences. Pass-through to the underlying model."""
        return self.model.encode(
            sentences,
            convert_to_numpy=convert_to_numpy,
            convert_to_tensor=convert_to_tensor,
            show_progress_bar=show_progress_bar,
        )

    @staticmethod
    def cos_sim(a, b):
        """Cosine similarity helper (delegates to sentence_transformers.util)."""
        return util.cos_sim(a, b)


# Module-level singleton — imported by other services
model_manager = ModelManager()
