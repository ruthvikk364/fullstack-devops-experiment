"""
Diet plan generation using OpenAI.
Generates culturally appropriate, macro-aligned 7-day meal plans.
"""

import json

from openai import AsyncOpenAI

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def generate_diet_plan(
    diet_preference: str,
    calorie_target: int,
    protein_g: int,
    carbs_g: int,
    fat_g: int,
    goal: str = "general fitness",
    injuries: list[str] | None = None,
) -> dict:
    """
    Call OpenAI to generate a structured 7-day meal plan.
    Falls back to a template plan if the API call fails.
    """
    preference_context = {
        "veg": "vegetarian (include Indian foods like dal, paneer, chapati, curd, idli, dosa, etc.)",
        "non-veg": "non-vegetarian (include chicken, eggs, fish alongside rice, roti, vegetables)",
        "vegan": "vegan (plant-based only — tofu, legumes, nuts, seeds, whole grains, vegetables)",
    }
    diet_desc = preference_context.get(
        diet_preference.lower().strip().replace("-", ""),
        diet_preference,
    )

    prompt = f"""Create a 7-day meal plan with these exact requirements:

- Daily calories: {calorie_target} kcal
- Daily protein: {protein_g}g
- Daily carbs: {carbs_g}g
- Daily fat: {fat_g}g
- Diet type: {diet_desc}
- Goal: {goal}

Rules:
1. Include breakfast, mid-morning snack, lunch, evening snack, dinner for each day.
2. Each meal item must have: name, approximate calories, protein_g.
3. Use culturally appropriate, practical foods the user can easily prepare.
4. Vary meals across the week — don't repeat the same thing every day.
5. Keep each meal realistic in portion size.

Return ONLY valid JSON with this structure:
{{
  "monday": {{
    "breakfast": [{{"item": "Oats with milk and banana", "calories": 350, "protein_g": 14}}],
    "mid_morning_snack": [...],
    "lunch": [...],
    "evening_snack": [...],
    "dinner": [...]
  }},
  "tuesday": {{ ... }},
  ...through "sunday"
}}"""

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a certified nutritionist. Return only valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        plan = json.loads(response.choices[0].message.content)
        log.info("Diet plan generated via OpenAI for %s preference", diet_preference)
        return plan

    except Exception as e:
        log.warning("OpenAI diet generation failed (%s), using fallback template", e)
        return _fallback_plan(diet_preference, calorie_target)


def _fallback_plan(preference: str, cal: int) -> dict:
    """Minimal fallback plan if OpenAI is unavailable."""
    pref = preference.lower().strip()

    if "veg" in pref and "non" not in pref:
        base = {
            "breakfast": [{"item": "Oats with milk, banana, almonds", "calories": 400, "protein_g": 15}],
            "mid_morning_snack": [{"item": "Greek yogurt with honey", "calories": 150, "protein_g": 10}],
            "lunch": [{"item": "Brown rice, dal, paneer curry, salad", "calories": int(cal * 0.30), "protein_g": 25}],
            "evening_snack": [{"item": "Peanut butter toast + fruit", "calories": 200, "protein_g": 8}],
            "dinner": [{"item": "Chapati, mixed veg, curd, dal", "calories": int(cal * 0.25), "protein_g": 20}],
        }
    elif "vegan" in pref:
        base = {
            "breakfast": [{"item": "Smoothie bowl with soy milk, berries, chia", "calories": 400, "protein_g": 14}],
            "mid_morning_snack": [{"item": "Mixed nuts and dried fruit", "calories": 180, "protein_g": 6}],
            "lunch": [{"item": "Quinoa, tofu stir-fry, vegetables", "calories": int(cal * 0.30), "protein_g": 22}],
            "evening_snack": [{"item": "Hummus with carrot sticks", "calories": 150, "protein_g": 6}],
            "dinner": [{"item": "Lentil soup, brown rice, steamed broccoli", "calories": int(cal * 0.25), "protein_g": 20}],
        }
    else:
        base = {
            "breakfast": [{"item": "Eggs (3), toast, banana", "calories": 450, "protein_g": 25}],
            "mid_morning_snack": [{"item": "Protein shake with milk", "calories": 200, "protein_g": 24}],
            "lunch": [{"item": "Grilled chicken, rice, vegetables", "calories": int(cal * 0.30), "protein_g": 35}],
            "evening_snack": [{"item": "Boiled eggs (2) + apple", "calories": 200, "protein_g": 14}],
            "dinner": [{"item": "Fish/chicken curry, chapati, salad", "calories": int(cal * 0.25), "protein_g": 30}],
        }

    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    return {day: base for day in days}
