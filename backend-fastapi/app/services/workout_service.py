"""
Workout plan generation.
Produces a structured weekly split customized to the user's goals,
equipment access, injuries, and available time.
"""

from app.models.models import User

# ──────────────────────────────────────
# Exercise database (curated per focus)
# ──────────────────────────────────────

GYM_EXERCISES: dict[str, list[dict]] = {
    "Chest": [
        {"name": "Flat Barbell Bench Press", "sets": 4, "reps": "8-10", "rest_sec": 90},
        {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rest_sec": 75},
        {"name": "Cable Flyes", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Dips (Chest Focused)", "sets": 3, "reps": "8-12", "rest_sec": 75},
    ],
    "Back": [
        {"name": "Barbell Rows", "sets": 4, "reps": "8-10", "rest_sec": 90},
        {"name": "Lat Pulldowns", "sets": 3, "reps": "10-12", "rest_sec": 75},
        {"name": "Seated Cable Rows", "sets": 3, "reps": "10-12", "rest_sec": 75},
        {"name": "Face Pulls", "sets": 3, "reps": "15-20", "rest_sec": 60},
    ],
    "Legs": [
        {"name": "Barbell Squats", "sets": 4, "reps": "8-10", "rest_sec": 120},
        {"name": "Romanian Deadlifts", "sets": 3, "reps": "10-12", "rest_sec": 90},
        {"name": "Leg Press", "sets": 3, "reps": "10-12", "rest_sec": 90},
        {"name": "Walking Lunges", "sets": 3, "reps": "12 each", "rest_sec": 60},
        {"name": "Calf Raises", "sets": 4, "reps": "15-20", "rest_sec": 45},
    ],
    "Shoulders": [
        {"name": "Overhead Barbell Press", "sets": 4, "reps": "8-10", "rest_sec": 90},
        {"name": "Dumbbell Lateral Raises", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Rear Delt Flyes", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Shrugs", "sets": 3, "reps": "12-15", "rest_sec": 60},
    ],
    "Arms": [
        {"name": "Barbell Curls", "sets": 3, "reps": "10-12", "rest_sec": 60},
        {"name": "Tricep Rope Pushdowns", "sets": 3, "reps": "10-12", "rest_sec": 60},
        {"name": "Hammer Curls", "sets": 3, "reps": "10-12", "rest_sec": 60},
        {"name": "Overhead Tricep Extensions", "sets": 3, "reps": "10-12", "rest_sec": 60},
    ],
    "Core": [
        {"name": "Hanging Leg Raises", "sets": 3, "reps": "12-15", "rest_sec": 45},
        {"name": "Cable Crunches", "sets": 3, "reps": "15-20", "rest_sec": 45},
        {"name": "Plank", "sets": 3, "reps": "45-60 sec", "rest_sec": 30},
        {"name": "Russian Twists", "sets": 3, "reps": "20 total", "rest_sec": 30},
    ],
}

HOME_EXERCISES: dict[str, list[dict]] = {
    "Chest": [
        {"name": "Push-Ups", "sets": 4, "reps": "15-20", "rest_sec": 60},
        {"name": "Diamond Push-Ups", "sets": 3, "reps": "10-15", "rest_sec": 60},
        {"name": "Wide Push-Ups", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Decline Push-Ups", "sets": 3, "reps": "10-15", "rest_sec": 60},
    ],
    "Back": [
        {"name": "Superman Holds", "sets": 3, "reps": "12-15", "rest_sec": 45},
        {"name": "Reverse Snow Angels", "sets": 3, "reps": "12-15", "rest_sec": 45},
        {"name": "Doorframe Rows", "sets": 3, "reps": "10-12", "rest_sec": 60},
        {"name": "Prone Y-T-W Raises", "sets": 3, "reps": "10 each", "rest_sec": 45},
    ],
    "Legs": [
        {"name": "Bodyweight Squats", "sets": 4, "reps": "15-20", "rest_sec": 60},
        {"name": "Bulgarian Split Squats", "sets": 3, "reps": "12 each", "rest_sec": 75},
        {"name": "Glute Bridges", "sets": 3, "reps": "15-20", "rest_sec": 45},
        {"name": "Jump Squats", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Single-Leg Calf Raises", "sets": 3, "reps": "15 each", "rest_sec": 30},
    ],
    "Shoulders": [
        {"name": "Pike Push-Ups", "sets": 3, "reps": "10-12", "rest_sec": 60},
        {"name": "Lateral Arm Circles", "sets": 3, "reps": "20 each direction", "rest_sec": 30},
        {"name": "Wall Handstand Hold", "sets": 3, "reps": "20-30 sec", "rest_sec": 60},
        {"name": "Prone I-Y-T Raises", "sets": 3, "reps": "10 each", "rest_sec": 45},
    ],
    "Arms": [
        {"name": "Close-Grip Push-Ups", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Tricep Dips (Chair)", "sets": 3, "reps": "12-15", "rest_sec": 60},
        {"name": "Isometric Bicep Curls (Towel)", "sets": 3, "reps": "20 sec hold", "rest_sec": 30},
        {"name": "Chin-Up Hold (Doorframe)", "sets": 3, "reps": "15-20 sec", "rest_sec": 45},
    ],
    "Core": [
        {"name": "Crunches", "sets": 3, "reps": "20", "rest_sec": 30},
        {"name": "Plank", "sets": 3, "reps": "45-60 sec", "rest_sec": 30},
        {"name": "Bicycle Crunches", "sets": 3, "reps": "20 total", "rest_sec": 30},
        {"name": "Mountain Climbers", "sets": 3, "reps": "30 sec", "rest_sec": 30},
        {"name": "Leg Raises", "sets": 3, "reps": "12-15", "rest_sec": 30},
    ],
}

# Standard weekly split
WEEKLY_SPLIT = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Rest"]
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# Injury → exercises to avoid
INJURY_EXCLUSIONS: dict[str, list[str]] = {
    "shoulder": [
        "Overhead Barbell Press", "Dips (Chest Focused)", "Pike Push-Ups",
        "Wall Handstand Hold", "Overhead Tricep Extensions",
    ],
    "knee": [
        "Barbell Squats", "Jump Squats", "Walking Lunges",
        "Bulgarian Split Squats", "Leg Press",
    ],
    "back": [
        "Barbell Rows", "Romanian Deadlifts", "Barbell Squats",
        "Superman Holds",
    ],
    "wrist": [
        "Flat Barbell Bench Press", "Barbell Curls", "Push-Ups",
        "Diamond Push-Ups",
    ],
}


def _filter_injuries(exercises: list[dict], injuries: list[str] | None) -> list[dict]:
    """Remove exercises that conflict with reported injuries."""
    if not injuries:
        return exercises

    excluded: set[str] = set()
    for injury in injuries:
        key = injury.lower().strip()
        for k, names in INJURY_EXCLUSIONS.items():
            if k in key:
                excluded.update(names)

    return [e for e in exercises if e["name"] not in excluded]


def _trim_for_time(exercises: list[dict], available_minutes: int) -> list[dict]:
    """
    Rough trim: assume each exercise takes ~7 min (including rest).
    Keep enough exercises to fit within available time, with 5 min warmup/cooldown.
    """
    usable_minutes = max(available_minutes - 10, 15)  # 5 min warmup + 5 cooldown
    max_exercises = usable_minutes // 7
    return exercises[:max(max_exercises, 2)]


def generate_workout_plan(user: User) -> dict:
    """
    Build a fully structured weekly workout plan for the user.
    Returns JSON-serializable dict ready for DB storage.
    """
    exercise_db = GYM_EXERCISES if user.has_gym_access else HOME_EXERCISES
    injuries = user.injuries or []
    daily_minutes = user.daily_available_minutes or 60

    weekly_plan: dict = {}
    for i, day_name in enumerate(DAYS):
        focus = WEEKLY_SPLIT[i]

        if focus == "Rest":
            weekly_plan[day_name] = {
                "focus": "Rest & Recovery",
                "exercises": [],
                "notes": "Active recovery: light walk, stretching, or yoga.",
            }
            continue

        raw_exercises = list(exercise_db.get(focus, []))
        filtered = _filter_injuries(raw_exercises, injuries)
        trimmed = _trim_for_time(filtered, daily_minutes)

        # Estimate session duration
        est_minutes = len(trimmed) * 7 + 10  # +10 for warmup/cooldown

        weekly_plan[day_name] = {
            "focus": focus,
            "exercises": trimmed,
            "estimated_minutes": est_minutes,
            "warmup": "5 min light cardio + dynamic stretches",
            "cooldown": "5 min static stretching",
        }

    return {
        "duration_weeks": user.target_duration_weeks or 8,
        "days_per_week": 6,
        "equipment": "Gym" if user.has_gym_access else "Home / Bodyweight",
        "weekly_split": weekly_plan,
    }
