"""Prompt for document Q&A (used if we switch to message-based LLM later)."""

def build_context_prompt(question: str, context: str) -> str:
    """Simple context + question for the RAG chain (string template)."""
    return f"""Use the following context to answer the question. If you don't know the answer, say so.

Context:
{context}

Question:
{question}
"""
