from fastapi import APIRouter, Depends, HTTPException
from ollama import ResponseError, RequestError
from pydantic import ValidationError

from app.api.dependencies import get_current_user
from app.schemas.analysis import AnalysisResponse, AnalysisRequest, MarketAnalysis
from app.services.analysis_service import analyze_crypto
from app.services.reliable_llm import generate_reliable_analysis, LLMUnavailableError

router = APIRouter(prefix="/analysis", tags=["Analysis"], dependencies=[Depends(get_current_user)])


@router.post("/crypto", response_model=AnalysisResponse)
def analyze_crypto_route(request: AnalysisRequest):
    return analyze_crypto(request.symbol)


@router.post("/llm", response_model=MarketAnalysis)
def analyze_with_llm(request: AnalysisRequest):
    try:
        return generate_reliable_analysis(request.symbol)
    except (ValidationError, ValueError):
        raise HTTPException(status_code=502, detail="The model returned an invalid response. Please retry.") from None
    except (LLMUnavailableError, ResponseError, RequestError, ConnectionError, TimeoutError):
        raise HTTPException(status_code=503, detail="AI analysis is unavailable. Check the configured Ollama service and model.") from None
