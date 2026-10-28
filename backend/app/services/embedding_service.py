
import os
from math import isfinite

from ollama import Client
from app.core.config import settings


OLLAMA_HOST = os.getenv(
    "OLLAMA_HOST",
    settings.OLLAMA_HOST,
)

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    settings.EMBEDDING_MODEL,
)


client = Client(
    host=OLLAMA_HOST,
    timeout=60,
)


def generate_embedding(text: str) -> list[float]:
    """
    Convert input text into a numerical embedding vector.

    This function will be used by our RAG pipeline.
    """

    # Step 1: Validate input
    if not isinstance(text, str):
        raise ValueError("Input must be a string.")

    cleaned_text = text.strip()

    if not cleaned_text:
        raise ValueError("Text cannot be empty.")

    # Step 2: Generate embedding using Ollama
    response = client.embed(
        model=EMBEDDING_MODEL,
        input=cleaned_text,
        truncate=False,
    )

    # Step 3: Extract vector
    embeddings = response.embeddings

    if not embeddings:
        raise RuntimeError(
            "Embedding model returned no vectors."
        )

    vector = list(embeddings[0])

    # Step 4: Validate numerical values
    if not vector:
        raise RuntimeError("Generated vector is empty.")

    if not all(isfinite(value) for value in vector):
        raise RuntimeError(
            "Generated vector contains invalid values."
        )

    return vector
