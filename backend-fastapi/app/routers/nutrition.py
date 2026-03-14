"""
Nutrition router — diet plan retrieval, nutrition lookups, and AI nutrition advice.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.models import User, DietPlan
from app.agents.nutrition_agent import NutritionAgent
from app.tools.nutrition_api import get_nutrition_data
from app.schemas.responses import NutritionPlanResponse

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

_agent = NutritionAgent()


@router.get("/plan/{user_id}", response_model=NutritionPlanResponse)
async def get_nutrition_plan(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the active diet plan for a user."""
    result = await db.execute(
        select(DietPlan)
        .where(DietPlan.user_id == user_id, DietPlan.is_active == True)
        .order_by(DietPlan.created_at.desc())
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="No diet plan found. Complete onboarding first.")

    return NutritionPlanResponse(
        user_id=user_id,
        calorie_target=plan.calorie_target,
        protein_target_g=plan.protein_target_g,
        plan_data=plan.plan_data,
        created_at=plan.created_at,
    )


@router.get("/lookup/{food_name}")
async def lookup_food(food_name: str):
    """Look up nutrition data for a specific food item."""
    data = await get_nutrition_data(food_name)
    return data


@router.post("/ask")
async def ask_nutrition(
    question: str,
    user_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Ask the AI nutrition agent a question."""
    context = None
    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            context = {
                "diet_preference": user.diet_preference,
                "fitness_goal": user.fitness_goal,
                "calorie_target": None,
            }
            # Get calorie target from latest diet plan
            plan_result = await db.execute(
                select(DietPlan)
                .where(DietPlan.user_id == user_id, DietPlan.is_active == True)
                .order_by(DietPlan.created_at.desc())
            )
            plan = plan_result.scalar_one_or_none()
            if plan:
                context["calorie_target"] = plan.calorie_target

    answer = await _agent.query(question, context=context)
    return {"answer": answer}
