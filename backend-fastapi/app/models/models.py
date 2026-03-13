"""
SQLAlchemy ORM models for the TrainFree fitness platform.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


# ─────────────────────────────────────────────
# User
# ─────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True, unique=True, index=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    target_duration_weeks = Column(Integer, nullable=True)
    diet_preference = Column(String, nullable=True)          # veg | non-veg | vegan
    injuries = Column(JSON, nullable=True)                   # ["knee", "shoulder"]
    has_gym_access = Column(Boolean, nullable=True)
    daily_available_minutes = Column(Integer, nullable=True)
    fitness_goal = Column(String, nullable=True)             # muscle_gain | weight_loss | general
    onboarding_complete = Column(Boolean, default=False)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Relationships
    bmi_records = relationship("BMIRecord", back_populates="user", lazy="selectin")
    diet_plans = relationship("DietPlan", back_populates="user", lazy="selectin")
    workout_plans = relationship("WorkoutPlan", back_populates="user", lazy="selectin")
    workout_logs = relationship("WorkoutLog", back_populates="user", lazy="selectin")


# ─────────────────────────────────────────────
# BMI Record
# ─────────────────────────────────────────────
class BMIRecord(Base):
    __tablename__ = "bmi_records"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    bmi_value = Column(Float, nullable=False)
    category = Column(String, nullable=False)                # Underweight | Normal | Overweight | Obese
    daily_calories = Column(Integer, nullable=False)
    daily_protein_g = Column(Integer, nullable=False)
    daily_carbs_g = Column(Integer, nullable=False)
    daily_fat_g = Column(Integer, nullable=False)
    strategy = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="bmi_records")


# ─────────────────────────────────────────────
# Diet Plan
# ─────────────────────────────────────────────
class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    plan_data = Column(JSON, nullable=False)                 # full 7-day meal plan
    calorie_target = Column(Integer, nullable=False)
    protein_target_g = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="diet_plans")


# ─────────────────────────────────────────────
# Workout Plan
# ─────────────────────────────────────────────
class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    plan_data = Column(JSON, nullable=False)                 # weekly split with exercises
    duration_weeks = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="workout_plans")


# ─────────────────────────────────────────────
# Workout Log
# ─────────────────────────────────────────────
class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    day_of_week = Column(String, nullable=False)
    focus = Column(String, nullable=True)                    # Chest, Back, etc.
    exercises_completed = Column(JSON, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    mood_rating = Column(Integer, nullable=True)             # 1-5
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="workout_logs")


# ─────────────────────────────────────────────
# Conversation Message (audit trail)
# ─────────────────────────────────────────────
class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    role = Column(String, nullable=False)                    # user | assistant | system | tool
    content = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    tool_call_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
