import json

from ollama import Client

from app.tools.market_tools import get_crypto_price


client = Client(
    host="http://localhost:11434",
    timeout=60,
)


SYSTEM_PROMPT = """
You are CryptoMind AI, a cryptocurrency analysis assistant.

You can use tools to retrieve cryptocurrency information.

Important rules:
- Tool data in this exercise is synthetic, not live.
- Never describe mock prices as current market prices.
- Clearly explain missing information.
- Never guarantee future market movements.
- Do not provide personalized investment advice.
""".strip()


def run_crypto_agent(user_question: str) -> str:

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_question},
    ]

    max_rounds = 3

    for round_number in range(max_rounds):

        response = client.chat(
            model="gemma3:1b",
            messages=messages,
            tools=[get_crypto_price],
        )

        messages.append(response.message)

        if not response.message.tool_calls:
            return response.message.content or ""

        for tool_call in response.message.tool_calls:

            tool_name = tool_call.function.name
            arguments = tool_call.function.arguments

            if tool_name != "get_crypto_price":
                result = {
                    "status": "error",
                    "message": "Unknown tool",
                }

            else:
                symbol = arguments.get("symbol")

                if not isinstance(symbol, str):
                    result = {
                        "status": "error",
                        "message": "Invalid symbol",
                    }
                else:
                    result = get_crypto_price(symbol)

            messages.append(
                {
                    "role": "tool",
                    "tool_name": tool_name,
                    "content": json.dumps(result),
                }
            )

    return (
        "Unable to complete the analysis within "
        "the allowed tool-call limit."
    )