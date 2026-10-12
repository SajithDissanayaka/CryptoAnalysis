from app.schemas.analysis import AnalysisResponse

def analyze_crypto(symbol : str) -> AnalysisResponse:
    return AnalysisResponse(
        symbol=symbol.upper(),
        summary="This is mock market analysis",
        market_signal="unknown",
        risk_level="unknown",
        disclaimer="Education purpose only. Not financial advice"
    )