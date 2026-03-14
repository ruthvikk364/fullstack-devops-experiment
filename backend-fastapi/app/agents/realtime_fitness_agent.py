"""
Real-Time Fitness Coach — OpenAI Realtime API voice agent.
Bridges browser audio ↔ OpenAI Realtime API, with tools for:
- Rep counting (from vision system)
- Music playback
- Stretch exercises for pain/recovery
- Workout guidance
"""

import json
from datetime import datetime, timezone

import websockets

from app.config import settings
from app.services.shared_state import get_rep_state
from app.tools.music_api import search_workout_music
from app.tools.stretch_exercises import get_stretches
from app.utils.logger import get_logger

log = get_logger(__name__)

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17"

DAYS_MAP = {
    0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday",
    4: "Friday", 5: "Saturday", 6: "Sunday",
}

TOOLS = [
    {
        "type": "function",
        "name": "get_rep_count",
        "description": "Get the current rep count from the camera-based vision tracking system. Call this to check how many reps the user has done.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "The vision session ID"},
            },
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "play_music",
        "description": "Search and play workout music for the user. Call this when the user asks for music or you want to pump them up.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for music, e.g. 'high energy workout', 'hip hop gym', 'motivational rock'",
                },
            },
            "required": ["query"],
        },
    },
    {
        "type": "function",
        "name": "stop_music",
        "description": "Stop the currently playing music. Call when user says stop, or during rest periods.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "get_stretch_exercises",
        "description": "Get stretch exercises for a specific body part. Call when user reports pain or needs recovery stretches.",
        "parameters": {
            "type": "object",
            "properties": {
                "body_part": {
                    "type": "string",
                    "description": "Body part that hurts or needs stretching: legs, back, shoulders, arms, or general",
                },
            },
            "required": ["body_part"],
        },
    },
    {
        "type": "function",
        "name": "start_rest_timer",
        "description": "Start a rest timer between sets. The frontend will show a countdown.",
        "parameters": {
            "type": "object",
            "properties": {
                "seconds": {"type": "integer", "description": "Rest duration in seconds"},
                "message": {"type": "string", "description": "Message to show during rest"},
            },
            "required": ["seconds"],
        },
    },
]


def build_system_prompt(workout_context: dict, user_name: str = "champ") -> str:
    """Build the system prompt with today's workout context."""
    today = DAYS_MAP[datetime.now(timezone.utc).weekday()]
    focus = workout_context.get("focus", "General")
    exercises = workout_context.get("exercises", [])

    exercise_list = ""
    for i, ex in enumerate(exercises, 1):
        exercise_list += f"\n  {i}. {ex['name']} — {ex['sets']} sets x {ex['reps']} (rest {ex['rest_sec']}s)"

    return f"""You are Coach Bheema, an energetic and motivational real-time fitness trainer for TrainFree.
You speak with enthusiasm, energy, and encouragement. Keep responses SHORT and punchy — you're a gym buddy, not a lecturer.

TODAY: {today}
FOCUS: {focus}
USER: {user_name}
EXERCISES:{exercise_list if exercise_list else "  Rest day — active recovery only."}

=== WORKOUT FLOW ===
1. GREET warmly: "Hey {user_name}! Hope you've been eating clean today!"
2. ANNOUNCE today's workout: "It's {today} — {focus} day! Let's crush it!"
3. GUIDE through each exercise one by one:
   - Announce the exercise name and sets/reps
   - Say "Get in position, I'm watching!" (camera tracks their reps)
   - As reps come in from the vision system, count them out loud: "1! 2! 3!"
   - After each set: "Great set! Take [rest] seconds, shake it out."
   - Then: "Ready for the next set? Let's go!"
4. After all sets of an exercise: "Exercise done! Moving on to [next exercise]."
5. After full workout: "INCREDIBLE workout today! You absolutely killed it!"

=== REP COUNTING ===
When you receive [REP_UPDATE: N/M exercise], announce the count BRIEFLY:
- Just say the number: "5!" or "5! Halfway there!" or "8! Almost done!"
- At M/M (set complete): "10! SET DONE! Great work! Rest up."
- Keep it SHORT — don't give a speech after every rep.

=== PAIN / INJURY HANDLING ===
If user says they're in pain, IMMEDIATELY:
1. "Stop! Don't push through pain. Let's take care of you."
2. Call get_stretch_exercises for that body part
3. Guide them through the stretches verbally
4. Be caring and supportive, not dismissive

=== MUSIC ===
- If user asks for music, call play_music with an appropriate query
- If user says "stop the song/music", call stop_music
- Suggest music proactively during warmup or intense sets

=== PAUSE / RESUME ===
- If user says "pause", respond: "Paused! Take your time. Say 'continue' when ready."
- If user says "continue" or "resume" or "ready": "Let's get back to it!"

=== VOICE STYLE ===
- Energetic, short sentences
- Use "champ", "beast", "let's go", "you got this"
- Count reps with energy: "1! 2! 3! GOOD! 4! 5!"
- Rest periods: calm, encouraging
- Pain: caring, serious, immediate stop"""


