from app.tools.candle_tools import get_daily_candles
from app.tools.indicator_tools import calculate_rsi, calculate_macd


def analyze_indicators(symbol: str) -> dict:
    historical = get_daily_candles(symbol=symbol, limit=100)
    if historical["status"] != "success":
        return historical
    candles = historical["candles"]
    if len(candles) < 34:
        return {"status": "insufficient_data", "symbol": symbol, "available_days": len(candles),
                "required_days": 34, "message": "At least 34 completed daily candles are needed for MACD."}
    prices = [candle["close"] for candle in candles]
    rsi = calculate_rsi(prices)
    return {
        "status": "success", "symbol": symbol.upper(), "pair": historical["pair"],
        "source": historical["source"], "timeframe": "1d", "observations": len(prices),
        "latest_close": prices[-1], "latest_candle_time": candles[-1]["close_time"],
        "latest_completed_day": candles[-1]["close_time"][:10],
        "rsi": rsi, "rsi_14": rsi, "macd": calculate_macd(prices),
    }
