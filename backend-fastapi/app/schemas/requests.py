"""
Pydantic request models for API endpoints.
"""

from pydantic import BaseModel, Field


class OnboardingStartRequest(BaseModel):
    """Starts a new onboarding session. Optionally pass an existing user_id to resume."""
    user_id: str | None = None


class OnboardingAnswerRequest(BaseModel):
    """User sends a message during the onboarding conversation."""
    session_id: str
    message: str = Field(min_length=1, max_length=2000)


class WorkoutLogRequest(BaseModel):
    """Log a completed workout session."""
    user_id: str
    day_of_week: str
    focus: str | None = None
    exercises_completed: list[dict] | None = None
    duration_minutes: int | None = None
    mood_rating: int | None = Field(None, ge=1, le=5)
    notes: str | None = None


class FitnessCoachRequest(BaseModel):
    """Send a message to the real-time fitness coach."""
    session_id: str
    user_id: str
    message: str = Field(min_length=1, max_length=2000)


class WeightLogRequest(BaseModel):
    """Log a weight measurement."""
    user_id: str
    weight_kg: float = Field(gt=0, lt=500)