class RealtimeFitnessAgent:
    """Manages the OpenAI Realtime API WebSocket connection."""

    def __init__(self, session_id: str, workout_context: dict, user_name: str = "champ"):
        self.session_id = session_id
        self.workout_context = workout_context
        self.user_name = user_name
        self.openai_ws: websockets.WebSocketClientProtocol | None = None
        self.connected = False
        self._last_rep_count = -1

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
            log.info("Connected to OpenAI Realtime API for session %s", self.session_id)

            # Wait for session.created
            raw = await self.openai_ws.recv()
            msg = json.loads(raw)
            if msg.get("type") == "session.created":
                log.info("OpenAI session created: %s", msg.get("session", {}).get("id", "?"))

            # Configure the session
            await self._configure_session()
            return True

        except Exception as e:
            log.error("Failed to connect to OpenAI Realtime API: %s", e)
            self.connected = False
            return False

    async def _configure_session(self):
        """Send session.update with instructions, tools, and voice config."""
        system_prompt = build_system_prompt(self.workout_context, self.user_name)

        await self.openai_ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": system_prompt,
                "tools": TOOLS,
                "voice": "ash",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1",
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500,
                },
                "temperature": 0.8,
            },
        }))

        # Wait for session.updated confirmation
        raw = await self.openai_ws.recv()
        msg = json.loads(raw)
        log.info("Session configured: %s", msg.get("type"))

        # Trigger initial greeting
        await self.openai_ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{
                    "type": "input_text",
                    "text": "[SESSION_START] The user just joined the workout session. Greet them warmly and tell them today's workout plan.",
                }],
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
        """Receive the next message from OpenAI. Returns parsed dict or None."""
        if not self.openai_ws or not self.connected:
            return None
        try:
            raw = await self.openai_ws.recv()
            return json.loads(raw)
        except websockets.ConnectionClosed:
            self.connected = False
            return None
        except Exception as e:
            log.warning("Error receiving from OpenAI: %s", e)
            return None

    async def handle_tool_call(self, call_id: str, name: str, arguments: str) -> dict:
        """Execute a tool call and return the result to send back to OpenAI."""
        try:
            args = json.loads(arguments) if arguments else {}
        except json.JSONDecodeError:
            args = {}

        log.info("Tool call: %s(%s)", name, args)

        if name == "get_rep_count":
            vid_session = args.get("session_id", self.session_id)
            state = get_rep_state(vid_session)
            if state:
                result = {
                    "reps": state.get("reps", 0),
                    "target_reps": state.get("target_reps", 10),
                    "sets_completed": state.get("sets_completed", 0),
                    "target_sets": state.get("target_sets", 3),
                    "current_set": state.get("current_set", 1),
                    "phase": state.get("phase", "unknown"),
                    "exercise": state.get("exercise", "unknown"),
                }
            else:
                result = {"status": "no_vision_data", "message": "Camera not tracking yet."}
            return {"call_id": call_id, "output": json.dumps(result)}

        elif name == "play_music":
            query = args.get("query", "workout motivation")
            tracks = await search_workout_music(query, limit=3)
            return {
                "call_id": call_id,
                "output": json.dumps({"tracks": tracks}),
                "frontend_action": {"type": "play_music", "tracks": tracks},
            }

        elif name == "stop_music":
            return {
                "call_id": call_id,
                "output": json.dumps({"status": "music_stopped"}),
                "frontend_action": {"type": "stop_music"},
            }

        elif name == "get_stretch_exercises":
            body_part = args.get("body_part", "general")
            stretches = get_stretches(body_part)
            return {
                "call_id": call_id,
                "output": json.dumps({"body_part": body_part, "stretches": stretches}),
            }

        elif name == "start_rest_timer":
            seconds = args.get("seconds", 60)
            message = args.get("message", "Rest and recover!")
            return {
                "call_id": call_id,
                "output": json.dumps({"timer_started": True, "seconds": seconds}),
                "frontend_action": {"type": "rest_timer", "seconds": seconds, "message": message},
            }

        return {"call_id": call_id, "output": json.dumps({"error": f"Unknown tool: {name}"})}

    async def submit_tool_result(self, call_id: str, output: str):
        """Send tool result back to OpenAI and trigger continuation."""
        await self.openai_ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "function_call_output",
                "call_id": call_id,
                "output": output,
            },
        }))
        await self.openai_ws.send(json.dumps({"type": "response.create"}))

    async def inject_rep_update(self, reps: int, target: int, exercise: str, set_complete: bool, sets_done: int, target_sets: int):
        """Inject a rep count update into the conversation so the agent announces it."""
        if reps == self._last_rep_count:
            return  # No change
        self._last_rep_count = reps

        if set_complete:
            text = f"[REP_UPDATE: SET COMPLETE! {reps}/{target} {exercise}. Sets done: {sets_done}/{target_sets}]"
        else:
            text = f"[REP_UPDATE: {reps}/{target} {exercise}]"

        # Cancel any current response so the rep announcement is immediate
        await self.openai_ws.send(json.dumps({"type": "response.cancel"}))

        await self.openai_ws.send(json.dumps({
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}],
            },
        }))
        await self.openai_ws.send(json.dumps({"type": "response.create"}))

    async def disconnect(self):
        """Close the OpenAI connection."""
        self.connected = False
        if self.openai_ws:
            try:
                await self.openai_ws.close()
            except Exception:
                pass
            self.openai_ws = None
        log.info("Realtime agent disconnected: session %s", self.session_id)
