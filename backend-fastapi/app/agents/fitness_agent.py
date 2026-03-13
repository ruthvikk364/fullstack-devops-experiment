"""
Real-Time Fitness Coach Agent.
Guides users through workouts with exercise instructions, rest timers,
motivation, and pain/safety awareness.
"""

import json
import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.models import User, WorkoutPlan, WorkoutLog, ConversationMessage
from app.utils.logger import get_logger

log = get_logger(__name__)

DAYS_MAP = {
    0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday",
    4: "friday", 5: "saturday", 6: "sunday",
}

SYSTEM_PROMPT = """You are an energetic, motivational real-time fitness coach for TrainFree.
Your name is Coach Mika.

BEHAVIOR:
- Guide the user through their workout, one exercise at a time.
- Be enthusiastic and encouraging. Use phrases like "Let's go champ!", "You got this!", "Beast mode!"
- After each set, suggest a rest period (based on exercise rest_sec).
- Track which exercise/set the user is on.
- If user says they're tired, push them gently: "One more set! You didn't come this far to only come this far!"
- If user mentions PAIN or INJURY, IMMEDIATELY stop the workout and recommend rest. Safety first.
- Suggest music vibes appropriate to the workout phase (warmup = chill, working sets = high energy, cooldown = relaxed).

TOOLS AVAILABLE:
- rest_timer: Tells the user to rest for N seconds between sets.
- music_suggestion: Suggests a music genre/vibe for the current phase.

CONTEXT will include today's workout plan. Guide the user through it step by step.
Keep responses short and punchy — this is a gym buddy, not an essay writer."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "rest_timer",
            "description": "Trigger a rest timer for the user between sets.",
            "parameters": {
                "type": "object",
                "properties": {
                    "seconds": {
                        "type": "integer",
                        "description": "Rest duration in seconds",
                    },
                    "message": {
                        "type": "string",
                        "description": "Motivational message during rest",
                    },
                },
                "required": ["seconds"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "music_suggestion",
            "description": "Suggest workout music for the current phase.",
            "parameters": {
                "type": "object",
                "properties": {
                    "phase": {
                        "type": "string",
                        "enum": ["warmup", "working_set", "cooldown"],
                        "description": "Current workout phase",
                    },
                    "genre": {
                        "type": "string",
                        "description": "Suggested music genre or vibe",
                    },
                },
                "required": ["phase", "genre"],
            },
        },
    },
]


class FitnessAgent:
    """Real-time workout coaching with conversational AI."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def start_workout(self, db: AsyncSession, user_id: str) -> dict:
        """Start a workout session. Returns today's plan and a greeting."""
        session_id = str(uuid.uuid4())

        # Load user and active workout plan
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "User not found. Complete onboarding first."}

        result = await db.execute(
            select(WorkoutPlan)
            .where(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active == True)
            .order_by(WorkoutPlan.created_at.desc())
        )
        plan = result.scalar_one_or_none()
        if not plan:
            return {"error": "No workout plan found. Complete onboarding first."}

        # Get today's workout
        today_key = DAYS_MAP[datetime.now(timezone.utc).weekday()]
        weekly_split = plan.plan_data.get("weekly_split", {})
        today_workout = weekly_split.get(today_key, {})

        # Build context for the agent
        context = f"""TODAY: {today_key.capitalize()}
FOCUS: {today_workout.get('focus', 'Rest')}
USER: {user.name or 'Champ'}
EXERCISES: {json.dumps(today_workout.get('exercises', []), indent=2)}
WARMUP: {today_workout.get('warmup', '5 min light cardio')}
COOLDOWN: {today_workout.get('cooldown', '5 min stretching')}"""

        client = self._get_client()
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"TODAY'S WORKOUT CONTEXT:\n{context}"},
        ]

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            temperature=0.8,
            max_tokens=400,
        )

        greeting = response.choices[0].message.content
        tool_results = self._extract_tool_data(response.choices[0])

        # Store conversation start
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="system", content=SYSTEM_PROMPT + "\n\n" + context,
        ))
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="assistant", content=greeting,
        ))
        await db.commit()

        return {
            "session_id": session_id,
            "user_id": user_id,
            "day": today_key,
            "focus": today_workout.get("focus", "Rest"),
            "message": greeting,
            **tool_results,
        }

    async def coach_message(
        self, db: AsyncSession, session_id: str, user_id: str, message: str
    ) -> dict:
        """Process a message during an active workout session."""

        # Load conversation history
        result = await db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.session_id == session_id)
            .order_by(ConversationMessage.created_at)
        )
        history = result.scalars().all()

        if not history:
            return {"message": "Session not found. Start a new workout.", "exercise_guidance": None}

        # Build messages
        messages = []
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content or ""})
        messages.append({"role": "user", "content": message})

        # Store user message
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="user", content=message,
        ))

        client = self._get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            temperature=0.8,
            max_tokens=400,
        )

        choice = response.choices[0]
        assistant_content = choice.message.content or ""
        tool_results = self._extract_tool_data(choice)

        # Handle tool calls — resolve them and get a final message
        if choice.message.tool_calls:
            messages.append(choice.message)
            for tc in choice.message.tool_calls:
                tool_output = self._execute_tool(tc)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(tool_output),
                })

            follow_up = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=TOOLS,
                temperature=0.8,
                max_tokens=400,
            )
            assistant_content = follow_up.choices[0].message.content or ""
            tool_results = {
                **tool_results,
                **self._extract_tool_data(follow_up.choices[0]),
            }

        # Store assistant message
        db.add(ConversationMessage(
            session_id=session_id, user_id=user_id,
            role="assistant", content=assistant_content,
        ))
        await db.commit()

        return {
            "message": assistant_content,
            **tool_results,
        }

    def _extract_tool_data(self, choice) -> dict:
        """Extract structured data from tool calls for the frontend."""
        result: dict = {"rest_timer": None, "music_suggestion": None}
        if not choice.message.tool_calls:
            return result

        for tc in choice.message.tool_calls:
            try:
                args = json.loads(tc.function.arguments)
                if tc.function.name == "rest_timer":
                    result["rest_timer"] = {
                        "seconds": args.get("seconds", 60),
                        "message": args.get("message", "Rest up, champ!"),
                    }
                elif tc.function.name == "music_suggestion":
                    result["music_suggestion"] = {
                        "phase": args.get("phase", "working_set"),
                        "genre": args.get("genre", "hip-hop"),
                    }
            except (json.JSONDecodeError, KeyError):
                continue

        return result

    def _execute_tool(self, tool_call) -> dict:
        """Execute a tool call locally and return the result."""
        try:
            args = json.loads(tool_call.function.arguments)
        except json.JSONDecodeError:
            return {"status": "error", "message": "Invalid tool arguments"}

        if tool_call.function.name == "rest_timer":
            return {
                "status": "ok",
                "timer_set": True,
                "seconds": args.get("seconds", 60),
            }
        elif tool_call.function.name == "music_suggestion":
            return {
                "status": "ok",
                "phase": args.get("phase", "working_set"),
                "genre": args.get("genre", "hip-hop"),
            }
        return {"status": "unknown_tool"}
