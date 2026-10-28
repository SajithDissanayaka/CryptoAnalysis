from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.services.market_service import market_overview

router = APIRouter(prefix="/api/v1/market", tags=["Market"], dependencies=[Depends(get_current_user)])


@router.get("/overview")
def overview():
    try:
        return market_overview()
    except (ValueError, KeyError, TypeError):
        raise HTTPException(status_code=503, detail="Market data is unavailable. Please retry shortly.") from None
