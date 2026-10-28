
import json

from langchain_core.tools import tool

from app.tools.market_tools import (
    get_crypto_price as fetch_market_price,
)

from app.services.indicator_service import (
    analyze_indicators as calculate_indicators,
)


SUPPORTED_SYMBOLS = {"BTC", "ETH", "SOL"}


def validate_symbol(symbol: str) -> str:
    """Validate and normalize a cryptocurrency symbol."""

    if not isinstance(symbol, str):
        raise ValueError("Symbol must be a string.")

    normalized = symbol.strip().upper()

    if normalized not in SUPPORTED_SYMBOLS:
        raise ValueError(
            "Supported symbols are BTC, ETH and SOL."
        )

    return normalized


@tool
def get_crypto_price(symbol: str) -> str:
    """
    Retrieve the latest available cryptocurrency price.

    Use this tool for BTC, ETH or SOL price questions.
    Do not use it to calculate RSI or MACD.
    """

    try:
        normalized = validate_symbol(symbol)

        result = fetch_market_price(normalized)

        return json.dumps(result)

    except ValueError as error:
        return json.dumps({
            "status": "error",
            "message": str(error),
        })

    except Exception:
        return json.dumps({
            "status": "error",
            "message": "Market price service unavailable.",
        })


@tool
def analyze_indicators(symbol: str) -> str:
    """
    Calculate daily RSI and MACD for a cryptocurrency.

    Use this tool for technical indicator, momentum,
    RSI or MACD analysis of BTC, ETH or SOL.
    Returns verified calculation results or an error.
    """

    try:
        normalized = validate_symbol(symbol)

        result = calculate_indicators(normalized)

        return json.dumps(result)

    except ValueError as error:
        return json.dumps({
            "status": "error",
            "message": str(error),
        })

    except Exception:
        return json.dumps({
            "status": "error",
            "message": "Indicator service unavailable.",
        })


AGENT_TOOLS = [
    get_crypto_price,
    analyze_indicators,
]
