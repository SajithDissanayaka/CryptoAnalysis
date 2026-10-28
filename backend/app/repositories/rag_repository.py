"""User-scoped storage with optional pgvector and a portable cosine-search fallback."""
import hashlib
import json
from math import isfinite, sqrt

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.db.database import engine
from app.services.embedding_service import generate_embedding, EMBEDDING_MODEL

EMBEDDING_DIMENSIONS = 768
_uses_pgvector: bool | None = None


def uses_pgvector() -> bool:
    global _uses_pgvector
    if _uses_pgvector is None:
        if engine.dialect.name != "postgresql":
            _uses_pgvector = False
        else:
            with engine.connect() as connection:
                column_type = connection.execute(text("""
                    SELECT udt_name FROM information_schema.columns
                    WHERE table_schema=current_schema() AND table_name='rag_chunks' AND column_name='embedding'
                """)).scalar_one_or_none()
            _uses_pgvector = column_type == "vector"
    return _uses_pgvector


def validate_embedding(vector: list[float]) -> None:
    if len(vector) != EMBEDDING_DIMENSIONS or not all(isfinite(v) for v in vector):
        raise ValueError(f"Expected {EMBEDDING_DIMENSIONS} finite embedding dimensions.")
    if not any(vector):
        raise ValueError("Embedding must not be a zero vector.")


def vector_to_text(vector: list[float]) -> str:
    validate_embedding(vector)
    return json.dumps(vector, allow_nan=False)


