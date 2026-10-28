import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import analysis, auth, health, rag, agent, market
from app.core.config import settings
from app.db.database import engine
from app.db.models import Base
from app.repositories.rag_repository import initialize_rag_schema

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        app.state.database_ready = True
        try:
            initialize_rag_schema()
        except SQLAlchemyError:
            logger.exception("Research storage initialization failed. Check database permissions.")
    except SQLAlchemyError:
        logger.exception("Database initialization failed; check DATABASE_URL and database availability.")
        app.state.database_ready = False
    yield
    engine.dispose()


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, error: SQLAlchemyError):
    logger.error("Database request failed: %s", type(error).__name__)
    return JSONResponse(status_code=503, content={"detail": "The database is unavailable. Check the backend database configuration."})


for router in (health.router, auth.router, analysis.router, rag.router, agent.router, market.router):
    app.include_router(router)
