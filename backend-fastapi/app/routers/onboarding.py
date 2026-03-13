"""
Onboarding router — handles the conversational profile-building flow.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.agents.onboarding_agent import OnboardingAgent
from app.schemas.requests import OnboardingStartRequest, OnboardingAnswerRequest
from app.schemas.responses import OnboardingStartResponse, OnboardingAnswerResponse

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

_agent = OnboardingAgent()


@router.post("/start", response_model=OnboardingStartResponse)
async def start_onboarding(
    body: OnboardingStartRequest,
    db: AsyncSession = Depends(get_db),
):
    """Start a new onboarding conversation with Mika."""
    result = await _agent.start_session(db, user_id=body.user_id)
    return OnboardingStartResponse(**result)


@router.post("/answer", response_model=OnboardingAnswerResponse)
async def answer_onboarding(
    body: OnboardingAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a user message to the onboarding agent and get a response."""
    result = await _agent.process_answer(db, body.session_id, body.message)
    return OnboardingAnswerResponse(**result)
