from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.database import engine

router = APIRouter()


@router.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database = "connected"
    except SQLAlchemyError:
        database = "unavailable"
    return {"status": "ok" if database == "connected" else "degraded",
            "service": settings.APP_NAME, "environment": settings.APP_ENV, "database": database}
