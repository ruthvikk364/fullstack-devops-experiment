"""
Vision router — WebSocket endpoint for real-time exercise tracking.
Receives webcam frames, runs pose estimation, counts reps,
and streams results back to the client.
"""

import asyncio
import json
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.pose_estimator import (
    decode_frame,
    estimate_pose_mediapipe,
    estimate_pose_roboflow,
    get_exercise_angles,
)
from app.services.rep_counter import RepCounter, EXERCISE_CONFIG
from app.services.shared_state import update_rep_state
from app.utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/vision", tags=["Vision"])

# Active sessions: session_id → RepCounter
_sessions: dict[str, RepCounter] = {}


@router.get("/exercises")
async def list_exercises():
    """List supported exercises for vision tracking."""
    return {
        "exercises": [
            {
                "id": name,
                "primary_joint": cfg["primary_joint"],
                "up_threshold": cfg["up_threshold"],
                "down_threshold": cfg["down_threshold"],
            }
            for name, cfg in EXERCISE_CONFIG.items()
        ]
    }


@router.websocket("/ws/{session_id}")
async def vision_websocket(websocket: WebSocket, session_id: str):
    """
    Real-time exercise tracking via WebSocket.

    Client sends JSON messages:
    {
        "type": "start",
        "exercise": "squat",
        "target_reps": 10,
        "target_sets": 3,
        "rest_seconds": 60
    }
    {
        "type": "frame",
        "data": "<base64-encoded JPEG>"
    }
    {
        "type": "stop"
    }

    Server responds with rep updates:
    {
        "type": "rep_update",
        "exercise": "squat",
        "reps": 5,
        "target_reps": 10,
        "sets_completed": 0,
        "target_sets": 3,
        "current_set": 1,
        "phase": "up",
        "current_angle": 165.3,
        "form_score": 0.85,
        "form_feedback": "Good depth! Keep it up.",
        "set_complete": false,
        "workout_complete": false,
        "rest_seconds": 0
    }
    """
    await websocket.accept()
    log.info("Vision WebSocket connected: session=%s", session_id)

    counter: RepCounter | None = None
    frame_count = 0
    last_roboflow_time = 0.0
    roboflow_interval = 3.0  # seconds between Roboflow calls

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type", "")

            if msg_type == "start":
                exercise = msg.get("exercise", "squat")
                target_reps = msg.get("target_reps", 10)
                target_sets = msg.get("target_sets", 3)
                rest_sec = msg.get("rest_seconds", 60)

                counter = RepCounter(
                    exercise=exercise,
                    target_reps=target_reps,
                    target_sets=target_sets,
                    rest_seconds=rest_sec,
                )
                _sessions[session_id] = counter
                log.info(
                    "Exercise started: %s, %dx%d, session=%s",
                    exercise, target_reps, target_sets, session_id,
                )
                await websocket.send_json({
                    "type": "started",
                    "exercise": exercise,
                    "target_reps": target_reps,
                    "target_sets": target_sets,
                    "message": f"Ready! Start your {exercise}s. I'm watching.",
                })

            elif msg_type == "frame":
                if counter is None:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Send a 'start' message first.",
                    })
                    continue

                frame_b64 = msg.get("data", "")
                if not frame_b64:
                    continue

                frame = decode_frame(frame_b64)
                if frame is None:
                    continue

                frame_count += 1

                # Run MediaPipe pose estimation (fast, every frame)
                pose = estimate_pose_mediapipe(frame)

                if not pose.detected:
                    if frame_count % 5 == 0:  # Log periodically
                        log.info("Frame %d: no pose detected (frame shape=%s)", frame_count, frame.shape)
                        await websocket.send_json({
                            "type": "no_pose",
                            "message": "Can't detect you — try stepping back, make sure your legs are visible.",
                        })
                    continue

                # Log detection success periodically
                if frame_count % 30 == 1:
                    visible_kps = [k for k, v in pose.keypoints.items() if v.visibility > 0.15]
                    log.info("Frame %d: pose detected, %d keypoints visible: %s",
                             frame_count, len(visible_kps), visible_kps[:8])

                # Calculate exercise-specific angles
                angles = get_exercise_angles(pose, counter.exercise)
                if not angles:
                    if frame_count % 10 == 0:
                        log.info("Frame %d: pose detected but no valid angles for %s",
                                 frame_count, counter.exercise)
                        await websocket.send_json({
                            "type": "no_pose",
                            "message": "I can see you but can't track your legs — show your full body to the camera.",
                        })
                    continue

                # Log angles periodically for debugging
                if frame_count % 15 == 0:
                    log.info("Frame %d: angles=%s, phase=%s, reps=%d",
                             frame_count, angles, counter.state.phase.value, counter.state.reps)

                # Update rep counter
                counter.update(angles)

                # Send rep update to client + shared state (for voice agent)
                result = counter.to_dict()
                result["type"] = "rep_update"
                await websocket.send_json(result)
                update_rep_state(session_id, result)

                # Periodic Roboflow analysis for enhanced form checking
                now = time.time()
                if now - last_roboflow_time > roboflow_interval:
                    last_roboflow_time = now
                    # Fire-and-forget: don't block the main loop
                    asyncio.create_task(
                        _roboflow_form_check(websocket, frame, counter.exercise)
                    )

            elif msg_type == "stop":
                if counter:
                    log.info(
                        "Session stopped: %s — %d reps, %d sets",
                        counter.exercise, counter.state.reps,
                        counter.state.sets_completed,
                    )
                await websocket.send_json({
                    "type": "stopped",
                    "message": "Workout tracking stopped.",
                    **(counter.to_dict() if counter else {}),
                })
                counter = None
                _sessions.pop(session_id, None)

            elif msg_type == "reset_set":
                if counter:
                    counter.reset_set()
                    await websocket.send_json({
                        "type": "set_reset",
                        "message": f"Set {counter.state.current_set} — let's go!",
                        **counter.to_dict(),
                    })

    except WebSocketDisconnect:
        log.info("Vision WebSocket disconnected: session=%s", session_id)
        _sessions.pop(session_id, None)
    except json.JSONDecodeError as e:
        log.warning("Invalid JSON from client: %s", e)
        await websocket.close(code=1003, reason="Invalid JSON")
    except Exception as e:
        log.error("Vision WebSocket error: %s", e, exc_info=True)
        _sessions.pop(session_id, None)
        try:
            await websocket.close(code=1011, reason="Internal error")
        except RuntimeError:
            pass


async def _roboflow_form_check(websocket: WebSocket, frame, exercise: str):
    """Run Roboflow analysis in the background and send form feedback."""
    try:
        result = await estimate_pose_roboflow(frame)
        if "error" in result:
            return

        # Parse Roboflow response for additional insights
        predictions = result.get("predictions", [])
        if predictions:
            # Person detected — Roboflow analysis available
            confidence = predictions[0].get("confidence", 0)
            await websocket.send_json({
                "type": "form_analysis",
                "source": "roboflow",
                "confidence": round(confidence, 2),
                "message": f"Roboflow tracking active — detection confidence: {confidence:.0%}",
            })
    except Exception as e:
        log.debug("Roboflow form check failed: %s", e)
