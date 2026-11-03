import os
import sys
from pathlib import Path

import pytest

# Force safe test settings BEFORE the app is imported (env vars override .env).
os.environ["FALCON_MOCK"] = "true"
os.environ["INGEST_ENABLED"] = "false"
os.environ["ANTHROPIC_API_KEY"] = ""

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.integrations.falcon import get_falcon  # noqa: E402


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    get_settings.cache_clear()
    get_falcon.cache_clear()
    from app.main import create_app

    with TestClient(create_app()) as c:
        yield c
    get_settings.cache_clear()
    get_falcon.cache_clear()

