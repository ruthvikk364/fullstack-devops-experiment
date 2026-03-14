"""
Onboarding Agent — "Mika", the friendly AI fitness coach.
Manages a multi-step conversation to collect user profile data,
then triggers BMI analysis, plan generation, and PDF creation.
"""

import json
import uuid

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.models import User, BMIRecord, DietPlan, WorkoutPlan, ConversationMessage
from app.services.bmi_service import compute_targets
from app.services.diet_service import generate_diet_plan
from app.services.workout_service import generate_workout_plan
from app.services.pdf_service import generate_fitness_pdf
from app.services.email_service import send_fitness_plan_email
from app.utils.logger import get_logger

log = get_logger(__name__)

SYSTEM_PROMPT = """You are Mika, a friendly and motivational AI fitness coach for the TrainFree platform.

Your job is to onboard the user by collecting their fitness profile through a natural, encouraging conversation.

IMPORTANT RULES:
1. Ask ONE question at a time. Never skip steps.
2. Be warm, use encouraging language, and light humor.
3. After each user answer, extract the data and ask the next question.
4. If the user gives an unclear answer, gently ask for clarification.
5. Track which fields you've already collected. Don't re-ask completed fields.

DATA TO COLLECT (in this order):
1. name — user's first name
2. fitness_goal — "muscle_gain", "weight_loss", or "general" (ask what brings them here)
3. email — to send their plan PDF
4. weight_kg — current weight in kg
5. height_cm — height in cm
6. target_weight_kg — goal weight
7. target_duration_weeks — how many weeks to reach goal
8. diet_preference — "veg", "non-veg", or "vegan"
9. injuries — any injuries (list, or "none")
10. has_gym_access — gym or home workout
11. daily_available_minutes — how many minutes per day

After collecting ALL fields, respond with EXACTLY this JSON on a line by itself:
PROFILE_COMPLETE:{"name":"...","email":"...","weight_kg":...,"height_cm":...,"target_weight_kg":...,"target_duration_weeks":...,"diet_preference":"...","injuries":[...],"has_gym_access":true/false,"daily_available_minutes":...,"fitness_goal":"..."}

Then follow it with a congratulatory message telling the user their plan is being generated.

START by greeting the user warmly and asking what brings them here today."""


