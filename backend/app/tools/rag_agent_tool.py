import json
from langchain_core.tools import tool
from app.repositories.rag_repository import search_similar_documents


def create_knowledge_tool(owner_id: int | None):
    # Capture identity in a server-created closure; the LLM cannot supply another user's ID.
    @tool
    def search_crypto_knowledge(query: str) -> str:
        """Search the current user's uploaded research documents. Does not search live news."""
        if not owner_id:
            return json.dumps({"status": "error", "message": "Sign in to search your documents."})
        if not query.strip() or len(query) > 1000:
            return json.dumps({"status": "error", "message": "Query must contain 1 to 1000 characters."})
        try:
            results = search_similar_documents(query.strip(), top_k=3, owner_id=owner_id)
            return json.dumps({"status": "success" if results else "no_evidence", "results": results})
        except Exception:
            return json.dumps({"status": "error", "message": "Knowledge search is unavailable."})
    return search_crypto_knowledge


# Kept for local scripts; no account context means no private document access.
search_crypto_knowledge = create_knowledge_tool(None)
