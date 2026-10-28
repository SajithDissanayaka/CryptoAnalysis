"""Manual integration example; run this file directly to execute it."""


def main():
    from app.tools.indicator_tools import (
        calculate_rsi,
        calculate_macd,
    )


    prices = [
        100 + (i * 0.5) + ((i % 5) - 2) * 1.2
        for i in range(60)
    ]

    print("Number of prices:", len(prices))

    rsi = calculate_rsi(prices)

    macd = calculate_macd(prices)

    print("RSI:", rsi)
    print("MACD:", macd)

if __name__ == "__main__":
    main()
