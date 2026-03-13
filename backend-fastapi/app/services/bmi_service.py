"""
BMI calculation, TDEE estimation, and macro target computation.
Uses the Mifflin-St Jeor equation for BMR.
"""


def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Compute BMI and classify into WHO categories."""
    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m ** 2)

    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"

    return {"bmi_value": round(bmi, 1), "category": category}


def estimate_bmr(weight_kg: float, height_cm: float, age: int = 25) -> float:
    """Mifflin-St Jeor BMR (uses average of male/female when gender unknown)."""
    male_bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    female_bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    return (male_bmr + female_bmr) / 2  # gender-neutral default


def estimate_tdee(weight_kg: float, height_cm: float, daily_minutes: int = 60) -> int:
    """
    Estimate Total Daily Energy Expenditure.
    Activity multiplier is inferred from the user's daily workout minutes.
    """
    bmr = estimate_bmr(weight_kg, height_cm)

    if daily_minutes <= 20:
        multiplier = 1.2    # sedentary
    elif daily_minutes <= 40:
        multiplier = 1.375  # lightly active
    elif daily_minutes <= 60:
        multiplier = 1.55   # moderately active
    elif daily_minutes <= 90:
        multiplier = 1.725  # very active
    else:
        multiplier = 1.9    # extra active

    return int(bmr * multiplier)


def compute_targets(
    weight_kg: float,
    height_cm: float,
    target_weight_kg: float,
    daily_minutes: int = 60,
) -> dict:
    """
    Full health analysis: BMI + calorie/macro targets + strategy.
    Returns everything the BMIRecord model needs.
    """
    bmi_data = calculate_bmi(weight_kg, height_cm)
    tdee = estimate_tdee(weight_kg, height_cm, daily_minutes)

    # Determine calorie adjustment based on goal direction
    diff = target_weight_kg - weight_kg
    if diff < -2:
        # Weight loss — 500 kcal deficit
        calorie_target = tdee - 500
        strategy = "Caloric deficit of ~500 kcal/day for steady fat loss (~0.5 kg/week). Focus on high-protein meals to preserve muscle."
        protein_ratio, carb_ratio, fat_ratio = 0.35, 0.35, 0.30
    elif diff > 2:
        # Weight gain — 300 kcal surplus
        calorie_target = tdee + 300
        strategy = "Caloric surplus of ~300 kcal/day for lean muscle gain (~0.25 kg/week). Prioritize protein and progressive overload."
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.45, 0.25
    else:
        # Maintenance / recomp
        calorie_target = tdee
        strategy = "Maintenance calories for body recomposition. Focus on high protein and consistent training to build muscle while staying lean."
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30

    calorie_target = max(calorie_target, 1200)  # safety floor

    macros = {
        "daily_protein_g": int((calorie_target * protein_ratio) / 4),
        "daily_carbs_g": int((calorie_target * carb_ratio) / 4),
        "daily_fat_g": int((calorie_target * fat_ratio) / 9),
    }

    return {
        **bmi_data,
        "daily_calories": calorie_target,
        **macros,
        "strategy": strategy,
    }
