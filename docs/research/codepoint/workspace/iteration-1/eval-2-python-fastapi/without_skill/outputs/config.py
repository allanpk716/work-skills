"""Application configuration with environment variable support."""

import os


class Settings:
    """Application settings loaded from environment variables."""

    # PostgreSQL
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/orderdb"
    )
    DATABASE_ECHO: bool = os.environ.get("DATABASE_ECHO", "false").lower() == "true"

    # Redis
    REDIS_URL: str = os.environ.get(
        "REDIS_URL",
        "redis://localhost:6379/0"
    )
    CACHE_TTL_SECONDS: int = int(os.environ.get("CACHE_TTL_SECONDS", "300"))

    # Application
    APP_NAME: str = "Order Service"
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"


settings = Settings()
