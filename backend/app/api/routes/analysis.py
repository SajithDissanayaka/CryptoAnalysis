from http.client import HTTPException

from fastapi import APIRouter
from pydantic import ValidationError

from app.schemas.analysis import (AnalysisResponse, AnalysisRequest, MarketAnalysis)

from app.services.analysis_service import analyze_crypto
from app.schemas.analysis import LLMAnalysisResponse
from backend.app.services.llm_service import generate_crypto_analysis
from ollama import ResponseError, RequestError
from app.services.reliable_llm import (generate_reliable_analysis,LLMUnavailableError,)


router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.post("/crypto", 
             response_model=AnalysisResponse,)

def analyze_crypto_route(request: AnalysisRequest):
    result = analyze_crypto(request.symbol)

    return result

@router.post("/llm", response_model=LLMAnalysisResponse,)

@router.post(
    "/llm",
    response_model=MarketAnalysis,
)
def analyze_with_llm(request: AnalysisRequest):

    try:
        return generate_reliable_analysis(request.symbol)

    except ValidationError:
        raise HTTPException(
            status_code=502,
            detail="LLM returned an invalid structured response.",
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="LLM returned an empty or invalid response.",
        )

    except LLMUnavailableError:
        raise HTTPException(
            status_code=503,
            detail="AI analysis is temporarily unavailable.",
    )

    except (ResponseError, RequestError, ConnectionError, TimeoutError):
        raise HTTPException(
            status_code=503,
            detail="Local LLM is unavailable.",
        )