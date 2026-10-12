from app.services.prompt_builder import build_analysis_prompt


prompt = build_analysis_prompt(
    symbol="BTC",
    price=65000,
    rsi=75,
    macd_signal="Bullish",
)

print(prompt)