"""
Mika Realtime Voice router.
WebSocket endpoint that bridges browser audio ↔ OpenAI Realtime API for
the Mika onboarding agent. Saves transcripts to DB for context continuity
between voice and chat modes.
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.database import async_session
from app.models.models import User, ConversationMessage
from app.agents.mika_realtime_agent import MikaRealtimeAgent
from app.agents.onboarding_agent import OnboardingAgent
from app.utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/mika", tags=["Mika Realtime Voice"])

_onboarding_agent = OnboardingAgent()


async def _load_conversation_context(session_id: str) -> tuple[str, str]:
    """Load conversation history from DB and build context string.
    Returns (context_string, user_id)."""
    async with async_session() as db:
        result = await db.execute(
            select(ConversationMessage)
            .where(ConversationMessage.session_id == session_id)
            .order_by(ConversationMessage.created_at)
        )
        history = result.scalars().all()

        if not history:
            return "", ""

        user_id = history[0].user_id or ""
        context_parts = []
        for msg in history:
            if msg.role == "system":
                continue  # Skip system prompt from context
            role = msg.role.upper()
            context_parts.append(f"{role}: {msg.content}")

        return "\n".join(context_parts), user_id


async def _save_message(session_id: str, user_id: str, role: str, content: str):
    """Save a message to the conversation DB."""
    if not content or not content.strip():
        return
    async with async_session() as db:
        db.add(ConversationMessage(
            session_id=session_id,
            user_id=user_id,
            role=role,
            content=content,
        ))
        await db.commit()


async def _check_profile_complete(session_id: str, user_id: str, assistant_text: str):
    """Check if onboarding is complete and trigger plan generation."""
    if "PROFILE_COMPLETE:" not in assistant_text:
        return None

    try:
        json_str = assistant_text.split("PROFILE_COMPLETE:")[1].strip()
        brace_count = 0
        end_idx = 0
        for i, ch in enumerate(json_str):
            if ch == "{":
                brace_count += 1
            elif ch == "}":
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        profile_data = json.loads(json_str[:end_idx])

        async with async_session() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                log.warning("User not found for profile completion: %s", user_id)
                return None

            await _onboarding_agent._save_profile(db, user, profile_data)
            plan_generated = await _onboarding_agent._generate_plans(db, user)
            await db.commit()

            log.info("Mika voice onboarding complete for user %s, plans=%s", user_id, plan_generated)
            return {"onboarding_complete": True, "plan_generated": plan_generated}

    except (json.JSONDecodeError, IndexError, ValueError) as e:
        log.warning("Failed to parse PROFILE_COMPLETE from voice transcript: %s", e)
        return None


@router.websocket("/realtime/ws/{session_id}")
async def mika_realtime_ws(websocket: WebSocket, session_id: str):
    """
    Mika voice onboarding WebSocket.

    Client sends:
      {"type": "audio", "data": "<base64 pcm16 24kHz>"}  — mic audio
      {"type": "stop"}                                     — end session

    Client receives:
      {"type": "audio", "data": "<base64 pcm16 24kHz>"}  — Mika's voice
      {"type": "transcript", "text": "...", "role": "assistant"}
      {"type": "user_transcript", "text": "..."}
      {"type": "status", "message": "..."}
      {"type": "onboarding_complete", "plan_generated": true}
      {"type": "error", "message": "..."}
    """
    await websocket.accept()
    log.info("Mika Realtime WS connected: session=%s", session_id)

    agent: MikaRealtimeAgent | None = None

    try:
        # Load conversation context from DB
        await websocket.send_json({"type": "status", "message": "Loading conversation..."})
        context, user_id = await _load_conversation_context(session_id)

        # Connect to OpenAI Realtime API
        await websocket.send_json({"type": "status", "message": "Connecting to Mika..."})
        agent = MikaRealtimeAgent(session_id, conversation_context=context)
        connected = await agent.connect()

        if not connected:
            await websocket.send_json({"type": "error", "message": "Failed to connect to voice AI."})
            await websocket.close()
            return

        await websocket.send_json({"type": "status", "message": "Connected! Mika is ready."})

        # Run two concurrent relay tasks
        await asyncio.gather(
            _browser_to_openai(websocket, agent),
            _openai_to_browser(websocket, agent, session_id, user_id),
        )

    except WebSocketDisconnect:
        log.info("Mika Realtime WS disconnected: session=%s", session_id)
    except asyncio.TimeoutError:
        log.warning("Mika Realtime WS timeout: session=%s", session_id)
    except Exception as e:
        log.error("Mika Realtime WS error: %s", e, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except RuntimeError:
            pass
    finally:
        if agent:
            await agent.disconnect()
        log.info("Mika Realtime WS cleaned up: session=%s", session_id)


async def _browser_to_openai(websocket: WebSocket, agent: MikaRealtimeAgent):
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
            elif msg_type == "stop":
                log.info("Mika voice session stopped by user")
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.warning("Mika browser→OpenAI relay error: %s", e)


async def _openai_to_browser(
    websocket: WebSocket,
    agent: MikaRealtimeAgent,
    session_id: str,
    user_id: str,
):
    """Relay audio and transcripts from OpenAI to browser, save to DB."""
    assistant_transcript_buffer = ""

    try:
        while agent.connected:
            msg = await agent.receive_from_openai()
            if msg is None:
                break

            msg_type = msg.get("type", "")

            # Audio chunk — forward to browser
            if msg_type == "response.audio.delta":
                delta = msg.get("delta", "")
                if delta:
                    await websocket.send_json({"type": "audio", "data": delta})

            # Assistant transcript delta
            elif msg_type == "response.audio_transcript.delta":
                text = msg.get("delta", "")
                if text:
                    assistant_transcript_buffer += text
                    await websocket.send_json({"type": "transcript", "text": text, "role": "assistant"})

            # Assistant transcript complete — save to DB & check profile
            elif msg_type == "response.audio_transcript.done":
                full_transcript = msg.get("transcript", assistant_transcript_buffer)
                assistant_transcript_buffer = ""

                if full_transcript:
                    await _save_message(session_id, user_id, "assistant", full_transcript)

                    # Check for profile completion
                    result = await _check_profile_complete(session_id, user_id, full_transcript)
                    if result:
                        await websocket.send_json({
                            "type": "onboarding_complete",
                            "plan_generated": result.get("plan_generated", False),
                        })

            # User speech transcript
            elif msg_type == "conversation.item.input_audio_transcription.completed":
                text = msg.get("transcript", "")
                if text:
                    await websocket.send_json({"type": "user_transcript", "text": text})
                    await _save_message(session_id, user_id, "user", text)

            # Response complete
            elif msg_type == "response.done":
                pass

            # Speech detected
            elif msg_type == "input_audio_buffer.speech_started":
                await websocket.send_json({"type": "status", "message": "listening"})

            # Error
            elif msg_type == "error":
                error_msg = msg.get("error", {}).get("message", "Unknown error")
                log.error("Mika OpenAI error: %s", error_msg)
                await websocket.send_json({"type": "error", "message": f"AI error: {error_msg}"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.warning("Mika OpenAI→Browser relay error: %s", e)
