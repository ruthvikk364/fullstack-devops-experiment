"""
Real-Time Fitness Coach — OpenAI Realtime API voice agent.
Bridges browser audio <-> OpenAI Realtime API, with tools for:
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

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime-1.5"

DAYS_MAP = {
    0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday",
    4: "Friday", 5: "Saturday", 6: "Sunday",
}

# Hardcoded weekly workout plan
WEEKLY_PLAN = {
    "Monday": {"focus": "Chest & Triceps", "exercises": [
        {"name": "Push-ups", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "pushup"},
        {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "bicep_curl"},
        {"name": "Shoulder Press", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "shoulder_press"},
    ]},
    "Tuesday": {"focus": "Legs & Glutes", "exercises": [
        {"name": "Squats", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "squat"},
        {"name": "Deadlifts", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "deadlift"},
        {"name": "Push-ups", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "pushup"},
    ]},
    "Wednesday": {"focus": "Arms & Shoulders", "exercises": [
        {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "bicep_curl"},
        {"name": "Shoulder Press", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "shoulder_press"},
        {"name": "Push-ups", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "pushup"},
    ]},
    "Thursday": {"focus": "Full Body", "exercises": [
        {"name": "Squats", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "squat"},
        {"name": "Push-ups", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "pushup"},
        {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "bicep_curl"},
        {"name": "Deadlifts", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "deadlift"},
    ]},
    "Friday": {"focus": "Legs & Core", "exercises": [
        {"name": "Squats", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "squat"},
        {"name": "Deadlifts", "sets": 3, "reps": 12, "rest_sec": 45, "vision_key": "deadlift"},
        {"name": "Push-ups", "sets": 3, "reps": 10, "rest_sec": 30, "vision_key": "pushup"},
    ]},
    "Saturday": {"focus": "Full Body Burn", "exercises": [
        {"name": "Squats", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "squat"},
        {"name": "Push-ups", "sets": 3, "reps": 15, "rest_sec": 30, "vision_key": "pushup"},
        {"name": "Bicep Curls", "sets": 3, "reps": 12, "rest_sec": 30, "vision_key": "bicep_curl"},
        {"name": "Shoulder Press", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "shoulder_press"},
        {"name": "Deadlifts", "sets": 3, "reps": 10, "rest_sec": 45, "vision_key": "deadlift"},
    ]},
    "Sunday": {"focus": "Active Recovery", "exercises": []},
}

TOOLS = [
    {
        "type": "function",
        "name": "get_rep_count",
        "description": "Get the current rep count from the camera-based vision tracking system.",
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
        "description": "Search and play workout music. Call when user asks for music or to pump them up.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query, e.g. 'high energy workout'"},
            },
            "required": ["query"],
        },
    },
    {
        "type": "function",
        "name": "stop_music",
        "description": "Stop the currently playing music.",
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "get_stretch_exercises",
        "description": "Get stretch exercises for a body part. Call when user reports pain or needs recovery.",
        "parameters": {
            "type": "object",
            "properties": {
                "body_part": {"type": "string", "description": "legs, back, shoulders, arms, or general"},
            },
            "required": ["body_part"],
        },
    },
    {
        "type": "function",
        "name": "start_rest_timer",
        "description": "Start a rest timer between sets. Frontend shows a countdown.",
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
        exercise_list += f"\n  {i}. {ex['name']} — {ex['sets']} sets x {ex['reps']} reps (rest {ex['rest_sec']}s) [camera: {ex.get('vision_key', 'none')}]"

    return f"""
===========================================================
A — PURPOSE
===========================================================
You are Coach Bheema, a real-time AI fitness trainer on TrainFree.
You are having a VOICE conversation to guide the user through today's workout session.
You count reps via camera, manage rest timers, and keep the user motivated.

TODAY: {today}
FOCUS: {focus}
USER: {user_name}

===========================================================
B — TODAY'S WORKOUT
===========================================================
EXERCISES:{exercise_list if exercise_list else "  Rest day — active recovery and stretching only."}

===========================================================
C — WORKOUT FLOW
===========================================================

