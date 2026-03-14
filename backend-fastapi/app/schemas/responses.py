"""
Pydantic response models for API endpoints.
"""

from datetime import datetime

from pydantic import BaseModel


class OnboardingStartResponse(BaseModel):
    session_id: str
    user_id: str
    message: str


class OnboardingAnswerResponse(BaseModel):
    message: str
    onboarding_complete: bool = False
    plan_generated: bool = False


class BMIResponse(BaseModel):
    bmi_value: float
    category: str
    daily_calories: int
    daily_protein_g: int
    daily_carbs_g: int
    daily_fat_g: int
    strategy: str


class NutritionPlanResponse(BaseModel):
    user_id: str
    calorie_target: int
    protein_target_g: int
    plan_data: dict
    created_at: datetime | None = None


class WorkoutPlanResponse(BaseModel):
    user_id: str
    duration_weeks: int
    plan_data: dict
    created_at: datetime | None = None


class WorkoutLogResponse(BaseModel):
    id: str
    message: str


class FitnessCoachResponse(BaseModel):
    message: str
    exercise_guidance: dict | None = None


class UserProgressResponse(BaseModel):
    user_id: str
    streak_days: int
    total_workouts: int
    weight_history: list[dict]
    bmi_history: list[dict]


class HealthCheckResponse(BaseModel):
    status: str
    version: str
