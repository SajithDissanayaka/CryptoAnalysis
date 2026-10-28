from pydantic import BaseModel, Field, field_validator
from typing import Literal

class AnalysisRequest(BaseModel):
    symbol : str = Field(min_length=2, max_length=15)

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in {"BTC", "ETH", "SOL"}:
            raise ValueError("Supported symbols are BTC, ETH and SOL.")
        return value

class AnalysisResponse(BaseModel):
    symbol : str
    summary : str
    market_signal : str
    risk_level : str
    disclaimer : str

class LLMAnalysisResponse(BaseModel):
    symbol : str
    analysis : str
    model : str


class MarketAnalysis(BaseModel):
    symbol: str

    market_trend: Literal[
        "bullish",
        "bearish",
        "neutral",
        "unknown",
    ]

    risk_level: Literal[
        "low",
        "medium",
        "high",
        "unknown",
    ]

    summary: str = Field(min_length=1, max_length=1000)

    supporting_signals: list[str]

    missing_information: list[str]

    data_sufficient: bool
