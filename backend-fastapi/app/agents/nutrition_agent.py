"""
Nutrition Agent — provides on-demand nutrition lookups and diet advice.
Uses OpenAI with the nutrition_api tool for real food data.
"""

import json

from openai import AsyncOpenAI

from app.config import settings
from app.tools.nutrition_api import get_nutrition_data
from app.utils.logger import get_logger

log = get_logger(__name__)

SYSTEM_PROMPT = """You are a certified AI nutritionist working for TrainFree.
You help users understand nutrition, answer food-related questions, and provide advice.

You have access to a tool called 'get_nutrition_data' that fetches real nutrition info for any food.
Use it whenever a user asks about a specific food's calories, protein, or macros.

Keep answers concise, practical, and encouraging."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_nutrition_data",
            "description": "Fetch nutrition info (calories, protein, carbs, fat) for a food item.",
            "parameters": {
                "type": "object",
                "properties": {
                    "food_name": {
                        "type": "string",
                        "description": "The food item to look up, e.g. 'chicken breast' or 'brown rice'",
                    }
                },
                "required": ["food_name"],
            },
        },
    }
]


class NutritionAgent:
    """Handles nutrition-related queries with tool-calling support."""

    def __init__(self):
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def query(self, user_message: str, context: dict | None = None) -> str:
        """
        Process a nutrition question. Supports tool calls for food lookups.
        context can include user profile info for personalized answers.
        """
        client = self._get_client()

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            ctx_msg = f"User context: Diet preference: {context.get('diet_preference', 'unknown')}, "
            ctx_msg += f"Calorie target: {context.get('calorie_target', 'unknown')} kcal/day, "
            ctx_msg += f"Goal: {context.get('fitness_goal', 'general fitness')}"
            messages.append({"role": "system", "content": ctx_msg})

        messages.append({"role": "user", "content": user_message})

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            temperature=0.6,
            max_tokens=600,
        )

        choice = response.choices[0]

        # Handle tool calls
        if choice.finish_reason == "tool_calls" or (choice.message.tool_calls):
            messages.append(choice.message)

            for tool_call in choice.message.tool_calls:
                if tool_call.function.name == "get_nutrition_data":
                    args = json.loads(tool_call.function.arguments)
                    result = await get_nutrition_data(args["food_name"])
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result),
                    })

            # Get final response after tool results
            follow_up = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.6,
                max_tokens=600,
            )
            return follow_up.choices[0].message.content

        return choice.message.content
