"""Pull alerts and incidents from Falcon into the local database."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import audit
from app.config import Settings, get_settings
from app.db import session as db_session
from app.db.models import Alert, Incident, IngestCheckpoint
from app.ingestion.normalize import normalize_alert, normalize_incident
from app.integrations.falcon import FalconBackend, get_falcon
from app.timeutil import as_utc

log = logging.getLogger(__name__)

# Fields Falcon may change after creation; refreshed on re-ingest.
ALERT_MUTABLE_FIELDS = ("falcon_status", "severity", "severity_name", "raw")


def _checkpoint(db: Session, source: str) -> IngestCheckpoint:
    cp = db.get(IngestCheckpoint, source)
    if cp is None:
        cp = IngestCheckpoint(source=source)
        db.add(cp)
    return cp


def _since(cp: IngestCheckpoint, settings: Settings) -> datetime:
    return as_utc(cp.last_timestamp) or (
        datetime.now(timezone.utc) - timedelta(hours=settings.ingest_lookback_hours)
    )


def ingest_alerts(db: Session, falcon: FalconBackend, settings: Settings) -> dict[str, int]:
    cp = _checkpoint(db, "alerts")
    since = _since(cp, settings)
    raws = falcon.fetch_alerts(since, settings.ingest_batch_size)

    new = updated = 0
    high_water = since
    for raw in raws:
        data = normalize_alert(raw)
        if not data["falcon_id"]:
            continue
        existing = db.scalar(select(Alert).where(Alert.falcon_id == data["falcon_id"]))
        if existing is None:
            db.add(Alert(**data))
            new += 1
        else:
            for field in ALERT_MUTABLE_FIELDS:
                setattr(existing, field, data[field])
            updated += 1
        if data["falcon_created_at"] and data["falcon_created_at"] > high_water:
            high_water = data["falcon_created_at"]

    cp.last_timestamp = high_water
    cp.last_run_at = datetime.now(timezone.utc)
    cp.last_fetched = len(raws)
    cp.last_new = new
    cp.last_error = None
    if new:
        audit.record(db, "system", "ingest.alerts", "ingest", "alerts", {"fetched": len(raws), "new": new})
    db.commit()
    return {"fetched": len(raws), "new": new, "updated": updated}


def ingest_incidents(db: Session, falcon: FalconBackend, settings: Settings) -> dict[str, int]:
    cp = _checkpoint(db, "incidents")
    since = _since(cp, settings)
    raws = falcon.fetch_incidents(since, settings.ingest_batch_size)

    new = updated = 0
    high_water = since
    for raw in raws:
        data = normalize_incident(raw)
        if not data["falcon_id"]:
            continue
        existing = db.scalar(select(Incident).where(Incident.falcon_id == data["falcon_id"]))
        if existing is None:
            db.add(Incident(**data))
            new += 1
        else:
            for field, value in data.items():
                setattr(existing, field, value)
            updated += 1
        if data["modified_at"] and data["modified_at"] > high_water:
            high_water = data["modified_at"]

    cp.last_timestamp = high_water
    cp.last_run_at = datetime.now(timezone.utc)
    cp.last_fetched = len(raws)
    cp.last_new = new
    cp.last_error = None
    if new:
        audit.record(db, "system", "ingest.incidents", "ingest", "incidents", {"fetched": len(raws), "new": new})
    db.commit()
    return {"fetched": len(raws), "new": new, "updated": updated}


def _record_error(source: str, exc: Exception) -> None:
    db = db_session.new_session()
    try:
        cp = _checkpoint(db, source)
        cp.last_run_at = datetime.now(timezone.utc)
        cp.last_error = str(exc)[:2000]
        db.commit()
    finally:
        db.close()


def run_ingestion_cycle(falcon: FalconBackend | None = None) -> dict[str, Any]:
    """Run one full ingestion pass. Each source fails independently."""
    settings = get_settings()
    results: dict[str, Any] = {}
    try:
        falcon = falcon or get_falcon()
    except Exception as exc:  # misconfiguration
        log.error("Falcon backend unavailable: %s", exc)
        return {"error": str(exc)}

    for source, fn in (("alerts", ingest_alerts), ("incidents", ingest_incidents)):
        db = db_session.new_session()
        try:
            results[source] = fn(db, falcon, settings)
        except Exception as exc:
            db.rollback()
            log.exception("Ingestion of %s failed", source)
            _record_error(source, exc)
            results[source] = {"error": str(exc)}
        finally:
            db.close()
    return results

