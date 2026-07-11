from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)


class IngestResponse(BaseModel):
    documents_ingested: int
    chunks_ingested: int


class SourceResponse(BaseModel):
    file_name: str
    chunk_index: int
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceResponse]
