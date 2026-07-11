from pathlib import Path

from openai import OpenAI
from psycopg.rows import dict_row

from ..config import settings
from ..db import db_connection
from .openai_client import get_openai_client

# Milestone 1 uses a local folder as a stand-in for Google Drive.
SAMPLE_DOCUMENTS_DIR = Path(__file__).resolve().parents[2] / "sample_documents"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 80
EMBEDDING_MODEL = "text-embedding-3-small"


def chunk_text(text: str) -> list[str]:
    """Keep chunking deliberately simple with a character-based splitter."""
    cleaned = text.strip()
    if not cleaned:
        return []

    if len(cleaned) <= CHUNK_SIZE:
        return [cleaned]

    chunks: list[str] = []
    start = 0

    while start < len(cleaned):
        end = start + CHUNK_SIZE
        fragment = cleaned[start:end].strip()
        if fragment:
            chunks.append(fragment)

        if end >= len(cleaned):
            break

        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


def load_documents() -> list[tuple[str, str]]:
    files = sorted(SAMPLE_DOCUMENTS_DIR.glob("*.txt"))
    documents: list[tuple[str, str]] = []

    for file_path in files:
        documents.append((file_path.name, file_path.read_text(encoding="utf-8")))

    return documents


def vector_to_literal(values: list[float]) -> str:
    return "[" + ",".join(str(value) for value in values) + "]"


def ingest_local_documents() -> dict[str, int]:
    documents = load_documents()
    if not documents:
        return {"documents_ingested": 0, "chunks_ingested": 0}

    client: OpenAI = get_openai_client()
    documents_ingested = 0
    chunks_ingested = 0

    with db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            for file_name, body in documents:
                chunks = chunk_text(body)
                if not chunks:
                    continue

                response = client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=chunks,
                )
                embeddings = [item.embedding for item in response.data]

                cursor.execute(
                    "INSERT INTO documents (filename) VALUES (%s) RETURNING id",
                    (file_name,),
                )
                record = cursor.fetchone()
                if record is None:
                    raise RuntimeError("Failed to create a document row.")

                document_id = record["id"]

                for chunk_index, (chunk_text, embedding) in enumerate(
                    zip(chunks, embeddings, strict=True),
                    start=1,
                ):
                    cursor.execute(
                        """
                        INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
                        VALUES (%s, %s, %s, %s::vector)
                        """,
                        (document_id, chunk_index, chunk_text, vector_to_literal(embedding)),
                    )

                documents_ingested += 1
                chunks_ingested += len(chunks)

    return {
        "documents_ingested": documents_ingested,
        "chunks_ingested": chunks_ingested,
    }
