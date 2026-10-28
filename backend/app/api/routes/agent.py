from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.agents.tool_agent_graph import run_crypto_tool_agent
from app.api.dependencies import get_current_user
from app.db.models import User

router = APIRouter(prefix="/api/v1/agent", tags=["AI Agent"])


class AgentRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Question cannot be empty.")
        return value.strip()


@router.post("/analyze")
def analyze(request: AgentRequest, user: User = Depends(get_current_user)):
    result = run_crypto_tool_agent(request.question, owner_id=user.id)
    if result["status"] != "success":
        raise HTTPException(status_code=503, detail=result["answer"])
    return result
