"""
Chroma config for PDF RAG. We use in-memory collections created per upload
in module/document/rag.py (no persistent client at startup).
"""
COLLECTION_NAME = "qabot_pdf"
