"""Manual integration example; run this file directly to execute it."""


def main():

    from app.agents.crypto_agent import run_crypto_agent


    question = (
        "Analyze Bitcoin using RSI and MACD. "
        "Explain the momentum and possible risks."
    )

    print("CryptoMind AI is analyzing...\n")

    answer = run_crypto_agent(question)

    print("\nFinal AI Analysis:\n")
    print(answer)


if __name__ == "__main__":
    main()
