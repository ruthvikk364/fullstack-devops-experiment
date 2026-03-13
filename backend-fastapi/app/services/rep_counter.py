"""
Exercise rep counter — angle-based state machine.
Tracks joint angles from pose estimation and counts complete reps.
Supports: squat, pushup, bicep_curl, deadlift, shoulder_press.
"""

from dataclasses import dataclass, field
from enum import Enum

from app.utils.logger import get_logger

log = get_logger(__name__)


class Phase(str, Enum):
    UP = "up"           # extended / standing
    GOING_DOWN = "going_down"
    DOWN = "down"       # contracted / bottom
    GOING_UP = "going_up"


# ── Exercise thresholds (in degrees) ──
# Each exercise has: {angle_key, up_threshold, down_threshold}
EXERCISE_CONFIG: dict[str, dict] = {
    "squat": {
        "angle_key": "avg",           # average knee angle
        "up_threshold": 150,          # standing (more forgiving)
        "down_threshold": 135,        # just a slight bend counts as "down"
        "primary_joint": "knee",
        "form_tips": {
            "depth": "Bend a little more — you got this!",
            "lockout": "Stand back up fully.",
            "good": "Rep counted! Nice work!",
        },
    },
    "pushup": {
        "angle_key": "avg",           # average elbow angle
        "up_threshold": 155,
        "down_threshold": 90,
        "primary_joint": "elbow",
        "form_tips": {
            "depth": "Go lower — chest should nearly touch the ground.",
            "lockout": "Fully extend your arms at the top.",
            "good": "Great form! Full range of motion.",
        },
    },
    "bicep_curl": {
        "angle_key": "avg",           # average elbow angle
        "up_threshold": 150,          # extended arm
        "down_threshold": 50,         # curled
        "primary_joint": "elbow",
        "form_tips": {
            "depth": "Curl higher — squeeze at the top.",
            "lockout": "Fully extend your arm at the bottom.",
            "good": "Clean rep! Good control.",
        },
    },
    "deadlift": {
        "angle_key": "avg",           # average hip angle
        "up_threshold": 160,
        "down_threshold": 90,
        "primary_joint": "hip",
        "form_tips": {
            "depth": "Hinge deeper from the hips.",
            "lockout": "Stand tall — squeeze your glutes at the top.",
            "good": "Solid form! Great hip hinge.",
        },
    },
    "shoulder_press": {
        "angle_key": "avg",
        "up_threshold": 160,
        "down_threshold": 80,
        "primary_joint": "elbow",
        "form_tips": {
            "depth": "Bring the weight down to shoulder level.",
            "lockout": "Press fully overhead — lock out your arms.",
            "good": "Perfect press!",
        },
    },
}

# Hysteresis buffer (degrees) to prevent jitter-triggered reps
HYSTERESIS = 5


@dataclass
class RepState:
    reps: int = 0
    sets_completed: int = 0
    current_set: int = 1
    phase: Phase = Phase.UP
    current_angle: float = 180.0
    min_angle_this_rep: float = 180.0
    max_angle_this_rep: float = 0.0
    form_feedback: str = ""
    form_score: float = 1.0
    set_complete: bool = False
    workout_complete: bool = False
    last_angles: dict = field(default_factory=dict)


