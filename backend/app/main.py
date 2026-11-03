"""AISOC FastAPI entrypoint.

Run from the backend/ directory:
    uvicorn app.main:app --reload
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import actions, alerts, cases, health, incidents, ops
from app.api import settings as settings_api
from app.config import get_settings
from app.db import session as db_session
from app.ingestion import scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("aisoc")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    cfg = get_settings()
    db_session.configure(cfg.database_url)
    db_session.init_db()
    log.info("AISOC starting (falcon_mock=%s, db=%s)", cfg.falcon_mock, cfg.database_url.split("@")[-1])
    if cfg.ingest_enabled:
        scheduler.start(cfg.ingest_interval_seconds)
    yield
    scheduler.stop()


def create_app() -> FastAPI:
    cfg = get_settings()
    app = FastAPI(title="AISOC", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(alerts.router)
    app.include_router(cases.router)
    app.include_router(actions.router)
    app.include_router(incidents.router)
    app.include_router(ops.router)
    app.include_router(settings_api.router)
    return app


app = create_app()

