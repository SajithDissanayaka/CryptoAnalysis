import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError


load_dotenv()

BASE_URL = "https://api.coingecko.com/api/v3"

COIN_IDS = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
}


class MarketPrice(BaseModel):
    model_config = {"allow_inf_nan": False}
    symbol: str
    price_usd: float = Field(gt=0)
    change_24h_percent: float | None = None
    last_updated_at: datetime
    source: str = "CoinGecko"


def get_crypto_price(symbol: str) -> dict:
    """Get the latest available USD market price for BTC, ETH or SOL."""

    symbol = symbol.strip().upper()

    if symbol not in COIN_IDS:
        return {
            "status": "error",
            "message": f"Unsupported symbol: {symbol}",
        }

    api_key = os.getenv("COINGECKO_DEMO_API_KEY")

    coin_id = COIN_IDS[symbol]

    try:
        response = httpx.get(
            f"{BASE_URL}/simple/price",
            headers={"x-cg-demo-api-key": api_key} if api_key else {},
            params={
                "ids": coin_id,
                "vs_currencies": "usd",
                "include_24hr_change": "true",
                "include_last_updated_at": "true",
            },
            timeout=10.0,
        )

        response.raise_for_status()

        data = response.json()
        coin_data = data[coin_id]

        market_price = MarketPrice(
            symbol=symbol,
            price_usd=coin_data["usd"],
            change_24h_percent=coin_data.get("usd_24h_change"),
            last_updated_at=datetime.fromtimestamp(
                coin_data["last_updated_at"],
                tz=timezone.utc,
            ),
        )

        age_seconds = (
            datetime.now(timezone.utc)
            - market_price.last_updated_at
        ).total_seconds()

        if age_seconds < -60 or age_seconds > 300:
            return {
                "status": "stale_data",
                "symbol": symbol,
                "message": "Market data timestamp is outside the allowed freshness window.",
            }

        return {
            "status": "success",
            **market_price.model_dump(mode="json"),
        }

    except (httpx.HTTPError, KeyError, TypeError, ValueError, OverflowError, ValidationError):
        return {
            "status": "error",
            "symbol": symbol,
            "message": "Unable to retrieve valid market data.",
        }
