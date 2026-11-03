"""AISOC FastAPI entrypoint.

Run from the backend/ directory:
    uvicorn app.main:app --reload
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import actions, alerts, cases, health, incidents, ops, settings
from app.config import get_settings
from app.db import session as db_session
from app.ingestion import scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("aisoc")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    db_session.configure(settings.database_url)
    db_session.init_db()
    log.info("AISOC starting (falcon_mock=%s, db=%s)", settings.falcon_mock, settings.database_url.split("@")[-1])
    if settings.ingest_enabled:
        scheduler.start(settings.ingest_interval_seconds)
    yield
    scheduler.stop()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AISOC", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(alerts.router)
    app.include_router(cases.router)
    app.include_router(actions.router)
    app.include_router(incidents.router)
    app.include_router(ops.router)
    app.include_router(settings.router)
    return app


app = create_app()

