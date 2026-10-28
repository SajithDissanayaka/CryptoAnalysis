# Setup and architecture

## Configuration

Use `backend/.env.example` and `frontend/.env.example` as references. Existing `.env` files are preserved by this update. The backend loads its `.env` from the backend directory independently of the process working directory.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL using `postgresql+psycopg://...`, or SQLite. Omitting it creates `backend/cryptomind.db`. |
| `JWT_SECRET_KEY` | Private random signing secret. Required in production. Without one, development uses a new secret each process start, so old sessions expire on restart. |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Positive session lifetime; defaults to 60 minutes. |
| `CORS_ORIGINS` | Comma-separated frontend origins. Localhost and 127.0.0.1 on port 5173 are enabled by default. |
| `OLLAMA_HOST` | Local model server; defaults to `http://localhost:11434`. |
| `AGENT_MODEL` | Model with tool-calling support; defaults to `qwen3:1.7b`. |
| `CHAT_MODEL` | Structured analysis model; defaults to `gemma3:1b`. |
| `RAG_CHAT_MODEL` | Optional override for document-answer generation. |
| `EMBEDDING_MODEL` | Defaults to `nomic-embed-text`; storage expects 768 dimensions. |
| `COINGECKO_DEMO_API_KEY` | Optional provider key. Public endpoints are used without one; provider limits still apply. |
| `VITE_API_URL` | Frontend API address; defaults to `http://127.0.0.1:8000`. Rebuild after changing it. |

Generate a signing secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and store it only in your backend environment.

## Storage

Startup creates missing user and research tables. It adds `owner_id` and `content_hash` to existing research metadata without reassigning or deleting old documents. Unowned legacy documents stay inaccessible until an administrator explicitly assigns their ownership.

New PostgreSQL research tables use pgvector if the extension is available and can be enabled. Otherwise they store JSON-encoded vectors as text and compute cosine similarity in Python. SQLite uses the same portable search. Existing table types are preserved across restarts; installing pgvector later does not silently convert stored embeddings.

Portable search scans the current user's matching chunks. For large libraries, use pgvector and a deliberate storage migration. `backend/sql/rag_schema.sql` describes a fresh pgvector-backed schema and requires the vector extension; ordinary local startup does not require that script.

Uploads are indexed atomically after embeddings are generated. A SHA-256 content hash prevents duplicate uploads within an account. A revised file with the same name creates another document. Limits are 5 MB, 30 PDF pages, 40,000 extracted characters, and 50 chunks. TXT files must be UTF-8. Scanned PDFs without a text layer need OCR before upload.

PostgreSQL connections use UTC. SQLite dates are interpreted as UTC by the interface.

## Request flow

The browser shares a single API client for authentication, errors, timeouts, and bearer headers. Tokens use the `cryptomind_access_token` browser-storage key. A 401 clears the token and returns protected pages to sign-in. A canceled or stale session-restore request cannot restore an account after logout.

Private endpoints authenticate on the server. Research queries always filter by the authenticated user's ID. The agent's research tool captures that identity in a server-created closure, so the model cannot choose another account's ID.

The tool agent allows at most four model calls and six tool calls per request. It reports empty answers, unavailable models, and execution limits as service errors. Each UI question starts an independent analysis; the on-screen transcript is not persisted conversation memory.

Market overview requests use CoinGecko, a 45-second backend cache, and 60-second browser refreshes. Prices are rejected if nonfinite, nonpositive, too far in the future, or more than 15 minutes old. Price tools enforce a five-minute freshness window. Daily indicators use 100 Binance Spot candles, discard the incomplete candle, and require at least 34 completed closes for MACD. Signed and zero MACD values are valid EMA inputs.

## Routes

| Page | Purpose |
| --- | --- |
| `/explore` | Public demo overview with illustrative data. |
| `/explore/ai`, `/explore/research` | Demo previews; generating answers and indexing files require sign-in. |
| `/login` | Sign-in and account creation. |
| `/dashboard` | Authenticated market overview. |
| `/dashboard/ai` | Authenticated research agent. |
| `/dashboard/research` | Private document library. |

API routes are documented interactively at `/docs`. `/health` reports database connectivity. The API can still start in a degraded state if the configured database is offline, and database-dependent requests return a readable 503.

## Troubleshooting

- **`ModuleNotFoundError: No module named 'app'`:** `app` lives in `backend`. From the repository root, run `.\start-backend.ps1`. For a manual launch, run `cd backend` followed by `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`. Activating the virtual environment does not change your working directory.
- **Cannot reach CryptoMind:** start Uvicorn on port 8000 and verify `VITE_API_URL` and `CORS_ORIGINS`.
- **Database unavailable:** check the configured database URL, server availability, credentials, and table permissions. A fresh local setup can omit the URL to use SQLite.
- **Agent unavailable:** run Ollama at the configured host and install an agent model that supports tool calls.
- **Embeddings unavailable:** install `nomic-embed-text` in that Ollama instance. Changing to a model with another dimension requires a storage migration.
- **Market data unavailable:** retry after provider throttling expires, or configure the optional CoinGecko key. Demo mode remains available independently.
- **Backend connection succeeds but requests fail:** verify that the frontend and backend agree on the same origin, scheme, and port.

Typography is bundled locally through Fontsource, with system-font fallbacks. The interface does not need to contact a font CDN.

## Validation boundaries

The automated suite covers authentication, CORS, malformed and expired tokens, inactive users, document ownership, uploads and deletion, embedding failures, deduplication, numeric indicators, provider validation, caching, agent execution limits, desktop/mobile navigation, CSV export, and UI error recovery.

Backend regressions run against temporary SQLite storage. Browser scenarios mock API responses to make the checks repeatable. They do not prove the quality of a model's natural-language answers, provider uptime, or a pgvector installation. Real model generation requires a running Ollama service and the configured model files.