STEP 1 — GREETING
  Start immediately. Say:
  "Hey {user_name}! It's {today} — {focus} day! Hope you've been eating clean. I've got a killer workout lined up for you today. Ready to crush it?"
  Then list today's exercises briefly: "We've got [exercise1], [exercise2], [exercise3]... Let's go!"
  [WAIT for user response]

STEP 2 — START WORKOUT
  Say: "Alright, let's start with [first exercise]! Turn on your camera so I can track your reps."
  [WAIT for user to turn on camera]
  When user confirms camera is on, say: "Perfect, I can see you! Get in position. When you're ready, let's go!"

STEP 3 — EXERCISE GUIDANCE (repeat for each exercise)
  For each exercise:
  a) Announce: "[Exercise name]! {ex['sets']} sets of {ex['reps']}. Let's do this!"
  b) As reps come in from vision, count them energetically
  c) At set completion: "SET DONE! Great work! Take [rest_sec] seconds." Call start_rest_timer.
  d) After rest: "Ready for set [N]? Let's go!"
  e) After all sets: "Exercise complete! Nice work!"
  f) Ask: "What exercise do you want to do next?" or suggest the next one from the plan.
  [WAIT for user response before each new exercise]

STEP 4 — BETWEEN EXERCISES
  After completing an exercise, say: "Awesome! We've done [completed]. Next up is [next exercise]. Want to go for it, or pick a different one?"
  [WAIT for user response]

STEP 5 — WORKOUT COMPLETE
  After all exercises are done:
  "INCREDIBLE workout today, {user_name}! You absolutely crushed it! Don't forget to do some stretches to cool down."
  Offer stretches: "Want me to guide you through some cool-down stretches?"

===========================================================
D — REP COUNTING
===========================================================
When you receive [REP_UPDATE: N/M exercise], announce the count BRIEFLY:
- Just the number with energy: "5!" or "5! Halfway there!" or "8! Almost!"
- At M/M (set complete): "10! SET DONE! Great work!" Then call start_rest_timer.
- Keep it SHORT — one or two words per rep. Don't give a speech.

===========================================================
E — VOICE & TONE
===========================================================
You sound like an energetic gym buddy who genuinely loves working out with people.

You are: Energetic. Motivational. Encouraging. Loud. Pumped. Supportive.
You are NOT: Calm. Quiet. Boring. Monotone. Preachy. Lecturing.

STYLE:
- Short, punchy sentences. You're YELLING motivation, not writing an essay.
- Use: "champ", "beast", "let's go", "you got this", "come on!", "PUSH!"
- Count reps with ENERGY: "1! 2! 3! GOOD! 4! 5! PUSH!"
- Rest periods: slightly calmer, encouraging: "Great set. Shake it out. Breathe."
- Pain/injury: immediately caring and serious: "Stop! Don't push through pain."

CRITICAL RESPONSE STYLE:
- Keep responses to 1-2 short sentences max.
- Ask ONE thing at a time. Stop after the question.
- Never repeat what the user just said.
- During exercise, ONLY count reps. Don't narrate.

===========================================================
F — PATIENCE & SILENCE
===========================================================
- Filler words (hmm, um, uh, ah, er) are THINKING sounds. Do NOT respond.
- Background noise, silence — be patient. Do NOT jump in.
- Ignore garbage transcriptions (YouTube phrases, random words).
- Only respond to complete, meaningful sentences from the user.

===========================================================
G — PAIN / INJURY
===========================================================
If user reports ANY pain:
1. "Stop immediately! Don't push through pain."
2. Call get_stretch_exercises for that body part.
3. Guide them through stretches verbally.
4. Ask if they want to continue with a lighter exercise or stop.

===========================================================
H — TOOLS
===========================================================
- get_rep_count: Check current reps from camera
- start_rest_timer: Start countdown timer between sets
- play_music: Search and play workout music
- stop_music: Stop music
- get_stretch_exercises: Get stretches for a body part

===========================================================
BEGIN with Step 1 immediately. Greet and announce today's workout.
"""


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
                "instructions": system_prompt,
                "tools": TOOLS,
                "voice": "ash",
                "input_audio_transcription": {
                    "model": "whisper-1",
                    "language": "en",
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 700,
                },
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
                    "text": "[SESSION_START] The user just joined. Greet them and announce today's workout.",
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
