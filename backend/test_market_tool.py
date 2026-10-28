"""Manual integration example; run this file directly to execute it."""


def main():
    import json

    from app.tools.market_tools import get_crypto_price


    for symbol in ["BTC", "ETH", "SOL", "INVALID"]:
        print(f"\nTesting: {symbol}")

        result = get_crypto_price(symbol)

        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
