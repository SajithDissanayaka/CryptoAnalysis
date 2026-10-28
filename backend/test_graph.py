"""Manual integration example; run this file directly to execute it."""


def main():

    import json

    from app.agents.crypto_graph import run_crypto_graph


    print("Starting CryptoMind LangGraph...\n")

    result = run_crypto_graph(
        symbol="BTC",
        question=(
            "Analyze Bitcoin momentum using RSI and MACD. "
            "Explain the risks and uncertainty."
        ),
    )

    print("\n===== FINAL ANSWER =====\n")
    print(result.get("answer"))

    print("\n===== GRAPH STATE =====\n")

    print(
        json.dumps(
            result,
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    main()
