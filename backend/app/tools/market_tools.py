MOCK_PRICES = {
    "BTC": 65000.0,
    "ETH": 3200.0,
    "SOL": 150.0,
}


def get_crypto_price(symbol: str) -> dict:
    """
    Get a demonstration USD price for a supported cryptocurrency.

    These are synthetic example prices, not live market prices.
    """

    symbol = symbol.upper()

    price = MOCK_PRICES.get(symbol)

    if price is None:
        return {
            "symbol": symbol,
            "status": "not_found",
            "price_usd": None,
            "data_source": "mock",
        }

    return {
        "symbol": symbol,
        "status": "success",
        "price_usd": price,
        "data_source": "mock",
    }