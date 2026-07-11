# Google Drive RAG App

This repository is the Milestone 1 implementation of a small RAG demo.

## Architecture

The project uses a simple monorepo split:

- `apps/mobile` contains the Expo + React Native app.
- `apps/api` contains the FastAPI backend.
- The backend reads local sample text files, creates embeddings, stores them in Supabase/Postgres with pgvector, and answers questions using retrieved context.

## Milestone 1 goal

Prove that retrieval-augmented generation works with local text files only.

Google Drive, OAuth, users, and streaming are intentionally not implemented yet.

## Repository structure

```text
google-drive-rag/
├── apps/
│   ├── mobile/
│   └── api/
├── README.md
├── .gitignore
└── .env.example
```

## How ingestion works

1. The FastAPI backend scans `apps/api/sample_documents` for `.txt` files.
2. Each file is split into short character chunks.
3. Each chunk is embedded with the OpenAI embeddings API.
4. The document and chunk rows are inserted into Supabase Postgres using the `vector` extension.

## How retrieval works

1. The mobile app sends a question to `POST /chat`.
2. The FastAPI backend embeds the question.
3. The backend queries the vector store for the top 5 nearest chunks.
4. Those chunks are passed back into the OpenAI Responses API as context.
5. The model must answer only from the retrieved context.

## Backend setup

```bash
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file from `.env.example` and set:

- `OPENAI_API_KEY`
- `DATABASE_URL`

Then run:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Mobile setup

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npm start
```

The Expo app contains:

- a Home screen with an indexing action and a chat entry button
- a Chat screen with message history, source cards, and a simple send flow

## Supabase / pgvector setup

1. Create a Supabase Postgres project.
2. Enable the `vector` extension.
3. Run the SQL migration in `apps/api/migrations/001_create_tables.sql`.
4. Point `DATABASE_URL` at the Supabase Postgres connection string.

## Notes

- The frontend never calls OpenAI directly.
- No API keys are exposed to the client.
- This is intentionally a beginner-friendly implementation with small files and clear responsibilities.
