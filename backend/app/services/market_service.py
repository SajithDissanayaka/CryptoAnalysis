import os
import time
from datetime import datetime, timezone
from math import isfinite
from threading import Lock

import httpx

from app.tools.market_tools import BASE_URL, COIN_IDS

_cache: dict = {}
_lock = Lock()


def market_overview() -> dict:
    with _lock:
        if _cache and time.monotonic() - _cache["time"] < 45:
            return _cache["data"]
        key = os.getenv("COINGECKO_DEMO_API_KEY")
        try:
            response = httpx.get(
                f"{BASE_URL}/coins/markets",
                params={"vs_currency": "usd", "ids": ",".join(COIN_IDS.values()),
                        "order": "market_cap_desc", "sparkline": "true", "price_change_percentage": "24h,7d"},
                headers={"x-cg-demo-api-key": key} if key else {}, timeout=12,
            )
            response.raise_for_status()
            rows = response.json()
            if not isinstance(rows, list) or len(rows) != len(COIN_IDS):
                raise ValueError("Incomplete market response")
            assets = []
            for row in rows:
                if not isinstance(row, dict):
                    raise ValueError("Invalid market response")
                price = float(row["current_price"])
                updated = datetime.fromisoformat(row["last_updated"].replace("Z", "+00:00"))
                age = (datetime.now(timezone.utc) - updated).total_seconds()
                if not isfinite(price) or price <= 0 or age < -60 or age > 900:
                    raise ValueError("Invalid or stale price")
                history = row.get("sparkline_in_7d") or {}
                if not isinstance(history, dict):
                    raise ValueError("Invalid market history")
                sparkline = [float(v) for v in history.get("price", [])]
                if any(not isfinite(v) or v <= 0 for v in sparkline):
                    raise ValueError("Invalid price history")
                def number(field: str, nonnegative: bool = False) -> float | None:
                    value = row.get(field)
                    if value is None:
                        return None
                    value = float(value)
                    if not isfinite(value) or (nonnegative and value < 0):
                        raise ValueError("Invalid numeric market field")
                    return value

                assets.append({
                    "symbol": row["symbol"].upper(), "name": row["name"], "price": price,
                    "change": number("price_change_percentage_24h"),
                    "market_cap": number("market_cap", True), "volume": number("total_volume", True),
                    "high": number("high_24h", True), "low": number("low_24h", True),
                    "sparkline": sparkline, "updated_at": updated.isoformat(),
                })
            if {asset["symbol"] for asset in assets} != set(COIN_IDS):
                raise ValueError("Unexpected market assets")
            data = {"assets": assets, "source": "CoinGecko", "quote_currency": "USD",
                    "updated_at": min(a["updated_at"] for a in assets)}
        except (httpx.HTTPError, OverflowError) as error:
            raise ValueError("Market provider is unavailable") from error
        _cache.update(time=time.monotonic(), data=data)
        return data
