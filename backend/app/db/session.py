"""Database engine / session management."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.models import Base

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def configure(database_url: str) -> None:
    """(Re)configure the engine. Called on app startup and in tests."""
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    _engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)
    _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    Base.metadata.create_all(get_engine())


def get_engine() -> Engine:
    if _engine is None:
        raise RuntimeError("Database not configured; call configure() first")
    return _engine


def new_session() -> Session:
    if _session_factory is None:
        raise RuntimeError("Database not configured; call configure() first")
    return _session_factory()


def get_db() -> Iterator[Session]:
    """FastAPI dependency."""
    db = new_session()
    try:
        yield db
    finally:
        db.close()

