from datetime import datetime, timezone

import httpx
from pydantic import BaseModel, Field, model_validator


BASE_URL = "https://data-api.binance.vision"

SUPPORTED_PAIRS = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
}


class DailyCandle(BaseModel):
    model_config = {"allow_inf_nan": False}
    open_time: datetime
    close_time: datetime

    open: float = Field(gt=0)
    high: float = Field(gt=0)
    low: float = Field(gt=0)
    close: float = Field(gt=0)
    volume: float = Field(ge=0)

    @model_validator(mode="after")
    def validate_ohlc(self):
        if self.close_time <= self.open_time:
            raise ValueError("Invalid candle timestamps")
        if self.high < max(self.open, self.close, self.low):
            raise ValueError("Invalid candle high")

        if self.low > min(self.open, self.close, self.high):
            raise ValueError("Invalid candle low")

        return self


def get_daily_candles(
    symbol: str,
    limit: int = 100,
) -> dict:

    symbol = symbol.strip().upper()

    if symbol not in SUPPORTED_PAIRS:
        return {
            "status": "error",
            "message": "Unsupported symbol",
        }

    if not 35 <= limit <= 500:
        return {
            "status": "error",
            "message": "Limit must be between 35 and 500",
        }

    pair = SUPPORTED_PAIRS[symbol]

    try:
        response = httpx.get(
            f"{BASE_URL}/api/v3/klines",
            params={
                "symbol": pair,
                "interval": "1d",
                "limit": limit,
            },
            timeout=15.0,
        )

        response.raise_for_status()

        raw_candles = response.json()

        if not isinstance(raw_candles, list):
            raise ValueError("Invalid API response")

        candles = []

        now_ms = int(
            datetime.now(timezone.utc).timestamp() * 1000
        )

        for item in raw_candles:
            # Skip incomplete daily candles.
            if int(item[6]) >= now_ms:
                continue

            candle = DailyCandle(
                open_time=datetime.fromtimestamp(
                    int(item[0]) / 1000,
                    tz=timezone.utc,
                ),
                open=float(item[1]),
                high=float(item[2]),
                low=float(item[3]),
                close=float(item[4]),
                volume=float(item[5]),
                close_time=datetime.fromtimestamp(
                    int(item[6]) / 1000,
                    tz=timezone.utc,
                ),
            )

            candles.append(candle)

        return {
            "status": "success",
            "symbol": symbol,
            "pair": pair,
            "source": "Binance Spot",
            "interval": "1d",
            "candles": [
                candle.model_dump(mode="json")
                for candle in candles
            ],
            "count": len(candles),
        }

    except (httpx.HTTPError, ValueError, TypeError, IndexError, OverflowError):
        return {
            "status": "error",
            "symbol": symbol,
            "message": "Unable to retrieve valid daily candles",
        }
