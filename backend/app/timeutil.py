from datetime import datetime, timezone


def as_utc(dt: datetime | None) -> datetime | None:
    """Ensure a datetime is timezone-aware UTC (SQLite returns naive datetimes)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_ts(value: str | None) -> datetime | None:
    """Parse Falcon ISO-8601 timestamps such as '2024-05-01T12:00:00.123456789Z'."""
    if not value:
        return None
    s = value.strip().replace("Z", "+00:00")
    # Python only supports up to microseconds; trim nanosecond precision.
    if "." in s:
        head, _, rest = s.partition(".")
        frac = "".join(ch for ch in rest if ch.isdigit())
        tz = rest[len(frac):]
        s = f"{head}.{frac[:6]}{tz}"
    try:
        return as_utc(datetime.fromisoformat(s))
    except ValueError:
        return None


def to_fql(dt: datetime) -> str:
    """Format a datetime for a Falcon FQL filter."""
    return as_utc(dt).strftime("%Y-%m-%dT%H:%M:%SZ")

