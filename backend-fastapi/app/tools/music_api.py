"""
Music tool — searches Deezer's free API for workout music.
Returns track info with 30-second preview URLs for playback.
"""

import httpx

from app.utils.logger import get_logger

log = get_logger(__name__)

DEEZER_SEARCH_URL = "https://api.deezer.com/search"

# Curated fallback playlist if Deezer is unreachable
FALLBACK_TRACKS = [
    {"title": "Eye of the Tiger", "artist": "Survivor", "preview": None},
    {"title": "Lose Yourself", "artist": "Eminem", "preview": None},
    {"title": "Stronger", "artist": "Kanye West", "preview": None},
    {"title": "Till I Collapse", "artist": "Eminem ft. Nate Dogg", "preview": None},
    {"title": "Can't Hold Us", "artist": "Macklemore", "preview": None},
    {"title": "Remember The Name", "artist": "Fort Minor", "preview": None},
    {"title": "Believer", "artist": "Imagine Dragons", "preview": None},
    {"title": "Thunder", "artist": "Imagine Dragons", "preview": None},
]


async def search_workout_music(
    query: str = "workout motivation",
    limit: int = 5,
) -> list[dict]:
    """
    Search Deezer for tracks. Returns list of:
    {title, artist, preview_url, album_cover, duration_sec}
    """
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                DEEZER_SEARCH_URL,
                params={"q": query, "limit": limit},
            )
            resp.raise_for_status()
            data = resp.json()

            tracks = []
            for item in data.get("data", []):
                tracks.append({
                    "title": item.get("title", "Unknown"),
                    "artist": item.get("artist", {}).get("name", "Unknown"),
                    "preview_url": item.get("preview", ""),
                    "album_cover": item.get("album", {}).get("cover_medium", ""),
                    "duration_sec": item.get("duration", 30),
                })
            log.info("Found %d tracks for query: %s", len(tracks), query)
            return tracks if tracks else FALLBACK_TRACKS

    except Exception as e:
        log.warning("Deezer search failed: %s — using fallback", e)
        return FALLBACK_TRACKS
