# API App

This is the FastAPI backend for Milestone 1.

## Endpoints

- `GET /health`
- `POST /ingest/local`
- `POST /chat`

## Run locally

```bash
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment

Create a `.env` file based on the root `.env.example`.

You need:

- `OPENAI_API_KEY`
- `DATABASE_URL`

## Local ingestion

The backend reads all `.txt` files from `apps/api/sample_documents` and stores them in Supabase using `pgvector`.
