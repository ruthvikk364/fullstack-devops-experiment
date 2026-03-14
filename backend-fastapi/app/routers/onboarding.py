"""
Onboarding router — handles the conversational profile-building flow.
"""

import json
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.agents.onboarding_agent import OnboardingAgent
from app.models.models import User, BMIRecord, ConversationMessage
from app.schemas.requests import OnboardingStartRequest, OnboardingAnswerRequest
from app.schemas.responses import OnboardingStartResponse, OnboardingAnswerResponse
from app.utils.logger import get_logger

log = get_logger(__name__)

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
    result = await _agent.process_answer(db, body.session_id, body.message, voice_context=body.voice_context)
    return OnboardingAnswerResponse(**result)


class VoiceTranscriptRequest(BaseModel):
    session_id: str
    user_id: str
    user_text: str = ""
    assistant_text: str = ""


@router.post("/voice-transcript")
async def save_voice_transcript(
    body: VoiceTranscriptRequest,
    db: AsyncSession = Depends(get_db),
):
    """Save voice transcripts to DB and check for profile completion."""
    # Save user message
    if body.user_text.strip():
        db.add(ConversationMessage(
            session_id=body.session_id,
            user_id=body.user_id,
            role="user",
            content=body.user_text,
        ))

    # Save assistant message
    if body.assistant_text.strip():
        db.add(ConversationMessage(
            session_id=body.session_id,
            user_id=body.user_id,
            role="assistant",
            content=body.assistant_text,
        ))

    await db.flush()

    # Check for profile completion in assistant text
    if "PROFILE_COMPLETE:" in body.assistant_text:
        try:
            json_str = body.assistant_text.split("PROFILE_COMPLETE:")[1].strip()
            brace_count = 0
            end_idx = 0
            for i, ch in enumerate(json_str):
                if ch == "{":
                    brace_count += 1
                elif ch == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break
            profile_data = json.loads(json_str[:end_idx])

            result = await db.execute(select(User).where(User.id == body.user_id))
            user = result.scalar_one_or_none()
            if user:
                await _agent._save_profile(db, user, profile_data)
                plan_generated = await _agent._generate_plans(db, user)
                await db.commit()
                log.info("Voice onboarding complete for user %s", body.user_id)
                return {
                    "saved": True,
                    "onboarding_complete": True,
                    "plan_generated": plan_generated,
                }
        except (json.JSONDecodeError, IndexError, ValueError) as e:
            log.warning("Failed to parse PROFILE_COMPLETE from voice: %s", e)

    await db.commit()
    return {"saved": True, "onboarding_complete": False, "plan_generated": False}


@router.get("/profile/{user_id}")
async def get_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get user profile data, BMI info, and PDF download URL after onboarding."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get latest BMI record
    bmi_result = await db.execute(
        select(BMIRecord)
        .where(BMIRecord.user_id == user_id)
        .order_by(BMIRecord.created_at.desc())
    )
    bmi = bmi_result.scalar_one_or_none()

    # Construct PDF filename
    pdf_filename = None
    pdf_available = False
    if user.name:
        fname = f"TrainFree_Plan_{user.name.replace(' ', '_')}.pdf"
        pdf_path = os.path.join(settings.PDF_OUTPUT_DIR, fname)
        if os.path.exists(pdf_path):
            pdf_filename = fname
            pdf_available = True

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "weight_kg": user.weight_kg,
        "height_cm": user.height_cm,
        "target_weight_kg": user.target_weight_kg,
        "fitness_goal": user.fitness_goal,
        "diet_preference": user.diet_preference,
        "onboarding_complete": user.onboarding_complete,
        "bmi": {
            "bmi_value": bmi.bmi_value,
            "category": bmi.category,
            "daily_calories": bmi.daily_calories,
            "daily_protein_g": bmi.daily_protein_g,
            "daily_carbs_g": bmi.daily_carbs_g,
            "daily_fat_g": bmi.daily_fat_g,
            "strategy": bmi.strategy,
        } if bmi else None,
        "pdf_filename": pdf_filename,
        "pdf_available": pdf_available,
    }


@router.get("/pdf/{user_id}")
async def download_pdf(user_id: str, db: AsyncSession = Depends(get_db)):
    """Download the generated fitness plan PDF."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.name:
        raise HTTPException(status_code=404, detail="User not found")

    fname = f"TrainFree_Plan_{user.name.replace(' ', '_')}.pdf"
    pdf_path = os.path.join(settings.PDF_OUTPUT_DIR, fname)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found. Plan may still be generating.")

    return FileResponse(
        path=pdf_path,
        filename=fname,
        media_type="application/pdf",
    )
