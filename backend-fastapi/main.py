"""
TrainFree — AI Fitness Coach Platform
Entry point. Wires routers, middleware, and DB initialization.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import onboarding, nutrition, workout, vision, realtime
from app.schemas.responses import HealthCheckResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await init_db()
    yield


app = FastAPI(
    title="TrainFree API",
    description="AI-powered personal fitness coach & nutrition planner",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for local dev (file:// pages, localhost variants)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated PDFs as static files
app.mount("/files", StaticFiles(directory=settings.PDF_OUTPUT_DIR), name="files")

# Routers
app.include_router(onboarding.router, prefix="/api")
app.include_router(nutrition.router, prefix="/api")
app.include_router(workout.router, prefix="/api")
app.include_router(vision.router, prefix="/api")
app.include_router(realtime.router, prefix="/api")


@app.get("/api", response_model=HealthCheckResponse)
async def health_check():
    return HealthCheckResponse(status="ok", version="1.0.0")
