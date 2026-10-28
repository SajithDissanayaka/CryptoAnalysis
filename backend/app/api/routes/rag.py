from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from ollama import ResponseError
from httpx import HTTPError
from pydantic import BaseModel, Field, field_validator

from app.api.dependencies import get_current_user
from app.db.models import User
from app.services.rag_ingestion_service import MAX_FILE_BYTES, extract_document_text, ingest_document
from app.repositories.rag_repository import search_similar_documents, list_documents, delete_document
from app.services.rag_answer_service import answer_with_rag

router = APIRouter(prefix="/api/v1/rag", tags=["Research"])


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def clean_query(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Query cannot be empty.")
        return value.strip()


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Question cannot be empty.")
        return value.strip()


@router.post("/upload")
def upload_document(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    filename = (file.filename or "").replace("\\", "/").rsplit("/", 1)[-1]
    try:
        if "." not in filename or filename.lower().rsplit(".", 1)[-1] not in {"pdf", "txt"}:
            raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")
        data = file.file.read(MAX_FILE_BYTES + 1)
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds the 5 MB limit.")
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        content = extract_document_text(filename, data)
        return ingest_document(title=filename, source=filename, content=content, owner_id=user.id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None
    except (ConnectionError, TimeoutError, ResponseError, RuntimeError, HTTPError):
        raise HTTPException(status_code=503, detail="Document embeddings are unavailable. Start Ollama and install nomic-embed-text.") from None
    finally:
        file.file.close()


@router.get("/documents")
def documents(user: User = Depends(get_current_user)):
    return {"documents": list_documents(user.id)}


@router.delete("/documents/{document_id}", status_code=204)
def remove_document(document_id: int, user: User = Depends(get_current_user)):
    if not delete_document(document_id, user.id):
        raise HTTPException(status_code=404, detail="Document not found.")


@router.post("/search")
def search_documents(request: SearchRequest, user: User = Depends(get_current_user)):
    try:
        results = search_similar_documents(request.query, request.top_k, owner_id=user.id)
        return {"status": "success", "query": request.query, "results": results}
    except (ConnectionError, TimeoutError, ResponseError, RuntimeError, HTTPError, ValueError):
        raise HTTPException(status_code=503, detail="The document embedding service is unavailable.") from None


@router.post("/ask")
def ask_rag(request: AskRequest, user: User = Depends(get_current_user)):
    try:
        result = answer_with_rag(request.question, request.top_k, owner_id=user.id)
    except (ConnectionError, TimeoutError, ResponseError, RuntimeError, HTTPError, ValueError):
        raise HTTPException(status_code=503, detail="The document embedding service is unavailable.") from None
    if result["status"] in {"error", "llm_unavailable"}:
        raise HTTPException(status_code=503, detail=result["answer"])
    return result
