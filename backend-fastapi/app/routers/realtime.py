"""
Realtime voice coach router.
WebSocket endpoint that bridges:
  Browser (mic/speaker) ↔ Backend ↔ OpenAI Realtime API
Also monitors vision rep counter and injects updates into the voice stream.
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, async_session
from app.models.models import User, WorkoutPlan
from app.agents.realtime_fitness_agent import RealtimeFitnessAgent
from app.services.shared_state import get_rep_state, register_session, cleanup_session
from app.utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime Voice Coach"])

DAYS_MAP = {
    0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday",
    4: "friday", 5: "saturday", 6: "sunday",
}


async def _load_workout_context(user_id: str) -> tuple[dict, str]:
    """Load today's workout and user name from DB."""
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        user_name = user.name or "champ" if user else "champ"

        result = await db.execute(
            select(WorkoutPlan)
            .where(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active == True)
            .order_by(WorkoutPlan.created_at.desc())
        )
        plan = result.scalar_one_or_none()

        if plan:
            today_key = DAYS_MAP[datetime.now(timezone.utc).weekday()]
            weekly_split = plan.plan_data.get("weekly_split", {})
            today_workout = weekly_split.get(today_key, {"focus": "Rest", "exercises": []})
        else:
            today_workout = {"focus": "General Workout", "exercises": []}

        return today_workout, user_name


