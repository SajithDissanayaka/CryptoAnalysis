import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


class Settings:
    APP_NAME = os.getenv("APP_NAME", "CryptoMind AI")
    APP_ENV = os.getenv("APP_ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{(BACKEND_ROOT / 'cryptomind.db').as_posix()}"
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(48)
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    CORS_ORIGINS = [origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()]
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    CHAT_MODEL = os.getenv("CHAT_MODEL", "gemma3:1b")
    AGENT_MODEL = os.getenv("AGENT_MODEL", "qwen3:1.7b")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

    def __init__(self):
        if self.APP_ENV == "production" and not os.getenv("JWT_SECRET_KEY"):
            raise ValueError("JWT_SECRET_KEY must be configured in production.")
        if self.JWT_ALGORITHM not in {"HS256", "HS384", "HS512"}:
            raise ValueError("JWT_ALGORITHM must be HS256, HS384 or HS512.")
        if self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES < 1:
            raise ValueError("Token lifetime must be positive.")


settings = Settings()
