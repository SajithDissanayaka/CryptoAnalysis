# CryptoMind AI

A cryptocurrency research workspace built with React, TypeScript, FastAPI, SQLAlchemy, Ollama, and LangGraph.

The interface combines charcoal surfaces, mint accents, editorial typography, original orbital graphics, and responsive charts. Explore the labeled demo without an account, then sign in for market data and private research.

## Run locally

Requirements: Python 3.11+, Node 20.19+ or 22.12+, and npm. PostgreSQL is optional for a fresh local setup.

If the backend virtual environment is already installed, start it directly from the project root:

```powershell
.\start-backend.ps1
```

This launcher selects `backend/.venv`, resolves the application path, and watches only backend files. It also works when invoked by absolute path from another directory. Use `-Port 8001` to select another port or `-NoReload` to disable reload.

For a fresh setup, open a backend terminal from the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Keep your existing .env if you already have one.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Visit **http://localhost:5173**. The default page is an explicitly labeled demo. Create an account from **Sign in** to use the private workspace. API documentation is at **http://127.0.0.1:8000/docs**.

See [the setup and architecture guide](docs/SETUP.md) for model configuration, storage options, and troubleshooting.

## Features

- BTC, ETH, and SOL overview with provider timestamps and 24-hour / seven-day price charts.
- Search, persistent browser watchlists, asset filters, and CSV export.
- Registration, login, protected routes, session restoration, expiry handling, and logout.
- AI research with bounded tool execution for prices, daily RSI/MACD, and private documents.
- PDF/TXT upload, semantic search, cited answers, document lists, content deduplication, and deletion.
- User isolation on research operations, including agent tools.
- PostgreSQL with optional pgvector; portable cosine search works without the extension. SQLite is the default when DATABASE_URL is absent.
- Loading, empty, cancellation, retry, and service-error states.

Demo prices are illustrative. Failed live requests never substitute demo values.

## AI models

Install and run Ollama separately, then download the configured models:

```powershell
ollama pull qwen3:1.7b
ollama pull gemma3:1b
ollama pull nomic-embed-text
ollama serve
```

If the Ollama desktop application already serves port 11434, another serve process is unnecessary. Models and the host can be changed in `backend/.env`. Research embeddings currently require 768 dimensions.

## Verification

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m pip check
```

From `frontend`:

```powershell
npm run build
npm run lint
npm run test:e2e
```

Browser tests use the installed Microsoft Edge browser by default. Alternatively, install Chromium with `npx playwright install chromium` and set `$env:PLAYWRIGHT_CHANNEL='chromium'` before testing. Backend regressions use temporary SQLite storage and mocked provider/model calls; browser tests mock API responses. Manual `backend/test_*.py` examples execute only when run directly.

## Preview

[Desktop overview](docs/screenshots/overview-desktop.png) · [Sign-in](docs/screenshots/signin-desktop.png) · [Mobile AI studio](docs/screenshots/studio-mobile.png)

Created by Saji.
