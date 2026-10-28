"""Manual integration example; run this file directly to execute it."""


def main():
    import json

    from app.services.indicator_service import analyze_indicators


    for symbol in ["BTC", "ETH", "SOL"]:

        print(f"\nAnalyzing {symbol}...")

        result = analyze_indicators(symbol)

        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
