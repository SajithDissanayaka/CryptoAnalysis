from fastapi import APIRouter, FastAPI
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "enviroment": settings.APP_ENV
    }