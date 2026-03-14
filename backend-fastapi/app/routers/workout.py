"""
Workout router — plan retrieval, workout logging, real-time coaching, and progress tracking.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.models import User, WorkoutPlan, WorkoutLog, BMIRecord
from app.agents.fitness_agent import FitnessAgent
from app.schemas.requests import WorkoutLogRequest, FitnessCoachRequest, WeightLogRequest
from app.schemas.responses import (
    WorkoutPlanResponse,
    WorkoutLogResponse,
    FitnessCoachResponse,
    UserProgressResponse,
)

router = APIRouter(prefix="/workout", tags=["Workout"])

_fitness_agent = FitnessAgent()


@router.get("/plan/{user_id}", response_model=WorkoutPlanResponse)
async def get_workout_plan(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the active workout plan for a user."""
    result = await db.execute(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active == True)
        .order_by(WorkoutPlan.created_at.desc())
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="No workout plan found. Complete onboarding first.")

    return WorkoutPlanResponse(
        user_id=user_id,
        duration_weeks=plan.duration_weeks,
        plan_data=plan.plan_data,
        created_at=plan.created_at,
    )


@router.post("/log", response_model=WorkoutLogResponse)
async def log_workout(
    body: WorkoutLogRequest,
    db: AsyncSession = Depends(get_db),
):
    """Log a completed workout session."""
    # Verify user exists
    result = await db.execute(select(User).where(User.id == body.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    log_entry = WorkoutLog(
        user_id=body.user_id,
        day_of_week=body.day_of_week,
        focus=body.focus,
        exercises_completed=body.exercises_completed,
        duration_minutes=body.duration_minutes,
        mood_rating=body.mood_rating,
        notes=body.notes,
    )
    db.add(log_entry)

    # Update streak
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if user.last_active_date != today_str:
        yesterday = (datetime.now(timezone.utc).date()).isoformat()
        if user.last_active_date == yesterday or user.streak_days == 0:
            user.streak_days = (user.streak_days or 0) + 1
        else:
            user.streak_days = 1
        user.last_active_date = today_str

    await db.commit()

    return WorkoutLogResponse(
        id=log_entry.id,
        message=f"Workout logged! {body.day_of_week} — {body.focus or 'General'}. Streak: {user.streak_days} days!",
    )


@router.post("/coach/start")
async def start_coaching_session(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Start a real-time coaching session for today's workout."""
    result = await _fitness_agent.start_workout(db, user_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/coach/message", response_model=FitnessCoachResponse)
async def coach_message(
    body: FitnessCoachRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the real-time fitness coach during a workout."""
    result = await _fitness_agent.coach_message(
        db, body.session_id, body.user_id, body.message,
    )
    return FitnessCoachResponse(
        message=result["message"],
        exercise_guidance={
            k: v for k, v in result.items()
            if k not in ("message",) and v is not None
        } or None,
    )


@router.post("/weight")
async def log_weight(
    body: WeightLogRequest,
    db: AsyncSession = Depends(get_db),
):
    """Log a weight measurement and recalculate BMI."""
    result = await db.execute(select(User).where(User.id == body.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.weight_kg = body.weight_kg

    # Recalculate BMI
    from app.services.bmi_service import compute_targets
    targets = compute_targets(
        weight_kg=body.weight_kg,
        height_cm=user.height_cm,
        target_weight_kg=user.target_weight_kg or body.weight_kg,
        daily_minutes=user.daily_available_minutes or 60,
    )

    bmi_record = BMIRecord(
        user_id=user.id,
        bmi_value=targets["bmi_value"],
        category=targets["category"],
        daily_calories=targets["daily_calories"],
        daily_protein_g=targets["daily_protein_g"],
        daily_carbs_g=targets["daily_carbs_g"],
        daily_fat_g=targets["daily_fat_g"],
        strategy=targets["strategy"],
    )
    db.add(bmi_record)
    await db.commit()

    return {
        "message": f"Weight logged: {body.weight_kg} kg",
        "bmi": targets["bmi_value"],
        "category": targets["category"],
    }


@router.get("/progress/{user_id}", response_model=UserProgressResponse)
async def get_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get user's fitness progress: streak, workout count, weight/BMI history."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Total workouts
    count_result = await db.execute(
        select(func.count(WorkoutLog.id)).where(WorkoutLog.user_id == user_id)
    )
    total_workouts = count_result.scalar() or 0

    # BMI history
    bmi_result = await db.execute(
        select(BMIRecord)
        .where(BMIRecord.user_id == user_id)
        .order_by(BMIRecord.created_at)
    )
    bmi_records = bmi_result.scalars().all()
    bmi_history = [
        {
            "bmi_value": r.bmi_value,
            "category": r.category,
            "daily_calories": r.daily_calories,
            "recorded_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in bmi_records
    ]

    # Weight history from BMI records
    weight_history = [
        {
            "weight_kg": round(r.bmi_value * ((user.height_cm / 100) ** 2), 1),
            "recorded_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in bmi_records
    ]

    return UserProgressResponse(
        user_id=user_id,
        streak_days=user.streak_days or 0,
        total_workouts=total_workouts,
        weight_history=weight_history,
        bmi_history=bmi_history,
    )
