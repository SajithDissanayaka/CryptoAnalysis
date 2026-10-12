import time

from ollama import RequestError, ResponseError
from pydantic import ValidationError

from app.schemas.analysis import MarketAnalysis
from app.services.llm_service import generate_crypto_analysis


class LLMUnavailableError(Exception):
    pass


def generate_reliable_analysis(
    symbol: str,
    max_attempts: int = 3,
) -> MarketAnalysis:

    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1")

    for attempt in range(1, max_attempts + 1):

        try:
            print(f"LLM attempt {attempt}/{max_attempts}")

            analysis = generate_crypto_analysis(symbol)

            return analysis

        except (ValidationError, RequestError, TimeoutError) as error:

            print(f"Attempt failed: {type(error).__name__}")

            if attempt == max_attempts:
                break

            time.sleep(attempt)

        except ResponseError as error:
            # Retry only temporary server errors.
            if error.status_code < 500:
                raise LLMUnavailableError(
                    "LLM request cannot be completed."
                ) from error

            if attempt == max_attempts:
                break

            time.sleep(attempt)

    raise LLMUnavailableError(
        "LLM analysis unavailable after retries."
    )