class RepCounter:
    """
    Tracks exercise reps using a state machine based on joint angles.
    Instantiate one per exercise session.
    """

    def __init__(
        self,
        exercise: str,
        target_reps: int = 10,
        target_sets: int = 3,
        rest_seconds: int = 60,
    ):
        if exercise not in EXERCISE_CONFIG:
            raise ValueError(f"Unknown exercise: {exercise}. Supported: {list(EXERCISE_CONFIG.keys())}")

        self.exercise = exercise
        self.config = EXERCISE_CONFIG[exercise]
        self.target_reps = target_reps
        self.target_sets = target_sets
        self.rest_seconds = rest_seconds

        self.state = RepState()
        self._angle_history: list[float] = []

    def update(self, angles: dict) -> RepState:
        """
        Feed new angle data from pose estimation.
        Returns the current rep state with updated counts and feedback.
        """
        self.state.last_angles = angles
        self.state.set_complete = False
        self.state.workout_complete = False

        avg_angle = angles.get(self.config["angle_key"])
        if avg_angle is None:
            self.state.form_feedback = "Can't see you clearly — adjust your position."
            return self.state

        # Smooth with exponential moving average (responsive but stable)
        self._angle_history.append(avg_angle)
        if len(self._angle_history) > 5:
            self._angle_history = self._angle_history[-5:]
        # Weight recent frames more heavily
        weights = list(range(1, len(self._angle_history) + 1))
        smoothed = sum(a * w for a, w in zip(self._angle_history, weights)) / sum(weights)

        self.state.current_angle = round(smoothed, 1)

        up_thresh = self.config["up_threshold"]
        down_thresh = self.config["down_threshold"]
        tips = self.config["form_tips"]

        # Track min/max for form scoring
        if smoothed < self.state.min_angle_this_rep:
            self.state.min_angle_this_rep = smoothed
        if smoothed > self.state.max_angle_this_rep:
            self.state.max_angle_this_rep = smoothed

        # State machine transitions
        prev_phase = self.state.phase

        if self.state.phase == Phase.UP:
            if smoothed < up_thresh - HYSTERESIS:
                self.state.phase = Phase.GOING_DOWN
                self.state.min_angle_this_rep = smoothed
                self.state.form_feedback = "Going down..."

        elif self.state.phase == Phase.GOING_DOWN:
            if smoothed <= down_thresh:
                self.state.phase = Phase.DOWN
                self.state.form_feedback = tips["good"]
            elif smoothed > up_thresh:
                # Went back up without reaching depth — partial rep
                self.state.phase = Phase.UP
                self.state.form_feedback = tips["depth"]

        elif self.state.phase == Phase.DOWN:
            if smoothed > down_thresh + HYSTERESIS:
                self.state.phase = Phase.GOING_UP
                self.state.form_feedback = "Coming up..."

        elif self.state.phase == Phase.GOING_UP:
            if smoothed >= up_thresh:
                # Full rep completed!
                self.state.phase = Phase.UP
                self.state.reps += 1
                self._score_form()
                self.state.max_angle_this_rep = smoothed
                log.info(
                    "Rep %d/%d (set %d) — %s, angle %.1f°, form %.0f%%",
                    self.state.reps, self.target_reps,
                    self.state.current_set, self.exercise,
                    smoothed, self.state.form_score * 100,
                )

                # Check if set is complete
                if self.state.reps >= self.target_reps:
                    self.state.set_complete = True
                    self.state.sets_completed += 1

                    if self.state.sets_completed >= self.target_sets:
                        self.state.workout_complete = True
                        self.state.form_feedback = f"All {self.target_sets} sets done! You crushed it!"
                    else:
                        self.state.current_set += 1
                        self.state.reps = 0
                        self.state.form_feedback = f"Set complete! Rest {self.rest_seconds}s, then set {self.state.current_set}."

                else:
                    remaining = self.target_reps - self.state.reps
                    self.state.form_feedback = f"{tips['good']} — {remaining} more to go!"

            elif smoothed < down_thresh:
                # Went back down — bounce rep / reset
                self.state.phase = Phase.DOWN

        return self.state

    def _score_form(self):
        """Score the rep's form based on range of motion."""
        up_thresh = self.config["up_threshold"]
        down_thresh = self.config["down_threshold"]

        ideal_range = up_thresh - down_thresh
        actual_range = self.state.max_angle_this_rep - self.state.min_angle_this_rep

        if ideal_range > 0:
            self.state.form_score = min(actual_range / ideal_range, 1.0)
            self.state.form_score = round(max(self.state.form_score, 0.0), 2)
        else:
            self.state.form_score = 1.0

    def reset_set(self):
        """Reset rep counter for a new set."""
        self.state.reps = 0
        self.state.phase = Phase.UP
        self.state.min_angle_this_rep = 180.0
        self.state.max_angle_this_rep = 0.0
        self._angle_history.clear()

    def to_dict(self) -> dict:
        """Serialize state for WebSocket response."""
        return {
            "exercise": self.exercise,
            "reps": self.state.reps,
            "target_reps": self.target_reps,
            "sets_completed": self.state.sets_completed,
            "target_sets": self.target_sets,
            "current_set": self.state.current_set,
            "phase": self.state.phase.value,
            "current_angle": self.state.current_angle,
            "form_score": self.state.form_score,
            "form_feedback": self.state.form_feedback,
            "set_complete": self.state.set_complete,
            "workout_complete": self.state.workout_complete,
            "rest_seconds": self.rest_seconds if self.state.set_complete else 0,
        }