@router.websocket("/ws/{session_id}")
async def realtime_voice_ws(websocket: WebSocket, session_id: str):
    """
    Real-time voice coaching WebSocket.

    Client sends:
      {"type": "config", "user_id": "...", "vision_session_id": "..."}  — initial setup
      {"type": "audio", "data": "<base64 pcm16 24kHz>"}                — mic audio
      {"type": "pause"}                                                  — pause agent
      {"type": "resume"}                                                 — resume agent
      {"type": "stop"}                                                   — end session

    Client receives:
      {"type": "audio", "data": "<base64 pcm16 24kHz>"}                — agent voice
      {"type": "transcript", "text": "...", "role": "assistant"}        — text transcript
      {"type": "user_transcript", "text": "..."}                        — user speech text
      {"type": "play_music", "tracks": [...]}                           — play music
      {"type": "stop_music"}                                             — stop music
      {"type": "rest_timer", "seconds": 60, "message": "..."}          — start timer
      {"type": "status", "message": "..."}                              — status updates
      {"type": "error", "message": "..."}                               — errors
    """
    await websocket.accept()
    log.info("Realtime WS connected: session=%s", session_id)

    agent: RealtimeFitnessAgent | None = None
    paused = False
    vision_session_id: str | None = None

    try:
        # Wait for config message
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=30)
        config = json.loads(raw)

        if config.get("type") != "config":
            await websocket.send_json({"type": "error", "message": "First message must be type 'config'"})
            await websocket.close()
            return

        user_id = config.get("user_id", "")
        vision_session_id = config.get("vision_session_id", session_id)

        # Load workout
        await websocket.send_json({"type": "status", "message": "Loading your workout plan..."})
        workout_context, user_name = await _load_workout_context(user_id)

        # Connect to OpenAI Realtime API
        await websocket.send_json({"type": "status", "message": "Connecting to Coach Bheema..."})
        agent = RealtimeFitnessAgent(session_id, workout_context, user_name)
        connected = await agent.connect()

        if not connected:
            await websocket.send_json({"type": "error", "message": "Failed to connect to voice AI. Check your API key."})
            await websocket.close()
            return

        await websocket.send_json({"type": "status", "message": "Connected! Coach Bheema is ready."})

        # Register for vision rep events
        rep_event = register_session(vision_session_id)

        # Run three concurrent tasks
        await asyncio.gather(
            _browser_to_openai(websocket, agent),
            _openai_to_browser(websocket, agent),
            _rep_monitor(websocket, agent, vision_session_id, rep_event),
        )

    except WebSocketDisconnect:
        log.info("Realtime WS disconnected: session=%s", session_id)
    except asyncio.TimeoutError:
        log.warning("Realtime WS config timeout: session=%s", session_id)
        await websocket.send_json({"type": "error", "message": "Config timeout"})
    except Exception as e:
        log.error("Realtime WS error: %s", e, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except RuntimeError:
            pass
    finally:
        if agent:
            await agent.disconnect()
        if vision_session_id:
            cleanup_session(vision_session_id)
        log.info("Realtime WS cleaned up: session=%s", session_id)


async def _browser_to_openai(websocket: WebSocket, agent: RealtimeFitnessAgent):
    """Relay audio from browser mic to OpenAI Realtime API."""
    try:
        while agent.connected:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type", "")

            if msg_type == "audio":
                audio_b64 = msg.get("data", "")
                if audio_b64:
                    await agent.send_audio(audio_b64)

            elif msg_type == "pause":
                log.info("Agent paused by user")
                # Clear audio buffer so it doesn't process pending audio
                if agent.openai_ws:
                    await agent.openai_ws.send(json.dumps({
                        "type": "input_audio_buffer.clear"
                    }))
                await websocket.send_json({"type": "status", "message": "Paused. Say 'continue' or click Resume."})

            elif msg_type == "resume":
                log.info("Agent resumed by user")
                await websocket.send_json({"type": "status", "message": "Resumed! Let's keep going."})

            elif msg_type == "stop":
                log.info("Session stopped by user")
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.warning("Browser→OpenAI relay error: %s", e)


async def _openai_to_browser(websocket: WebSocket, agent: RealtimeFitnessAgent):
    """Relay audio and events from OpenAI back to browser."""
    tool_args_buffer: dict[str, str] = {}  # call_id → accumulated args

    try:
        while agent.connected:
            msg = await agent.receive_from_openai()
            if msg is None:
                break

            msg_type = msg.get("type", "")

            # Audio chunk — forward to browser for playback
            if msg_type == "response.audio.delta":
                delta = msg.get("delta", "")
                if delta:
                    await websocket.send_json({"type": "audio", "data": delta})

            # Agent transcript (what the agent is saying)
            elif msg_type == "response.audio_transcript.delta":
                text = msg.get("delta", "")
                if text:
                    await websocket.send_json({"type": "transcript", "text": text, "role": "assistant"})

            # User speech transcript
            elif msg_type == "conversation.item.input_audio_transcription.completed":
                text = msg.get("transcript", "")
                if text:
                    await websocket.send_json({"type": "user_transcript", "text": text})

            # Tool call arguments streaming
            elif msg_type == "response.function_call_arguments.delta":
                call_id = msg.get("call_id", "")
                delta = msg.get("delta", "")
                tool_args_buffer[call_id] = tool_args_buffer.get(call_id, "") + delta

            # Tool call complete — execute it
            elif msg_type == "response.function_call_arguments.done":
                call_id = msg.get("call_id", "")
                name = msg.get("name", "")
                arguments = msg.get("arguments", tool_args_buffer.get(call_id, "{}"))
                tool_args_buffer.pop(call_id, None)

                result = await agent.handle_tool_call(call_id, name, arguments)

                # Send frontend actions (music, timer, etc.)
                frontend_action = result.pop("frontend_action", None)
                if frontend_action:
                    await websocket.send_json(frontend_action)

                # Submit result back to OpenAI
                await agent.submit_tool_result(result["call_id"], result["output"])

            # Response complete
            elif msg_type == "response.done":
                pass  # Response finished, agent goes back to listening

            # Speech detected — user is talking
            elif msg_type == "input_audio_buffer.speech_started":
                await websocket.send_json({"type": "status", "message": "listening"})

            # Error from OpenAI
            elif msg_type == "error":
                error_msg = msg.get("error", {}).get("message", "Unknown error")
                log.error("OpenAI error: %s", error_msg)
                await websocket.send_json({"type": "error", "message": f"AI error: {error_msg}"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.warning("OpenAI→Browser relay error: %s", e)


async def _rep_monitor(websocket: WebSocket, agent: RealtimeFitnessAgent, vision_session_id: str, rep_event: asyncio.Event):
    """Monitor vision rep counter and inject updates into the voice agent."""
    last_reps = -1
    last_sets = 0

    try:
        while agent.connected:
            # Wait for a rep event or timeout (check every 500ms)
            try:
                await asyncio.wait_for(rep_event.wait(), timeout=0.5)
                rep_event.clear()
            except asyncio.TimeoutError:
                pass

            state = get_rep_state(vision_session_id)
            if not state:
                continue

            reps = state.get("reps", 0)
            target_reps = state.get("target_reps", 10)
            sets_done = state.get("sets_completed", 0)
            target_sets = state.get("target_sets", 3)
            exercise = state.get("exercise", "exercise")
            set_complete = state.get("set_complete", False)

            # Only inject when reps actually change
            if reps != last_reps or sets_done != last_sets:
                last_reps = reps
                last_sets = sets_done

                # Inject into voice agent
                await agent.inject_rep_update(
                    reps=reps,
                    target=target_reps,
                    exercise=exercise,
                    set_complete=set_complete,
                    sets_done=sets_done,
                    target_sets=target_sets,
                )

                # Also notify the frontend
                await websocket.send_json({
                    "type": "rep_sync",
                    "reps": reps,
                    "target_reps": target_reps,
                    "sets_completed": sets_done,
                    "target_sets": target_sets,
                    "set_complete": set_complete,
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.debug("Rep monitor ended: %s", e)
