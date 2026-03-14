"""
Application configuration loaded from environment variables.
Checks .env in the backend dir first, then the project root.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── OpenAI ──
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:///./trainfree.db"

    # ── External APIs ──
    API_NINJAS_KEY: str = ""

    # ── Roboflow / Vision ──
    ROBOFLOW_API_KEY: str = ""
    ROBOFLOW_MODEL_ID: str = "yolov8n-pose"
    ROBOFLOW_CONFIDENCE: float = 0.5

    # ── PDF ──
    PDF_OUTPUT_DIR: str = "./generated_pdfs"

    # ── AWS SES Email ──
    SES_SMTP_HOST: str = "email-smtp.ap-south-1.amazonaws.com"
    SES_SMTP_PORT: int = 587
    SES_SMTP_USER: str = ""
    SES_SMTP_PASSWORD: str = ""
    SES_FROM_EMAIL: str = "hackathon@beyondscale.tech"
    SES_FROM_NAME: str = "TrainFree by BeyondScale"

    # ── App ──
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
