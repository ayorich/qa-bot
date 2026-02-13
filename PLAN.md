# PDF Upload AI App – Plan (Tree of Thought)

## 1. Analysis

### 1.1 ydkjs-with-rag
- **Server**: FastAPI, Chroma (persistent), Ollama (embed + chat), book module (GitHub repo content, not PDF).
- **Client**: Next.js 15, Tailwind 4, shadcn, neomorphic UI, streaming chat.
- **No PDF**: Content comes from GitHub books; no upload flow.

### 1.2 qabot (current)
- **Server**: Flask, routes `/`, `/process-message`, `/process-document`.
- **worker.py**: PyPDFLoader, RecursiveCharacterTextSplitter, HuggingFaceEmbeddings, Chroma (in-memory), Ollama + HuggingFace fallback, LCEL RAG chain.
- **UI**: Static jQuery chat + PDF upload button in first message.

### 1.3 What to reuse
- **From qabot**: PDF load/split/embed/retrieve + RAG chain (worker logic only).
- **From ydkjs**: Folder structure (server configs + modules, client app), FastAPI entry, streaming ask, client layout and chat UI (stripped).

---

## 2. Intended structure

```
qabot/
├── server/
│   ├── configs/
│   │   ├── chroma_db.py   # Chroma client/collection (used after PDF load)
│   │   └── llm.py        # Embeddings + LLM (qabot: HF + Ollama fallback)
│   ├── module/
│   │   └── document/
│   │       ├── loader.py # PyPDFLoader, text_splitter
│   │       └── rag.py    # process_document, ask, ask_stream
│   ├── prompts/
│   │   └── doc_assistant.py
│   ├── entry.py         # FastAPI: /, POST /upload, POST /ask (streaming)
│   └── requirements.txt
├── client/              # Next.js, single page
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   └── api/chat/route.ts, api/upload/route.ts
│   ├── components/
│   │   ├── chat-interface.tsx  # Upload + chat, no book/chapter
│   │   └── ui/ (minimal)
│   └── package.json
├── worker.py            # Keep for reference or remove
├── server.py            # Deprecated; entry point is server/entry.py
└── static/              # Legacy; client/ is new UI
```

---

## 3. Tree of thought – evaluation

| Decision | Option A | Option B | Choice |
|----------|----------|----------|--------|
| Backend | Keep Flask | FastAPI (ydkjs-like) | **B** – match structure |
| Chroma | In-memory (current worker) | Persistent | **In-memory** – one PDF at a time, replace on upload |
| LLM/Embed | qabot (HF embed + Ollama/HF) | ydkjs (Ollama only) | **qabot** – no API keys, local |
| Client | jQuery static | Next.js (ydkjs-style) | **Next.js** – “follow ydkjs” UI |
| Routes | Library/Reader/Chat | Single page: Upload + Chat | **Single page** – strip unnecessary UI |
| Streaming | Non-streaming | Streaming /ask | **Streaming** – reuse ydkjs UX |

---

## 4. Risk mitigation (no errors)

- **Backend**: Validate PDF on upload (file type, size); try/except in process_document; return 400/500 with clear messages.
- **Client**: Handle “Please upload a PDF first” and upload failures; disable send until upload done (optional).
- **CORS**: FastAPI allow_origins for client origin.
- **Streaming**: Use LCEL `.stream()` in rag.py; ensure LLM supports streaming (Ollama does).
- **Import paths**: Run server from `qabot/server` or set PYTHONPATH so configs/module/prompts resolve.

---

## 5. Implementation order

1. server/configs (llm, chroma_db)
2. server/module/document (loader, rag)
3. server/prompts, server/entry.py
4. client (Next.js, one page, upload + chat, API routes)
5. Test and fix lints/run errors
