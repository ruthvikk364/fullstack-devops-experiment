"""
Shared in-memory state between the vision system and the realtime voice agent.
The vision WebSocket updates rep counts here; the realtime agent reads them.
"""

import asyncio
from dataclasses import dataclass, field
from typing import Any

# session_id → latest rep counter dict from vision system
rep_counters: dict[str, dict] = {}

# session_id → asyncio.Event that fires on every rep change
rep_events: dict[str, asyncio.Event] = {}


def update_rep_state(session_id: str, state: dict) -> None:
    """Called by the vision router when a rep is counted."""
    rep_counters[session_id] = state
    event = rep_events.get(session_id)
    if event:
        event.set()


def get_rep_state(session_id: str) -> dict:
    """Called by the realtime agent to check current rep count."""
    return rep_counters.get(session_id, {})


def register_session(session_id: str) -> asyncio.Event:
    """Register a session for rep events. Returns the event to await."""
    event = asyncio.Event()
    rep_events[session_id] = event
    return event


def cleanup_session(session_id: str) -> None:
    rep_counters.pop(session_id, None)
    rep_events.pop(session_id, None)