def initialize_rag_schema() -> None:
    global _uses_pgvector
    postgres = engine.dialect.name == "postgresql"
    identity = "BIGSERIAL PRIMARY KEY" if postgres else "INTEGER PRIMARY KEY"
    with engine.begin() as connection:
        vector_enabled = False
        if postgres:
            column_type = connection.execute(text("""
                SELECT udt_name FROM information_schema.columns
                WHERE table_schema=current_schema() AND table_name='rag_chunks' AND column_name='embedding'
            """)).scalar_one_or_none()
            if column_type:
                vector_enabled = column_type == "vector"
            else:
                available = connection.execute(text("SELECT 1 FROM pg_available_extensions WHERE name='vector'")).scalar()
                if available:
                    try:
                        with connection.begin_nested():
                            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                        vector_enabled = True
                    except SQLAlchemyError:
                        # Text vectors keep research usable without extension installation privileges.
                        vector_enabled = False
        vector_type = "VECTOR(768)" if vector_enabled else "TEXT"
        connection.execute(text(f"""
            CREATE TABLE IF NOT EXISTS rag_documents (
                id {identity}, title VARCHAR(255) NOT NULL, source VARCHAR(500),
                owner_id INTEGER REFERENCES users(id), content_hash VARCHAR(64),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))
        connection.execute(text(f"""
            CREATE TABLE IF NOT EXISTS rag_chunks (
                id {identity}, document_id BIGINT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
                chunk_index INTEGER NOT NULL, content TEXT NOT NULL,
                embedding {vector_type} NOT NULL, embedding_model VARCHAR(100) NOT NULL,
                UNIQUE(document_id, chunk_index)
            )
        """))
        # Existing unowned documents stay unassigned and invisible to all accounts.
        if postgres:
            connection.execute(text("ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)"))
            connection.execute(text("ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_rag_owner ON rag_documents(owner_id)"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_owner_hash ON rag_documents(owner_id, content_hash)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id)"))
        if vector_enabled:
            connection.execute(text("CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks USING hnsw (embedding vector_cosine_ops)"))
    _uses_pgvector = vector_enabled


def save_chunks(title: str, source: str, content: str, chunks: list[str], owner_id: int) -> dict:
    if not owner_id:
        raise ValueError("An authenticated document owner is required.")
    fingerprint = hashlib.sha256(content.encode("utf-8")).hexdigest()
    with engine.connect() as connection:
        existing = connection.execute(text(
            "SELECT id, title FROM rag_documents WHERE owner_id=:owner AND content_hash=:hash"
        ), {"owner": owner_id, "hash": fingerprint}).mappings().first()
    if existing:
        return {"status": "already_exists", "document_id": existing["id"], "title": existing["title"],
                "message": "This document is already in your library."}

    try:
        vectors = [vector_to_text(generate_embedding(chunk)) for chunk in chunks]
    except ValueError as error:
        raise RuntimeError("The embedding service returned an invalid vector.") from error
    embedding_param = "CAST(:embedding AS vector)" if uses_pgvector() else ":embedding"
    try:
        with engine.begin() as connection:
            document_id = connection.execute(text("""
                INSERT INTO rag_documents (title, source, owner_id, content_hash)
                VALUES (:title, :source, :owner, :hash) RETURNING id
            """), {"title": title, "source": source, "owner": owner_id, "hash": fingerprint}).scalar_one()
            for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
                connection.execute(text(f"""
                    INSERT INTO rag_chunks (document_id, chunk_index, content, embedding, embedding_model)
                    VALUES (:id, :index, :content, {embedding_param}, :model)
                """), {"id": document_id, "index": index, "content": chunk, "embedding": vector, "model": EMBEDDING_MODEL})
    except IntegrityError:
        # Another upload may have committed the same document while embeddings were generated.
        with engine.connect() as connection:
            duplicate = connection.execute(text(
                "SELECT id, title FROM rag_documents WHERE owner_id=:owner AND content_hash=:hash"
            ), {"owner": owner_id, "hash": fingerprint}).mappings().first()
        if duplicate is None:
            raise
        return {"status": "already_exists", "document_id": duplicate["id"], "title": duplicate["title"],
                "message": "This document is already in your library."}
    return {"status": "success", "document_id": document_id, "title": title, "chunks_saved": len(chunks)}


def save_document(title: str, source: str, content: str, owner_id: int) -> dict:
    from app.services.rag_ingestion_service import ingest_document
    return ingest_document(title, source, content, owner_id=owner_id)


def search_similar_documents(query: str, top_k: int = 3, owner_id: int | None = None) -> list[dict]:
    if not query.strip() or len(query) > 1000:
        raise ValueError("Search query must contain 1 to 1000 characters.")
    if not 1 <= top_k <= 20:
        raise ValueError("top_k must be between 1 and 20.")
    if not owner_id:
        raise ValueError("An authenticated document owner is required.")
    # Empty libraries do not need the embedding service.
    with engine.connect() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM rag_documents WHERE owner_id=:owner"),
                                   {"owner": owner_id}).scalar_one()
    if not count:
        return []
    vector = generate_embedding(query)
    vector_text = vector_to_text(vector)
    base = """
        SELECT c.id AS chunk_id, c.document_id, d.title, d.source, c.content,
    """
    with engine.connect() as connection:
        if uses_pgvector():
            rows = connection.execute(text(base + """
                1 - (c.embedding <=> CAST(:vector AS vector)) AS similarity
                FROM rag_chunks c JOIN rag_documents d ON d.id=c.document_id
                WHERE d.owner_id=:owner AND c.embedding_model=:model
                ORDER BY c.embedding <=> CAST(:vector AS vector) LIMIT :limit
            """), {"vector": vector_text, "owner": owner_id, "model": EMBEDDING_MODEL, "limit": top_k}).mappings().all()
            results = [dict(row) for row in rows]
        else:
            rows = connection.execute(text(base + """
                c.embedding FROM rag_chunks c JOIN rag_documents d ON d.id=c.document_id
                WHERE d.owner_id=:owner AND c.embedding_model=:model
            """), {"owner": owner_id, "model": EMBEDDING_MODEL}).mappings().all()
            results = []
            magnitude = sqrt(sum(v * v for v in vector))
            for row in rows:
                item = dict(row)
                stored = json.loads(item.pop("embedding"))
                validate_embedding(stored)
                similarity = sum(a*b for a, b in zip(vector, stored)) / (magnitude * sqrt(sum(v*v for v in stored)))
                results.append({**item, "similarity": similarity})
            results.sort(key=lambda item: item["similarity"], reverse=True)
    return [{**item, "similarity": round(float(item["similarity"]), 4)} for item in results[:top_k]]


def list_documents(owner_id: int) -> list[dict]:
    with engine.connect() as connection:
        rows = connection.execute(text("""
            SELECT d.id AS document_id, d.title, d.source, d.created_at, COUNT(c.id) AS chunks_saved
            FROM rag_documents d LEFT JOIN rag_chunks c ON c.document_id=d.id
            WHERE d.owner_id=:owner
            GROUP BY d.id, d.title, d.source, d.created_at ORDER BY d.id DESC
        """), {"owner": owner_id}).mappings().all()
    return [dict(row) for row in rows]


def delete_document(document_id: int, owner_id: int) -> bool:
    with engine.begin() as connection:
        owned = connection.execute(text("SELECT id FROM rag_documents WHERE id=:id AND owner_id=:owner"),
                                   {"id": document_id, "owner": owner_id}).scalar_one_or_none()
        if owned is None:
            return False
        connection.execute(text("DELETE FROM rag_chunks WHERE document_id=:id"), {"id": document_id})
        connection.execute(text("DELETE FROM rag_documents WHERE id=:id AND owner_id=:owner"),
                           {"id": document_id, "owner": owner_id})
    return True
