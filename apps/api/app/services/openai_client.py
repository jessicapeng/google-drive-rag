from openai import OpenAI

from ..config import settings


def get_openai_client() -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for embeddings and chat.")

    return OpenAI(api_key=settings.openai_api_key)
