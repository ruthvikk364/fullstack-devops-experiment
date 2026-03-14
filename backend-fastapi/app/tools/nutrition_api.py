"""
API Ninjas nutrition tool.
Fetches calorie/macro data for any food item.
https://api-ninjas.com/api/nutrition
"""

import httpx

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)

API_URL = "https://api.api-ninjas.com/v1/nutrition"

# Fallback data for common foods when API key is missing or API fails
FALLBACK_DATA: dict[str, dict] = {
    "chicken breast": {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6, "serving_size_g": 100},
    "brown rice": {"calories": 112, "protein_g": 2.3, "carbs_g": 24, "fat_g": 0.8, "serving_size_g": 100},
    "oats": {"calories": 389, "protein_g": 16.9, "carbs_g": 66, "fat_g": 6.9, "serving_size_g": 100},
    "banana": {"calories": 89, "protein_g": 1.1, "carbs_g": 23, "fat_g": 0.3, "serving_size_g": 100},
    "egg": {"calories": 155, "protein_g": 13, "carbs_g": 1.1, "fat_g": 11, "serving_size_g": 100},
    "paneer": {"calories": 265, "protein_g": 18, "carbs_g": 1.2, "fat_g": 21, "serving_size_g": 100},
    "dal": {"calories": 116, "protein_g": 9, "carbs_g": 20, "fat_g": 0.4, "serving_size_g": 100},
    "chapati": {"calories": 120, "protein_g": 3.5, "carbs_g": 20, "fat_g": 3.5, "serving_size_g": 40},
    "milk": {"calories": 42, "protein_g": 3.4, "carbs_g": 5, "fat_g": 1, "serving_size_g": 100},
    "tofu": {"calories": 76, "protein_g": 8, "carbs_g": 1.9, "fat_g": 4.8, "serving_size_g": 100},
    "almonds": {"calories": 579, "protein_g": 21, "carbs_g": 22, "fat_g": 50, "serving_size_g": 100},
    "salmon": {"calories": 208, "protein_g": 20, "carbs_g": 0, "fat_g": 13, "serving_size_g": 100},
    "greek yogurt": {"calories": 59, "protein_g": 10, "carbs_g": 3.6, "fat_g": 0.4, "serving_size_g": 100},
    "whey protein": {"calories": 120, "protein_g": 24, "carbs_g": 3, "fat_g": 1.5, "serving_size_g": 30},
}


async def get_nutrition_data(food_name: str) -> dict:
    """
    Fetch nutrition info for a food item.
    Uses API Ninjas when key is available, otherwise falls back to local data.
    Returns: {calories, protein_g, carbs_g, fat_g, serving_size_g, source}
    """
    # Try API first
    if settings.API_NINJAS_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    API_URL,
                    params={"query": food_name},
                    headers={"X-Api-Key": settings.API_NINJAS_KEY},
                )
                resp.raise_for_status()
                data = resp.json()

                if data and isinstance(data, list) and len(data) > 0:
                    item = data[0]
                    result = {
                        "food_name": item.get("name", food_name),
                        "calories": round(float(item.get("calories", 0)), 1),
                        "protein_g": round(float(item.get("protein_g", 0)), 1),
                        "carbs_g": round(float(item.get("carbohydrates_total_g", 0)), 1),
                        "fat_g": round(float(item.get("fat_total_g", 0)), 1),
                        "serving_size_g": round(float(item.get("serving_size_g", 100)), 1),
                        "source": "api_ninjas",
                    }
                    log.info("Nutrition data fetched from API for: %s", food_name)
                    return result
        except Exception as e:
            log.warning("API Ninjas call failed for '%s': %s", food_name, e)

    # Fallback to local data
    key = food_name.lower().strip()
    for fb_key, fb_data in FALLBACK_DATA.items():
        if fb_key in key or key in fb_key:
            log.info("Nutrition data from fallback for: %s", food_name)
            return {"food_name": food_name, **fb_data, "source": "fallback"}

    return {
        "food_name": food_name,
        "calories": 0,
        "protein_g": 0,
        "carbs_g": 0,
        "fat_g": 0,
        "serving_size_g": 100,
        "source": "unknown",
        "note": f"No data found for '{food_name}'. Please provide approximate values.",
    }
