"""Offline regressions: isolated SQLite database, no Ollama or market requests."""
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

_directory = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + _directory.name.replace("\\", "/") + "/test.db"
os.environ["JWT_SECRET_KEY"] = "integration-test-secret-for-this-process-only"
os.environ["APP_ENV"] = "test"

import jwt
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from sqlalchemy import text

from app.main import app
from app.core.config import settings
from app.core.security import verify_password
from app.db.database import engine
from app.tools.indicator_tools import calculate_rsi, calculate_ema, calculate_macd
from app.services.indicator_service import analyze_indicators
from app.agents.crypto_graph import build_context
from app.agents.tool_agent_graph import run_crypto_tool_agent
from app.repositories.rag_repository import validate_embedding
from app.tools.rag_agent_tool import create_knowledge_tool


def vector(_):
    return [1.0] + [0.0] * 767


class APIRegressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context = TestClient(app)
        cls.client = cls.context.__enter__()
        cls.users = []
        for index in range(2):
            data = {"email": f"researcher{index}@example.com", "username": f"researcher{index}", "password": "CorrectPassword123"}
            result = cls.client.post("/auth/register", json=data)
            assert result.status_code == 201, result.text
            token = cls.client.post("/auth/login", json={"email": data["email"], "password": data["password"]}).json()["access_token"]
            cls.users.append({"id": result.json()["id"], "headers": {"Authorization": f"Bearer {token}"}})
        cls.headers, cls.other = [user["headers"] for user in cls.users]

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)
        engine.dispose()
        _directory.cleanup()

    def setUp(self):
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM rag_chunks"))
            connection.execute(text("DELETE FROM rag_documents"))

    def upload(self, content=b"Bitcoin is a decentralized network.", name="research.txt"):
        with patch("app.repositories.rag_repository.generate_embedding", side_effect=vector):
            return self.client.post("/api/v1/rag/upload", headers=self.headers, files={"file": (name, content, "text/plain")})

    def test_health_and_openapi(self):
        self.assertEqual(self.client.get("/health").json()["database"], "connected")
        schema = self.client.get("/openapi.json").json()
        self.assertEqual(list(schema["paths"]["/analysis/llm"]), ["post"])

    def test_profile_and_email_normalization(self):
        result = self.client.get("/auth/me", headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertNotIn("password_hash", result.json())
        self.assertEqual(self.client.post("/auth/login", json={"email": "RESEARCHER0@EXAMPLE.COM", "password": "CorrectPassword123"}).status_code, 200)

    def test_duplicate_registration(self):
        result = self.client.post("/auth/register", json={"email": "researcher0@example.com", "username": "another", "password": "CorrectPassword123"})
        self.assertEqual(result.status_code, 409)

    def test_auth_validation(self):
        result = self.client.post("/auth/register", json={"email": "bad", "username": "x", "password": "123"})
        self.assertEqual(result.status_code, 422)
        self.assertEqual(self.client.post("/auth/login", json={"email": "researcher0@example.com", "password": "wrong"}).status_code, 401)

    def test_inactive_account(self):
        with engine.begin() as connection:
            connection.execute(text("UPDATE users SET is_active=false WHERE id=:id"), {"id": self.users[1]["id"]})
        try:
            self.assertEqual(self.client.get("/auth/me", headers=self.other).status_code, 403)
            self.assertEqual(self.client.post("/auth/login", json={"email": "researcher1@example.com", "password": "CorrectPassword123"}).status_code, 403)
        finally:
            with engine.begin() as connection:
                connection.execute(text("UPDATE users SET is_active=true WHERE id=:id"), {"id": self.users[1]["id"]})

    def test_token_subjects_and_expiry(self):
        for subject, expiration in [("not-an-int", 30), ("-1", 30), ("1", -1)]:
            token = jwt.encode({"sub": subject, "exp": datetime.now(timezone.utc) + timedelta(minutes=expiration)}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
            self.assertEqual(self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)
        self.assertEqual(self.client.get("/auth/me", headers={"Authorization": "Bearer corrupted"}).status_code, 401)

    def test_private_endpoints(self):
        for method, path, body in [
            ("get", "/api/v1/rag/documents", None), ("get", "/api/v1/market/overview", None),
            ("post", "/api/v1/agent/analyze", {"question": "BTC price"}),
            ("post", "/api/v1/rag/search", {"query": "BTC"}),
            ("post", "/analysis/crypto", {"symbol": "BTC"}),
        ]:
            result = getattr(self.client, method)(path, **({"json": body} if body else {}))
            self.assertEqual(result.status_code, 401, path)

    def test_cors(self):
        result = self.client.options("/auth/login", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
        self.assertEqual(result.headers.get("access-control-allow-origin"), "http://localhost:5173")
        refused = self.client.options("/auth/login", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "POST"})
        self.assertNotIn("access-control-allow-origin", refused.headers)

    def test_document_isolation_search_and_delete(self):
        result = self.upload()
        self.assertEqual(result.status_code, 200, result.text)
        document_id = result.json()["document_id"]
        self.assertEqual(len(self.client.get("/api/v1/rag/documents", headers=self.headers).json()["documents"]), 1)
        self.assertEqual(self.client.get("/api/v1/rag/documents", headers=self.other).json()["documents"], [])
        with patch("app.repositories.rag_repository.generate_embedding", side_effect=vector):
            own = self.client.post("/api/v1/rag/search", headers=self.headers, json={"query": "Bitcoin"})
            other = self.client.post("/api/v1/rag/search", headers=self.other, json={"query": "Bitcoin"})
            self.assertEqual(len(own.json()["results"]), 1)
            self.assertEqual(other.json()["results"], [])
            import json
            private = json.loads(create_knowledge_tool(self.users[1]["id"]).invoke({"query": "Bitcoin"}))
            self.assertEqual(private["results"], [])
        self.assertEqual(self.client.delete(f"/api/v1/rag/documents/{document_id}", headers=self.other).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/v1/rag/documents/{document_id}", headers=self.headers).status_code, 204)
        self.assertEqual(self.client.get("/api/v1/rag/documents", headers=self.headers).json()["documents"], [])

    def test_duplicate_and_revised_content(self):
        first = self.upload()
        duplicate = self.upload(name="copy.txt")
        revised = self.upload(content=b"A different perspective on Ethereum.")
        self.assertEqual(duplicate.json()["status"], "already_exists")
        self.assertEqual(duplicate.json()["document_id"], first.json()["document_id"])
        self.assertNotEqual(revised.json()["document_id"], first.json()["document_id"])

    def test_concurrent_duplicate_uploads(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        ready = Barrier(2)
        def embedding(content):
            ready.wait(timeout=5)
            return vector(content)
        def upload(_):
            return self.client.post("/api/v1/rag/upload", headers=self.headers,
                                    files={"file": ("same.txt", b"Concurrent research document.", "text/plain")})
        with patch("app.repositories.rag_repository.generate_embedding", side_effect=embedding):
            with ThreadPoolExecutor(max_workers=2) as executor:
                results = list(executor.map(upload, range(2)))
        self.assertEqual([r.status_code for r in results], [200, 200])
        self.assertEqual({r.json()["status"] for r in results}, {"success", "already_exists"})
        self.assertEqual(len(self.client.get("/api/v1/rag/documents", headers=self.headers).json()["documents"]), 1)

    def test_file_validation(self):
        for name, content, status in [("script.exe", b"code", 400), ("empty.txt", b"", 400), ("broken.txt", b"\xff\xfe", 400), ("broken.pdf", b"not a PDF", 400), ("large.txt", b"x" * (5 * 1024 * 1024 + 1), 413)]:
            self.assertEqual(self.upload(content, name).status_code, status, name)

    def test_embedding_failure_is_atomic(self):
        with patch("app.repositories.rag_repository.generate_embedding", side_effect=ConnectionError("offline")):
            result = self.client.post("/api/v1/rag/upload", headers=self.headers, files={"file": ("a.txt", b"Bitcoin research", "text/plain")})
        self.assertEqual(result.status_code, 503)
        self.assertEqual(self.client.get("/api/v1/rag/documents", headers=self.headers).json()["documents"], [])

    def test_empty_library_avoids_model_call(self):
        with patch("app.repositories.rag_repository.generate_embedding", side_effect=AssertionError("Unexpected call")):
            result = self.client.post("/api/v1/rag/ask", headers=self.headers, json={"question": "Bitcoin?"})
        self.assertEqual(result.json()["status"], "no_evidence")

    def test_whitespace_validation(self):
        for path, body in [("/api/v1/agent/analyze", {"question": "   "}), ("/api/v1/rag/search", {"query": "   "}), ("/api/v1/rag/ask", {"question": "   "})]:
            self.assertEqual(self.client.post(path, headers=self.headers, json=body).status_code, 422)

    def test_agent_failure_status(self):
        with patch("app.api.routes.agent.run_crypto_tool_agent", return_value={"status": "error", "answer": "Model unavailable", "sources": [], "tools_used": []}):
            self.assertEqual(self.client.post("/api/v1/agent/analyze", headers=self.headers, json={"question": "BTC?"}).status_code, 503)

    def test_market_failure_status(self):
        with patch("app.api.routes.market.market_overview", side_effect=ValueError("bad upstream")):
            result = self.client.get("/api/v1/market/overview", headers=self.headers)
        self.assertEqual(result.status_code, 503)
        self.assertNotIn("bad upstream", result.text)

    def test_malformed_password_hash(self):
        self.assertFalse(verify_password("password", "not-a-valid-hash"))


class CalculationRegressions(unittest.TestCase):
    def test_market_validation_and_cache(self):
        from app.services.market_service import market_overview, _cache
        import httpx
        rows = [{"symbol": symbol, "name": symbol, "current_price": 100,
                 "last_updated": datetime.now(timezone.utc).isoformat(),
                 "market_cap": 1000, "total_volume": 100, "price_change_percentage_24h": 1,
                 "sparkline_in_7d": {"price": [99, 100]}}
                for symbol in ("BTC", "ETH", "SOL")]
        def response():
            return httpx.Response(200, json=rows, request=httpx.Request("GET", "https://test.example/market"))
        _cache.clear()
        with patch("app.services.market_service.httpx.get", side_effect=lambda *a, **k: response()) as get:
            self.assertEqual(len(market_overview()["assets"]), 3)
            market_overview()
            self.assertEqual(get.call_count, 1)
            _cache.clear()
            rows[0]["market_cap"] = -1
            with self.assertRaises(ValueError):
                market_overview()
            rows[0]["market_cap"] = 1000
            rows[0]["last_updated"] = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
            with self.assertRaises(ValueError):
                market_overview()
        _cache.clear()

    def test_tool_fanout_is_bounded(self):
        model = SimpleNamespace(bind_tools=lambda tools: SimpleNamespace(invoke=lambda messages: AIMessage(content="", tool_calls=[{"name": "get_crypto_price", "args": {"symbol": "BTC"}, "id": f"call-{i}"} for i in range(7)])))
        with patch("app.agents.tool_agent_graph.ChatOllama", return_value=model), patch("app.tools.agent_tools.fetch_market_price") as fetch:
            result = run_crypto_tool_agent("Bitcoin price?")
        self.assertEqual(result["status"], "error")
        fetch.assert_not_called()

    def test_rsi_flat_rising_falling(self):
        self.assertEqual(calculate_rsi([10.] * 40), 50.)
        self.assertEqual(calculate_rsi(list(range(1, 61))), 100.)
        self.assertEqual(calculate_rsi(list(range(60, 0, -1))), 0.)

    def test_macd_signed_and_zero_values(self):
        self.assertLess(calculate_macd(list(range(60, 0, -1)))["macd"], 0)
        self.assertEqual(calculate_macd([10.] * 60)["histogram"], 0)
        self.assertTrue(all(v <= 0 for v in calculate_ema([-5., -3., -2., 0.], 2)))

    def test_invalid_indicator_data(self):
        for prices in [[], [float("nan")] * 40, [0.] * 40]:
            with self.assertRaises(ValueError):
                calculate_rsi(prices)
        with self.assertRaises(ValueError):
            calculate_macd([1., 2., 3.])
        with self.assertRaises(ValueError):
            validate_embedding([0.] * 768)

    def test_pipeline_graph_contract(self):
        candles = [{"close": float(100+i), "close_time": "2026-09-01T23:59:59+00:00"} for i in range(60)]
        with patch("app.services.indicator_service.get_daily_candles", return_value={"status": "success", "pair": "BTCUSDT", "source": "test", "candles": candles}):
            result = analyze_indicators("BTC")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["observations"], 60)
        self.assertEqual(build_context({"indicators": result})["error"], "")

    def test_agent_execution_bound(self):
        model = SimpleNamespace(bind_tools=lambda tools: SimpleNamespace(invoke=lambda messages: AIMessage(content="", tool_calls=[{"name": "get_crypto_price", "args": {"symbol": "BTC"}, "id": "call-price"}])))
        with patch("app.agents.tool_agent_graph.ChatOllama", return_value=model), patch("app.tools.agent_tools.fetch_market_price", return_value={"status": "error", "message": "offline"}):
            result = run_crypto_tool_agent("Bitcoin price?")
        self.assertEqual(result["status"], "error")
        self.assertIn("limit", result["answer"])

    def test_empty_model_answer(self):
        model = SimpleNamespace(bind_tools=lambda tools: SimpleNamespace(invoke=lambda messages: AIMessage(content="")))
        with patch("app.agents.tool_agent_graph.ChatOllama", return_value=model):
            result = run_crypto_tool_agent("Explain Bitcoin.")
        self.assertEqual(result["status"], "error")


if __name__ == "__main__":
    unittest.main()
