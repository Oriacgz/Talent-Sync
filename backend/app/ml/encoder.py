# WHO WRITES THIS: ML developer
# WHAT THIS DOES: Loads SBERT model (all-MiniLM-L6-v2) once on startup.
#                 encode_text() — converts text to 384-dim numpy vector.
#                 encode_batch() — batch encodes multiple texts efficiently.
#                 In-memory cache keyed by md5(text) to avoid re-encoding.
# DEPENDS ON: sentence-transformers, numpy, config.py

import numpy as np

def load_model():
    pass  # TODO: load SentenceTransformer(settings.SBERT_MODEL_NAME)

def encode_text(text: str) -> np.ndarray:
    pass  # TODO: encode with cache

def encode_batch(texts: list) -> np.ndarray:
    pass  # TODO: batch encode