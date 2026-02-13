"""
RAG chain for uploaded PDF: load, split, embed, retrieve, answer.
State: single in-memory retriever + chain (replaced on each new upload).
"""
import logging
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

from configs.llm import get_embeddings, get_chat_llm
from module.document.loader import document_loader, text_splitter

logger = logging.getLogger(__name__)

_rag_chain = None


def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def process_document(document_path: str) -> None:
    """Load PDF, split, embed into Chroma, build RAG chain (in-memory)."""
    global _rag_chain

    logger.info("Loading document from path: %s", document_path)
    documents = document_loader(document_path)
    chunks = text_splitter(documents)
    embedding_model = get_embeddings()
    vectordb = Chroma.from_documents(chunks, embedding_model)
    retriever = vectordb.as_retriever()

    llm = get_chat_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Use the following context to answer the question. If you don't know the answer, say so.\n\nContext:\n{context}"),
        ("human", "{input}"),
    ])

    def get_context(x):
        docs = retriever.invoke(x["input"])
        return {"context": _format_docs(docs), "input": x["input"]}

    _rag_chain = (
        RunnableLambda(get_context)
        | prompt
        | llm
        | StrOutputParser()
    )
    logger.info("RAG chain created successfully.")


def ask(question: str) -> str:
    """Non-streaming answer. Returns error message if no PDF loaded."""
    global _rag_chain
    if _rag_chain is None:
        return "Please upload a PDF file first so I can answer questions about it."
    question = (question or "").strip()
    if not question:
        return "Please enter a question."
    try:
        return _rag_chain.invoke({"input": question})
    except Exception as e:
        err = str(e).lower()
        if "ollama" in err or "connection" in err:
            return (
                "Ollama is not running or not installed. "
                "Install from https://ollama.com and run: ollama pull llama3.2"
            )
        return f"Error: {e}"


def ask_stream(question: str):
    """Stream answer chunks. Yields error message as single chunk if no PDF."""
    global _rag_chain
    if _rag_chain is None:
        yield "Please upload a PDF file first so I can answer questions about it."
        return
    question = (question or "").strip()
    if not question:
        yield "Please enter a question."
        return
    try:
        for chunk in _rag_chain.stream({"input": question}):
            yield chunk
    except Exception as e:
        err = str(e).lower()
        if "ollama" in err or "connection" in err:
            yield "Ollama is not running or not installed. Install from https://ollama.com and run: ollama pull llama3.2"
        else:
            yield f"Error: {e}"
