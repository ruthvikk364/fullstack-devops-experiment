"""
Stretch exercise recommendations for recovery and pain relief.
"""

STRETCH_DB: dict[str, list[dict]] = {
    "legs": [
        {"name": "Standing Quad Stretch", "duration": "30 sec each leg", "instruction": "Stand on one leg, pull the other foot to your glute. Hold for 30 seconds."},
        {"name": "Seated Hamstring Stretch", "duration": "30 sec each leg", "instruction": "Sit on the floor, extend one leg. Reach for your toes. Hold."},
        {"name": "Calf Stretch Against Wall", "duration": "30 sec each", "instruction": "Place hands on wall, step one foot back, press heel down. Hold."},
        {"name": "Hip Flexor Stretch", "duration": "30 sec each", "instruction": "Kneel on one knee, push hips forward. Feel the stretch in front of your hip."},
        {"name": "Butterfly Stretch", "duration": "45 sec", "instruction": "Sit with soles together, gently press knees down. Breathe deeply."},
    ],
    "back": [
        {"name": "Cat-Cow Stretch", "duration": "10 reps", "instruction": "On all fours, alternate arching and rounding your back slowly."},
        {"name": "Child's Pose", "duration": "45 sec", "instruction": "Kneel, sit back on heels, extend arms forward on the floor. Relax."},
        {"name": "Seated Spinal Twist", "duration": "30 sec each side", "instruction": "Sit cross-legged, twist to one side. Hold and breathe."},
        {"name": "Knee-to-Chest Stretch", "duration": "30 sec each", "instruction": "Lie on back, pull one knee to chest. Hold gently."},
    ],
    "shoulders": [
        {"name": "Cross-Body Shoulder Stretch", "duration": "30 sec each", "instruction": "Pull one arm across your chest with the other hand. Hold."},
        {"name": "Overhead Tricep Stretch", "duration": "30 sec each", "instruction": "Reach one hand behind your head, gently push elbow with other hand."},
        {"name": "Doorway Chest Stretch", "duration": "30 sec", "instruction": "Stand in a doorway, arms on frame at 90 degrees, lean forward."},
    ],
    "arms": [
        {"name": "Wrist Flexor Stretch", "duration": "20 sec each", "instruction": "Extend arm, pull fingers back with other hand. Hold."},
        {"name": "Bicep Wall Stretch", "duration": "30 sec each", "instruction": "Place palm on wall behind you, turn body away. Feel the stretch."},
        {"name": "Tricep Stretch", "duration": "30 sec each", "instruction": "Reach hand behind head, push elbow gently with other hand."},
    ],
    "general": [
        {"name": "Standing Forward Fold", "duration": "45 sec", "instruction": "Stand, bend at hips, let arms hang. Relax your neck."},
        {"name": "Cat-Cow Stretch", "duration": "10 reps", "instruction": "On all fours, alternate arching and rounding your back."},
        {"name": "Child's Pose", "duration": "45 sec", "instruction": "Kneel, sit back on heels, extend arms forward. Breathe deeply."},
        {"name": "Neck Rolls", "duration": "5 each direction", "instruction": "Slowly roll your head in circles. Switch direction."},
        {"name": "Deep Breathing", "duration": "1 min", "instruction": "Breathe in for 4 counts, hold for 4, out for 4. Repeat."},
    ],
}


def get_stretches(body_part: str = "general") -> list[dict]:
    """Return stretch exercises for the given body part."""
    key = body_part.lower().strip()
    for db_key in STRETCH_DB:
        if db_key in key or key in db_key:
            return STRETCH_DB[db_key]
    return STRETCH_DB["general"]
