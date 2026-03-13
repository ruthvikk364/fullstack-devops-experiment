"""
Pose estimation service.
Primary: MediaPipe Pose (fast, local, 30fps on CPU — 33 keypoints).
Secondary: Roboflow API (periodic form analysis / person detection).
"""

import base64
import math
from dataclasses import dataclass, field

import cv2
import numpy as np

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)

# MediaPipe — imported lazily since it's optional
_mp_pose = None
_mp_pose_instance = None


def _get_mediapipe_pose():
    """Lazy-load MediaPipe Pose to avoid import errors if not installed."""
    global _mp_pose, _mp_pose_instance
    if _mp_pose_instance is None:
        import mediapipe as mp
        _mp_pose = mp.solutions.pose
        _mp_pose_instance = _mp_pose.Pose(
            static_image_mode=False,
            model_complexity=0,  # 0=lite (fastest), 1=full, 2=heavy
            smooth_landmarks=True,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3,
        )
    return _mp_pose_instance


# ── Keypoint names (MediaPipe 33-point format) ──
KEYPOINT_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index",
]


@dataclass
class Keypoint:
    x: float        # normalized 0-1
    y: float        # normalized 0-1
    z: float = 0.0  # depth (if available)
    visibility: float = 0.0


@dataclass
class PoseResult:
    keypoints: dict[str, Keypoint] = field(default_factory=dict)
    detected: bool = False
    source: str = "none"
    raw_frame_shape: tuple = (0, 0)

    def get(self, name: str) -> Keypoint | None:
        return self.keypoints.get(name)


def decode_frame(frame_b64: str) -> np.ndarray | None:
    """Decode a base64-encoded JPEG/PNG frame to a numpy array (BGR)."""
    try:
        # Handle data URI prefix
        if "," in frame_b64:
            frame_b64 = frame_b64.split(",", 1)[1]
        raw = base64.b64decode(frame_b64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        log.warning("Frame decode failed: %s", e)
        return None


def estimate_pose_mediapipe(frame: np.ndarray) -> PoseResult:
    """Run MediaPipe Pose on a BGR frame. Returns normalized keypoints."""
    try:
        pose = _get_mediapipe_pose()
    except ImportError:
        log.warning("MediaPipe not installed — skipping local pose estimation")
        return PoseResult(source="mediapipe_unavailable")

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if not results.pose_landmarks:
        return PoseResult(detected=False, source="mediapipe", raw_frame_shape=(h, w))

    keypoints = {}
    for i, lm in enumerate(results.pose_landmarks.landmark):
        if i < len(KEYPOINT_NAMES):
            keypoints[KEYPOINT_NAMES[i]] = Keypoint(
                x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility,
            )

    return PoseResult(
        keypoints=keypoints,
        detected=True,
        source="mediapipe",
        raw_frame_shape=(h, w),
    )


async def estimate_pose_roboflow(frame: np.ndarray) -> dict:
    """
    Send a frame to Roboflow's inference API for additional analysis.
    Uses the configured model (pose estimation / object detection / SAM).
    Returns raw API response for flexible downstream processing.
    """
    if not settings.ROBOFLOW_API_KEY:
        return {"error": "ROBOFLOW_API_KEY not set"}

    import httpx

    # Encode frame as JPEG
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    img_b64 = base64.b64encode(buffer).decode("utf-8")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://detect.roboflow.com/{settings.ROBOFLOW_MODEL_ID}",
                params={
                    "api_key": settings.ROBOFLOW_API_KEY,
                    "confidence": settings.ROBOFLOW_CONFIDENCE,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=img_b64,
            )
            resp.raise_for_status()
            result = resp.json()
            log.debug("Roboflow response: %s", result)
            return result
    except Exception as e:
        log.warning("Roboflow API call failed: %s", e)
        return {"error": str(e)}


def calculate_angle(a: Keypoint, b: Keypoint, c: Keypoint) -> float:
    """
    Calculate the angle at point B formed by points A-B-C.
    Returns angle in degrees (0-180).
    """
    ba = np.array([a.x - b.x, a.y - b.y])
    bc = np.array([c.x - b.x, c.y - b.y])

    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    angle = math.degrees(math.acos(cos_angle))
    return round(angle, 1)


def get_exercise_angles(pose: PoseResult, exercise: str) -> dict:
    """
    Extract relevant joint angles for a given exercise.
    Uses the average of left and right sides for robustness.
    """
    angles = {}

    if exercise in ("squat", "deadlift"):
        # Knee angle: hip → knee → ankle
        for side in ("left", "right"):
            hip = pose.get(f"{side}_hip")
            knee = pose.get(f"{side}_knee")
            ankle = pose.get(f"{side}_ankle")
            if all(p and p.visibility > 0.15 for p in [hip, knee, ankle]):
                angles[f"{side}_knee"] = calculate_angle(hip, knee, ankle)

        # Hip angle for deadlift: shoulder → hip → knee
        if exercise == "deadlift":
            for side in ("left", "right"):
                shoulder = pose.get(f"{side}_shoulder")
                hip = pose.get(f"{side}_hip")
                knee = pose.get(f"{side}_knee")
                if all(p and p.visibility > 0.15 for p in [shoulder, hip, knee]):
                    angles[f"{side}_hip"] = calculate_angle(shoulder, hip, knee)

    elif exercise in ("pushup", "bicep_curl"):
        # Elbow angle: shoulder → elbow → wrist
        for side in ("left", "right"):
            shoulder = pose.get(f"{side}_shoulder")
            elbow = pose.get(f"{side}_elbow")
            wrist = pose.get(f"{side}_wrist")
            if all(p and p.visibility > 0.15 for p in [shoulder, elbow, wrist]):
                angles[f"{side}_elbow"] = calculate_angle(shoulder, elbow, wrist)

    elif exercise == "shoulder_press":
        for side in ("left", "right"):
            shoulder = pose.get(f"{side}_shoulder")
            elbow = pose.get(f"{side}_elbow")
            wrist = pose.get(f"{side}_wrist")
            if all(p and p.visibility > 0.15 for p in [shoulder, elbow, wrist]):
                angles[f"{side}_elbow"] = calculate_angle(shoulder, elbow, wrist)
            hip = pose.get(f"{side}_hip")
            if all(p and p.visibility > 0.15 for p in [hip, shoulder, elbow]):
                angles[f"{side}_shoulder"] = calculate_angle(hip, shoulder, elbow)

    # Compute average angle (primary tracking metric)
    if angles:
        vals = list(angles.values())
        angles["avg"] = round(sum(vals) / len(vals), 1)

    return angles
