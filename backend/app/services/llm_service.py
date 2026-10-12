from ollama import Client

from app.schemas.analysis import MarketAnalysis
from app.services.prompt_builder import build_analysis_messages


client = Client(
    host="http://localhost:11434",
    timeout=60,
)


def generate_crypto_analysis(symbol: str) -> MarketAnalysis:

    messages = build_analysis_messages(
        symbol=symbol,
        price=None,
        rsi=None,
        macd_signal=None,
    )

    system_instructions = (
        messages[0]["content"]
        + "\n\n"
        + messages[1]["content"]
        + """

Return only a structured market analysis.

Use "unknown" when market data is unavailable.

Do not invent current prices or indicators.

Do not invent supporting signals.

If all market indicators are missing:
- market_trend must be "unknown"
- risk_level must be "unknown"
- data_sufficient must be false
- supporting_signals must be empty
"""
    )

    ollama_messages = [
        {
            "role": "system",
            "content": system_instructions,
        },
        {
            "role": "user",
            "content": messages[2]["content"],
        },
    ]

    response = client.chat(
        model="gemma3:1b",
        messages=ollama_messages,
        format=MarketAnalysis.model_json_schema(),
        options={
            "temperature": 0,
            "num_predict": 600,
        },
    )

    raw_output = response.message.content

    if not raw_output:
        raise ValueError("LLM returned an empty response.")

    analysis = MarketAnalysis.model_validate_json(raw_output)

    # Deterministic application-level safeguards.
    # No live market data is connected in this lesson.
    analysis.symbol = symbol.upper()
    analysis.market_trend = "unknown"
    analysis.risk_level = "unknown"
    analysis.data_sufficient = False
    analysis.supporting_signals = []
    analysis.missing_information = [
        "Current market price",
        "RSI indicator",
        "MACD indicator",
    ]

    return analysis