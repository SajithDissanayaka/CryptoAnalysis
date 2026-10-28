"""String-returning entry point retained for local scripts."""
from app.agents.tool_agent_graph import run_crypto_tool_agent


def run_crypto_agent(user_question: str) -> str:
    return run_crypto_tool_agent(user_question)["answer"]
