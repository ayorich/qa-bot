"""
LLM and embeddings for PDF RAG (qabot-style: local, no API keys).
- Embeddings: sentence-transformers (HuggingFaceEmbeddings)
- LLM: Ollama with HuggingFace pipeline fallback
"""
import logging
import os

logger = logging.getLogger(__name__)

# Embeddings: local sentence-transformers
def get_embedder():
    from langchain_community.embeddings import HuggingFaceEmbeddings
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )

# Lazy init to avoid loading at import time
_embedder = None

def get_embeddings():
    global _embedder
    if _embedder is None:
        _embedder = get_embedder()
    return _embedder


def get_llm():
    """Ollama if available, else HuggingFace flan-t5-small (CPU)."""
    try:
        from langchain_community.llms import Ollama
        # If running in Docker, OLLAMA_HOST can point to host.docker.internal
        base_url = os.getenv("OLLAMA_HOST")
        ollama_kwargs = {
            "model": "llama3.2",
            "temperature": 0.5,
            "num_predict": 256,
        }
        if base_url:
            ollama_kwargs["base_url"] = base_url
        return Ollama(**ollama_kwargs)
    except Exception:
        pass
    import transformers
    from langchain_community.llms import HuggingFacePipeline
    pipe = transformers.pipeline(
        "text2text-generation",
        model="google/flan-t5-small",
        max_new_tokens=256,
        device=-1,
    )
    return HuggingFacePipeline(pipeline=pipe)


_llm = None

def get_chat_llm():
    """LLM for RAG answers (singleton)."""
    global _llm
    if _llm is None:
        _llm = get_llm()
    return _llm
