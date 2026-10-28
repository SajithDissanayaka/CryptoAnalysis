from app.schemas.analysis import AnalysisResponse
from app.services.indicator_service import analyze_indicators


def analyze_crypto(symbol: str) -> AnalysisResponse:
    evidence = analyze_indicators(symbol)
    if evidence["status"] != "success":
        return AnalysisResponse(symbol=symbol.upper(), summary=evidence.get("message", "Market data is unavailable."),
                                market_signal="unknown", risk_level="unknown",
                                disclaimer="Educational research only. Not financial advice.")
    rsi, macd = evidence["rsi_14"], evidence["macd"]
    return AnalysisResponse(
        symbol=symbol.upper(),
        summary=f"Daily RSI is {rsi}. MACD histogram is {macd['histogram']} ({macd['momentum']} momentum). "
                f"Source: {evidence['source']}; last completed candle: {evidence['latest_candle_time']}.",
        market_signal=macd["momentum"],
        risk_level="high" if rsi >= 70 or rsi <= 30 else "unknown",
        disclaimer="Indicators describe historical prices and cannot guarantee future returns.",
    )
