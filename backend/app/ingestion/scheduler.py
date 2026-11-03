"""Background polling scheduler."""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.ingestion.service import run_ingestion_cycle

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start(interval_seconds: int) -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        run_ingestion_cycle,
        "interval",
        seconds=interval_seconds,
        id="falcon_ingest",
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now(timezone.utc),  # run immediately, then every interval
    )
    _scheduler.start()
    log.info("Ingestion scheduler started (every %ss)", interval_seconds)


def stop() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