class OnboardingAgent:
    """Stateful onboarding conversation powered by OpenAI."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def start_session(self, db: AsyncSession, user_id: str | None = None) -> dict:
        """Create a new onboarding session. Returns session_id, user_id, and greeting."""
        session_id = str(uuid.uuid4())

        # Create or fetch user
        if user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                user = User(id=user_id)
                db.add(user)
        else:
            user = User()
            db.add(user)

        await db.flush()
        user_id = user.id

        # Get initial greeting from Mika
        client = self._get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
            ],
            temperature=0.8,
            max_tokens=300,
        )
        greeting = response.choices[0].message.content

        # Store system + assistant messages
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="system", content=SYSTEM_PROMPT,
        ))
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="assistant", content=greeting,
        ))
        await db.commit()

        return {
            "session_id": session_id,
            "user_id": user_id,
            "message": greeting,
        }

    async def process_answer(
        self, db: AsyncSession, session_id: str, user_message: str, voice_context: str | None = None
    ) -> dict:
        """Process a user message and return the agent's response."""

        # Load conversation history
        result = await db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.session_id == session_id)
            .order_by(ConversationMessage.created_at)
        )
        history = result.scalars().all()

        if not history:
            return {"message": "Session not found. Please start a new onboarding.", "onboarding_complete": False}

        user_id = history[0].user_id

        # Build messages for OpenAI
        messages = []
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content or ""})

        # Inject voice context if switching from voice to chat
        if voice_context:
            messages.append({
                "role": "system",
                "content": f"The user was previously talking in voice mode. Here is the voice conversation so far:\n{voice_context}\n\nContinue from where you left off. Do NOT re-ask questions already answered above.",
            })

        messages.append({"role": "user", "content": user_message})

        # Store user message
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="user", content=user_message,
        ))

        # Get agent response
        client = self._get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        assistant_content = response.choices[0].message.content

        # Store assistant message
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="assistant", content=assistant_content,
        ))

        # Check if onboarding is complete
        if "PROFILE_COMPLETE:" in assistant_content:
            try:
                json_str = assistant_content.split("PROFILE_COMPLETE:")[1].strip()
                # Extract JSON — it might have text after it
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

                # Save profile to user record
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one()
                await self._save_profile(db, user, profile_data)

                # Generate plans
                plan_generated = await self._generate_plans(db, user)

                # Clean the response — remove the JSON marker from displayed message
                display_message = assistant_content.split("PROFILE_COMPLETE:")[0].strip()
                after_json = json_str[end_idx:].strip()
                if after_json:
                    display_message = (display_message + "\n\n" + after_json).strip()
                if not display_message:
                    display_message = "Your profile is complete! I'm generating your personalized fitness and nutrition plan now..."

                await db.commit()
                return {
                    "message": display_message,
                    "onboarding_complete": True,
                    "plan_generated": plan_generated,
                }
            except (json.JSONDecodeError, IndexError, ValueError) as e:
                log.warning("Failed to parse PROFILE_COMPLETE JSON: %s", e)

        await db.commit()
        return {
            "message": assistant_content,
            "onboarding_complete": False,
            "plan_generated": False,
        }

    async def _save_profile(self, db: AsyncSession, user: User, data: dict) -> None:
        """Update the User record with extracted profile data."""
        user.name = data.get("name", user.name)
        user.email = data.get("email", user.email)
        user.weight_kg = data.get("weight_kg", user.weight_kg)
        user.height_cm = data.get("height_cm", user.height_cm)
        user.target_weight_kg = data.get("target_weight_kg", user.target_weight_kg)
        user.target_duration_weeks = data.get("target_duration_weeks", user.target_duration_weeks)
        user.diet_preference = data.get("diet_preference", user.diet_preference)
        user.fitness_goal = data.get("fitness_goal", user.fitness_goal)
        user.daily_available_minutes = data.get("daily_available_minutes", user.daily_available_minutes)
        user.onboarding_complete = True

        injuries = data.get("injuries", [])
        if isinstance(injuries, list):
            user.injuries = [i for i in injuries if i and i.lower() != "none"]
        else:
            user.injuries = []

        has_gym = data.get("has_gym_access")
        if isinstance(has_gym, bool):
            user.has_gym_access = has_gym
        elif isinstance(has_gym, str):
            user.has_gym_access = has_gym.lower() in ("true", "yes", "gym")
        else:
            user.has_gym_access = True

    async def _generate_plans(self, db: AsyncSession, user: User) -> bool:
        """Generate BMI record, diet plan, workout plan, and PDF."""
        try:
            # BMI + macro targets
            targets = compute_targets(
                weight_kg=user.weight_kg,
                height_cm=user.height_cm,
                target_weight_kg=user.target_weight_kg,
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

            # Diet plan
            diet_data = await generate_diet_plan(
                diet_preference=user.diet_preference or "non-veg",
                calorie_target=targets["daily_calories"],
                protein_g=targets["daily_protein_g"],
                carbs_g=targets["daily_carbs_g"],
                fat_g=targets["daily_fat_g"],
                goal=user.fitness_goal or "general fitness",
                injuries=user.injuries,
            )
            diet_plan = DietPlan(
                user_id=user.id,
                plan_data=diet_data,
                calorie_target=targets["daily_calories"],
                protein_target_g=targets["daily_protein_g"],
            )
            db.add(diet_plan)

            # Workout plan
            workout_data = generate_workout_plan(user)
            workout_plan = WorkoutPlan(
                user_id=user.id,
                plan_data=workout_data,
                duration_weeks=user.target_duration_weeks or 8,
            )
            db.add(workout_plan)

            # PDF
            user_data = {
                "name": user.name,
                "weight_kg": user.weight_kg,
                "height_cm": user.height_cm,
                "target_weight_kg": user.target_weight_kg,
                "target_duration_weeks": user.target_duration_weeks,
                "diet_preference": user.diet_preference,
                "has_gym_access": user.has_gym_access,
                "daily_available_minutes": user.daily_available_minutes,
                "injuries": user.injuries,
            }
            pdf_path = generate_fitness_pdf(user_data, targets, workout_data, diet_data)

            # Send email with PDF attachment
            if user.email:
                email_sent = await send_fitness_plan_email(
                    to_email=user.email,
                    user_name=user.name or "there",
                    pdf_path=pdf_path,
                )
                if email_sent:
                    log.info("Fitness plan emailed to %s", user.email)
                else:
                    log.warning("Email send failed for %s", user.email)

            log.info("All plans generated for user %s", user.id)
            return True

        except Exception as e:
            log.error("Plan generation failed for user %s: %s", user.id, e)
            return False
