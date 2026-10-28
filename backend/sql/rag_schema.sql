
-- CryptoMind AI RAG schema
-- Execute against the existing crypto_mind database.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    source VARCHAR(500),
    owner_id INTEGER REFERENCES users(id),
    content_hash VARCHAR(64),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL
        REFERENCES rag_documents(id)
        ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,

    embedding VECTOR(768) NOT NULL,

    embedding_model VARCHAR(100) NOT NULL
        DEFAULT 'nomic-embed-text',

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT uq_rag_document_chunk
        UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id
ON rag_chunks(document_id);

ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_rag_owner ON rag_documents(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_owner_hash ON rag_documents(owner_id, content_hash);

-- Approximate nearest-neighbor search index.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
ON rag_chunks
USING hnsw (embedding vector_cosine_ops);
