"""
FastAPI entry for PDF RAG: upload PDF, ask questions (streaming).
"""
import os
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import StreamingResponse
from pydantic import BaseModel

from module.document.rag import process_document, ask_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="QABot PDF RAG")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskData(BaseModel):
    question: str
    history: list[str] = []


class AskBody(BaseModel):
    data: AskData


@app.get("/")
def root():
    return {"message": "QABot PDF RAG API. POST /upload to upload a PDF, POST /ask to ask questions."}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=400,
            content={"ok": False, "error": "Please upload a PDF file (.pdf)."},
        )
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    path = os.path.join(upload_dir, file.filename)
    try:
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        process_document(path)
        return {"ok": True, "message": "PDF processed. You can now ask questions about it."}
    except Exception as e:
        logger.exception("Upload failed")
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(e)},
        )
    finally:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass


@app.post("/ask")
def ask_endpoint(body: AskBody):
    question = (body.data and body.data.question) or ""
    return StreamingResponse(
        ask_stream(question),
        media_type="text/plain",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
