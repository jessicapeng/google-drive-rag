from typing import Any

from openai import OpenAI

from ..db import db_cursor
from .ingest import vector_to_literal
from .openai_client import get_openai_client

TOP_K = 5
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4.1-mini"


def search_top_chunks(question: str) -> list[dict[str, Any]]:
    """Embed the question and fetch the nearest matching chunks from Postgres."""
    client: OpenAI = get_openai_client()
    embedding_response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=question,
    )
    query_embedding = vector_to_literal(embedding_response.data[0].embedding)

    with db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                dc.id,
                dc.chunk_index,
                dc.content,
                d.filename AS file_name,
                dc.embedding <=> %s::vector AS distance
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            ORDER BY dc.embedding <=> %s::vector
            LIMIT %s
            """,
            (query_embedding, query_embedding, TOP_K),
        )
        rows = cursor.fetchall()

    return [dict(row) for row in rows]


def build_answer(question: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    """Answer only from the retrieved chunks that were already selected for context."""
    client: OpenAI = get_openai_client()

    context = "\n\n".join(
        f"Source: {chunk['file_name']}\nChunk #{chunk['chunk_index']}\n{chunk['content']}"
        for chunk in chunks
    )

    if not context:
        return {"answer": "I could not find an answer in the retrieved context.", "sources": []}

    response = client.responses.create(
        model=CHAT_MODEL,
        input=[
            {
                "role": "system",
                "content": (
                    "You answer only using the provided context. "
                    "If the answer is not present in the context, say you could not find it."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nContext:\n{context}",
            },
        ],
    )
    answer = response.output_text.strip()

    sources = [
        {
            "file_name": chunk["file_name"],
            "chunk_index": chunk["chunk_index"],
            "excerpt": chunk["content"][:180],
        }
        for chunk in chunks
    ]

    return {"answer": answer, "sources": sources}
