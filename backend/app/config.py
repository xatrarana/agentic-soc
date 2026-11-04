"""Application settings, loaded from environment variables / `.env`."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Works whether you run from repo root or from backend/
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    app_name: str = "AISOC"
    environment: str = "dev"
    database_url: str = "sqlite:///./aisoc.db"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # CrowdStrike Falcon
    falcon_mock: bool = False
    falcon_client_id: str = ""
    falcon_client_secret: SecretStr = SecretStr("")
    falcon_cloud: str = "us1"
    falcon_base_url: str | None = None
    falcon_member_cid: str | None = None

    # Ingestion
    ingest_enabled: bool = True
    ingest_interval_seconds: int = 60
    ingest_lookback_hours: int = 24
    ingest_batch_size: int = 500

    # Anthropic Claude
    anthropic_api_key: SecretStr = SecretStr("")
    anthropic_model: str = "claude-sonnet-4-5"

    # Email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: SecretStr = SecretStr("")
    smtp_use_tls: bool = True
    smtp_from: str = "aisoc@example.com"
    alert_email_to: str = ""

    @property
    def falcon_configured(self) -> bool:
        return bool(self.falcon_client_id and self.falcon_client_secret.get_secret_value())


@lru_cache
def get_settings() -> Settings:
    return Settings()

