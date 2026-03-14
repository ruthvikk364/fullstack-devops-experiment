"""
Mika Realtime Voice Agent — OpenAI Realtime API voice interface for onboarding.
Shares conversation context with the text-based OnboardingAgent via ConversationMessage DB.
"""

import json

import websockets

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17"

MIKA_SYSTEM_PROMPT = """You are Mika, a friendly and motivational AI fitness coach for the TrainFree platform.

Your job is to onboard the user by collecting their fitness profile through a natural, encouraging VOICE conversation.

IMPORTANT RULES:
1. Ask ONE question at a time. Never skip steps.
2. Be warm, use encouraging language, and light humor.
3. After each user answer, acknowledge it and ask the next question.
4. If the user gives an unclear answer, gently ask for clarification.
5. Track which fields you've already collected. Don't re-ask completed fields.
6. Keep responses SHORT and conversational — you're talking, not writing an essay.

DATA TO COLLECT (in this order):
1. name — user's first name
2. fitness_goal — "muscle_gain", "weight_loss", or "general" (ask what brings them here)
3. email — to send their plan PDF
4. weight_kg — current weight in kg
5. height_cm — height in cm
6. target_weight_kg — goal weight
7. target_duration_weeks — how many weeks to reach goal
8. diet_preference — "veg", "non-veg", or "vegan"
9. injuries — any injuries (list, or "none")
10. has_gym_access — gym or home workout
11. daily_available_minutes — how many minutes per day

After collecting ALL 11 fields, you MUST output this EXACT format on its own line:
PROFILE_COMPLETE:{"name":"...","email":"...","weight_kg":...,"height_cm":...,"target_weight_kg":...,"target_duration_weeks":...,"diet_preference":"...","injuries":[...],"has_gym_access":true/false,"daily_available_minutes":...,"fitness_goal":"..."}

Then congratulate them and tell them their personalized plan is being generated.

START by greeting the user warmly and asking their name."""


class MikaRealtimeAgent:
    """Manages OpenAI Realtime API connection for Mika voice onboarding."""

    def __init__(self, session_id: str, conversation_context: str = ""):
        self.session_id = session_id
        self.conversation_context = conversation_context
        self.openai_ws: websockets.WebSocketClientProtocol | None = None
        self.connected = False

    async def connect(self) -> bool:
        """Establish connection to OpenAI Realtime API."""
        try:
            self.openai_ws = await websockets.connect(
                OPENAI_REALTIME_URL,
                additional_headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "OpenAI-Beta": "realtime=v1",
                },
            )
            self.connected = True
            log.info("Mika Realtime connected: session=%s", self.session_id)

            # Wait for session.created
            raw = await self.openai_ws.recv()
            msg = json.loads(raw)
            if msg.get("type") == "session.created":
                log.info("Mika session created: %s", msg.get("session", {}).get("id", "?"))

            await self._configure_session()
            return True

        except Exception as e:
            log.error("Failed to connect Mika Realtime: %s", e)
            self.connected = False
            return False

    async def _configure_session(self):
        """Send session.update with Mika's instructions and voice config."""
        # Build system prompt with conversation context if resuming
        instructions = MIKA_SYSTEM_PROMPT
        if self.conversation_context:
            instructions += f"\n\n=== CONVERSATION SO FAR ===\nThe user has already been chatting with you in text mode. Here is the conversation history. CONTINUE from where you left off — do NOT re-ask questions already answered.\n\n{self.conversation_context}\n\n=== END CONTEXT ===\nContinue the conversation naturally from here. If all data is collected, output PROFILE_COMPLETE."

        await self.openai_ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": instructions,
                "tools": [],
                "voice": "shimmer",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1",
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 600,
                },
                "temperature": 0.8,
            },
        }))

        # Wait for session.updated
        raw = await self.openai_ws.recv()
        msg = json.loads(raw)
        log.info("Mika session configured: %s", msg.get("type"))

        # Trigger initial greeting (or resume prompt)
        if self.conversation_context:
            prompt_text = "[VOICE_MODE_RESUMED] The user just switched from text chat to voice mode. Briefly acknowledge the switch and continue the onboarding from where you left off. Keep it short."
        else:
            prompt_text = "[SESSION_START] The user just connected. Greet them warmly and ask their name."

        await self.openai_ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": prompt_text}],
            },
        }))
        await self.openai_ws.send(json.dumps({"type": "response.create"}))

    async def send_audio(self, audio_b64: str):
        """Forward browser audio to OpenAI."""
        if self.openai_ws and self.connected:
            await self.openai_ws.send(json.dumps({
                "type": "input_audio_buffer.append",
                "audio": audio_b64,
            }))

    async def receive_from_openai(self):
        """Receive next message from OpenAI. Returns parsed dict or None."""
        if not self.openai_ws or not self.connected:
            return None
        try:
            raw = await self.openai_ws.recv()
            return json.loads(raw)
        except websockets.ConnectionClosed:
            self.connected = False
            return None
        except Exception as e:
            log.warning("Error receiving from Mika OpenAI: %s", e)
            return None

    async def disconnect(self):
        """Close the OpenAI connection."""
        self.connected = False
        if self.openai_ws:
            try:
                await self.openai_ws.close()
            except Exception:
                pass
            self.openai_ws = None
        log.info("Mika Realtime disconnected: session=%s", self.session_id)
