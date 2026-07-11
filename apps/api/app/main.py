from fastapi import FastAPI, HTTPException

from .schemas import ChatRequest, ChatResponse, IngestResponse
from .services.ingest import ingest_local_documents
from .services.retrieval import build_answer, search_top_chunks

app = FastAPI(title="Google Drive RAG API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness check for the service."""
    return {"status": "ok"}


@app.post("/ingest/local", response_model=IngestResponse)
def ingest_local() -> IngestResponse:
    """Read the local sample documents, create embeddings, and store them."""
    try:
        result = ingest_local_documents()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return IngestResponse(**result)


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Embed the user question, retrieve the top chunks, and answer from context."""
    try:
        chunks = search_top_chunks(request.question)
        answer = build_answer(request.question, chunks)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(**answer)
