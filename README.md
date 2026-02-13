# PDF Upload AI App (QABot)

PDF upload + RAG Q&A app. Structure follows **ydkjs-with-rag**; PDF logic is from the original qabot (local embeddings + Ollama/HF fallback).

## Structure

- **server/** — FastAPI backend: PDF upload, embed, RAG, streaming `/ask`
- **client/** — Next.js frontend: single page with upload + chat (neomorphic UI)

---

## Run with Docker (recommended)

From the **qabot** directory (where `docker-compose.yml` lives):

```bash
# Build and start both server and client
docker compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:8000  

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

To rebuild after code changes:

```bash
docker compose up --build
```

---

## Run without Docker

### 1. Backend (from `server/`)

```bash
cd server
pip install -r requirements.txt
uvicorn entry:app --reload --host 0.0.0.0 --port 8000
```

Must run from inside `server/` so `configs` and `module` resolve.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` if the API is elsewhere.

### 3. Optional: Ollama

For best answers, run Ollama and pull a model:

```bash
ollama pull llama3.2
```

Without Ollama, the app falls back to a small Hugging Face model (CPU).

---

## API

- `GET /` — Health
- `POST /upload` — `multipart/form-data` with `file` (PDF)
- `POST /ask` — JSON `{ "data": { "question": "..." } }` → streaming text/plain

## Plan

See `PLAN.md` for analysis and tree-of-thought decisions.
