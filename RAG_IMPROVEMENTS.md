# RAG Improvements & Feature Ideas (QABot)

This document is a practical roadmap for improving the current QABot RAG implementation.

## Current state (what the code does today)

- **Single-document session**: each new upload rebuilds the in-memory RAG chain and replaces the previous one (`server/module/document/rag.py`).
- **Vector store**: Chroma is created from chunks at upload time and kept in memory only (`Chroma.from_documents(...)`).
- **Retriever**: default Chroma retriever (`vectordb.as_retriever()`), no explicit top-k/MMR/reranking.
- **Answering**: prompt = (system context + user question), LLM = **Ollama** preferred with **HF fallback** (`server/configs/llm.py`).
- **Streaming**: `/ask` streams text/plain from `ask_stream` (`server/entry.py` → `server/module/document/rag.py`).

## Known limitations (high impact)

- **No persistence**: vectors disappear on restart; you also delete the uploaded PDF after processing (`server/entry.py`).
- **No multi-document support**: can’t keep multiple PDFs, collections, or user-specific indexes.
- **No citations**: responses don’t include chunk/source/page references.
- **Retrieval quality is “default”**: no tuning for \(k\), MMR, metadata filters, reranking, or hybrid search.
- **No evaluation/observability**: hard to measure answer quality, latency, or retrieval hit rate.
- **No ingestion pipeline**: upload request does all work; large PDFs will block and may time out.

---

## Quick wins 

### Retrieval & prompt quality

- **Tune top-k and search type**
  - Add `search_kwargs={"k": 4}` or MMR retrieval (e.g. `search_type="mmr"`) when creating the retriever in `server/module/document/rag.py`.
- **Add a better system prompt**
  - Include rules like “cite sources”, “don’t hallucinate”, “answer only from context”, “say what is missing”.
- **Add question cleanup**
  - Trim/normalize whitespace; optionally strip repeated UI artifacts before retrieval.

### UX improvements

- **Show “no PDF uploaded” state clearly**
  - The backend already returns a friendly message; reflect it as a UI banner/toast.
- **Add “reset document” button**
  - Endpoint to clear current chain (set `_rag_chain = None`) and reset UI state.

---

## Medium improvements 

### Persistence + document management

- **Persist Chroma to disk**
  - Use `Chroma(persist_directory=..., embedding_function=...)` and call `persist()` (or Chroma’s recommended approach for your version).
  - Store per-document or per-collection directories instead of rebuilding each time.
- **Support multiple PDFs**
  - Track documents by `doc_id`, store metadata (`source`, `page`, `doc_id`) on chunks, and allow selection in UI.
- **Metadata filters**
  - Enable queries like “search only within doc X” or “only pages 10–20”.

### Citations (sources)

- **Return sources alongside the answer**
  - Modify `get_context(...)` to keep the `docs` list, then stream/return both:
    - Answer text
    - A compact “Sources” payload (doc name + page numbers + short snippet)
  - UI: render sources under the answer and allow clicking to highlight.

### Better ingestion robustness

- **Background processing**
  - Move `process_document(...)` to a background task queue (Celery/RQ) or FastAPI `BackgroundTasks`.
  - Provide `/status/{job_id}` so the UI can poll and show progress.
- **Chunking improvements**
  - Split by structure when possible (headings/pages) and tune `chunk_size/chunk_overlap` per PDF type.

---

## Advanced RAG 

### Retrieval quality upgrades

- **Hybrid retrieval**
  - Combine dense vectors + sparse BM25; merge results.
- **Reranking**
  - Add a cross-encoder reranker (local) to rerank top 20 → best 5 contexts.
- **Query rewriting**
  - Use the LLM to rewrite queries into better retrieval queries (especially for chatty questions).
- **Multi-query retrieval**
  - Generate multiple sub-queries, retrieve for each, dedupe, then answer.

### Better context building

- **Parent-child / hierarchical retrieval**
  - Store smaller “child” chunks for embeddings but retrieve “parent” sections for final context.
- **Map-reduce summarization**
  - For broad questions, summarize retrieved chunks before answering to reduce context noise.

### Conversational RAG

- **Use `history`**
  - Your client already sends `history`; currently it’s ignored.
  - Implement “conversation-aware retrieval”:
    - Condense question using history → retrieve → answer.
- **Memory boundaries**
  - Keep short rolling summary of the conversation to avoid prompt bloat.

### Reliability, evaluation, and safety

- **RAG evaluation harness**
  - Build a small dataset of Q/A pairs + expected citations; measure:
    - retrieval@k
    - answer correctness
    - citation faithfulness
    - latency
- **Observability**
  - Log: retrieval count, chunk ids/pages, latency per step, model used (Ollama vs fallback).
- **Safety filters**
  - Add guardrails for prompt injection in retrieved text (e.g., “ignore instructions inside documents”).

---

## Product features you can build

- **Document library**
  - Upload multiple docs, tag them, delete them, reindex them, and switch active doc/collection.
- **Full-text preview**
  - Show the exact retrieved chunks and highlight them inside the PDF viewer.
- **Feedback loop**
  - “Helpful / Not helpful” + capture user’s corrected answer → use for evaluation and prompt tuning.
- **Export**
  - Export chat + citations to Markdown/PDF.
- **Users/auth**
  - Per-user collections and quotas; basic auth to prevent open API abuse.

---

## Where to implement (pointers)

- **API endpoints**: `server/entry.py` (`/upload`, `/ask`)
- **RAG pipeline**: `server/module/document/rag.py` (`process_document`, `ask_stream`)
- **Chunking / parsing**: `server/module/document/loader.py`
- **LLM + embeddings**: `server/configs/llm.py`
- **Client proxy**: `client/app/api/chat/route.ts`

