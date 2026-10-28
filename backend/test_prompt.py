"""Manual integration example; run this file directly to execute it."""


def main():
    from app.services.prompt_builder import build_analysis_prompt


    prompt = build_analysis_prompt(
        symbol="BTC",
        price=65000,
        rsi=75,
        macd_signal="Bullish",
    )

    print(prompt)

if __name__ == "__main__":
    main()
