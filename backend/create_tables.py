from app.db.database import engine
from app.db.models import Base
from app.repositories.rag_repository import initialize_rag_schema, uses_pgvector


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    initialize_rag_schema()
    print("Database tables ready. Research storage:", "pgvector" if uses_pgvector() else "portable vectors")
