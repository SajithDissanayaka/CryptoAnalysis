import os
from math import isfinite
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

from app.tools.market_tools import COIN_IDS, BASE_URL


load_dotenv()


def get_historical_prices(
    symbol: str,
    days: int = 30,
) -> dict:

    symbol = symbol.strip().upper()

    if symbol not in COIN_IDS:
        return {
            "status": "error",
            "message": "Unsupported cryptocurrency symbol.",
        }

    if days < 1 or days > 365:
        return {
            "status": "error",
            "message": "days must be between 1 and 365.",
        }

    api_key = os.getenv("COINGECKO_DEMO_API_KEY")

    coin_id = COIN_IDS[symbol]

    try:
        response = httpx.get(
            f"{BASE_URL}/coins/{coin_id}/market_chart",
            headers={"x-cg-demo-api-key": api_key} if api_key else {},
            params={
                "vs_currency": "usd",
                "days": days,
            },
            timeout=15.0,
        )

        response.raise_for_status()

        data = response.json()

        raw_prices = data["prices"]

        prices = [
            {
                "timestamp": datetime.fromtimestamp(
                    timestamp_ms / 1000,
                    tz=timezone.utc,
                ).isoformat(),
                "price": float(price),
            }
            for timestamp_ms, price in raw_prices
        ]

        if not prices or any(not isfinite(point["price"]) or point["price"] <= 0 for point in prices):
            raise ValueError("Invalid historical price data.")

        return {
            "status": "success",
            "symbol": symbol,
            "source": "CoinGecko",
            "prices": prices,
            "count": len(prices),
        }

    except (httpx.HTTPError, KeyError, TypeError, ValueError, OverflowError):
        return {
            "status": "error",
            "symbol": symbol,
            "message": "Unable to retrieve historical prices.",
        }
