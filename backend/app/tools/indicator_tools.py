from math import isfinite


def validate_prices(prices: list[float]) -> None:
    if not prices:
        raise ValueError("Price list cannot be empty.")

    if any(
        not isfinite(price) or price <= 0
        for price in prices
    ):
        raise ValueError(
            "All prices must be finite positive numbers."
        )


def calculate_rsi(
    prices: list[float],
    period: int = 14,
) -> float:

    validate_prices(prices)

    if period < 1:
        raise ValueError("RSI period must be positive.")

    if len(prices) < period + 1:
        raise ValueError(
            f"At least {period + 1} prices are required."
        )

    changes = [
        prices[i] - prices[i - 1]
        for i in range(1, len(prices))
    ]

    gains = [max(change, 0) for change in changes]
    losses = [max(-change, 0) for change in changes]

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(changes)):
        avg_gain = (
            (avg_gain * (period - 1)) + gains[i]
        ) / period

        avg_loss = (
            (avg_loss * (period - 1)) + losses[i]
        ) / period

    if avg_gain == 0 and avg_loss == 0:
        return 50.0

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss

    rsi = 100 - (100 / (1 + rs))

    return round(rsi, 2)


def calculate_ema(
    prices: list[float],
    period: int,
) -> list[float]:

    # EMA is also used on signed MACD values, including zero.
    if not prices or any(not isfinite(value) for value in prices):
        raise ValueError("EMA values must be a non-empty finite sequence.")

    if period < 1:
        raise ValueError("EMA period must be positive.")

    if len(prices) < period:
        raise ValueError(
            f"At least {period} prices are required."
        )

    multiplier = 2 / (period + 1)

    initial_sma = sum(prices[:period]) / period

    ema_values = [initial_sma]

    for price in prices[period:]:
        next_ema = (
            (price - ema_values[-1]) * multiplier
            + ema_values[-1]
        )

        ema_values.append(next_ema)

    return ema_values


def calculate_macd(
    prices: list[float],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> dict:

    validate_prices(prices)

    if not (
        1 <= fast_period < slow_period
        and signal_period >= 1
    ):
        raise ValueError("Invalid MACD periods.")

    minimum_prices = slow_period + signal_period - 1

    if len(prices) < minimum_prices:
        raise ValueError(
            f"At least {minimum_prices} prices required."
        )

    fast_ema = calculate_ema(prices, fast_period)
    slow_ema = calculate_ema(prices, slow_period)

    offset = slow_period - fast_period

    aligned_fast_ema = fast_ema[offset:]

    macd_values = [
        fast - slow
        for fast, slow in zip(
            aligned_fast_ema,
            slow_ema,
        )
    ]

    signal_values = calculate_ema(
        macd_values,
        signal_period,
    )

    macd_line = macd_values[-1]
    signal_line = signal_values[-1]
    histogram = macd_line - signal_line

    return {
        "macd": round(macd_line, 4),
        "signal": round(signal_line, 4),
        "histogram": round(histogram, 4),
        "momentum": (
            "positive"
            if histogram > 0
            else "negative"
            if histogram < 0
            else "neutral"
        ),
    }
