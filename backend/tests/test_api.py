def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_falcon_health_mock(client):
    body = client.get("/health/falcon").json()
    assert body["ok"] is True
    assert body["mode"] == "mock"


def test_ingest_creates_alerts_and_dedups(client):
    first = client.post("/api/ingest/run").json()
    assert first["alerts"]["new"] >= 10
    total_after_first = client.get("/api/alerts").json()["total"]
    assert total_after_first == first["alerts"]["new"]

    second = client.post("/api/ingest/run").json()
    total_after_second = client.get("/api/alerts").json()["total"]
    # Only genuinely new mock alerts are added; re-fetched ones are updated, not duplicated.
    assert total_after_second == total_after_first + second["alerts"]["new"]

    status = {cp["source"]: cp for cp in client.get("/api/ingest/status").json()}
    assert status["alerts"]["last_error"] is None
    assert status["alerts"]["last_timestamp"] is not None


def test_alert_filters_and_detail(client):
    client.post("/api/ingest/run")
    page = client.get("/api/alerts", params={"min_severity": 90}).json()
    assert all(a["severity"] >= 90 for a in page["items"])

    any_alert = client.get("/api/alerts", params={"limit": 1}).json()["items"][0]
    detail = client.get(f"/api/alerts/{any_alert['id']}").json()
    assert detail["raw"]["composite_id"] == detail["falcon_id"]
    assert client.get("/api/alerts/999999").status_code == 404


def test_update_status_writes_audit(client):
    client.post("/api/ingest/run")
    alert = client.get("/api/alerts", params={"limit": 1}).json()["items"][0]

    resp = client.patch(f"/api/alerts/{alert['id']}", json={"status": "in_progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"
    assert client.patch(f"/api/alerts/{alert['id']}", json={"status": "bogus"}).status_code == 422

    events = client.get("/api/audit").json()
    change = next(e for e in events if e["event"] == "alert.status_changed")
    assert change["details"] == {"from": "new", "to": "in_progress"}


def test_stats(client):
    client.post("/api/ingest/run")
    stats = client.get("/api/stats").json()
    assert stats["total_alerts"] == sum(s["count"] for s in stats["by_severity"])
    assert [s["key"] for s in stats["by_severity"]] == ["Critical", "High", "Medium", "Low", "Informational"]


def test_workspace_hunting_detections_and_chat(client):
    client.post("/api/ingest/run")
    alert = client.get("/api/alerts", params={"limit": 1}).json()["items"][0]

    # Grounded Alert Chat Q&A
    chat = client.post(f"/api/alerts/{alert['id']}/chat", json={"question": "Should we isolate this host?"})
    assert chat.status_code == 200
    assert "[Observed]" in chat.json()["answer"]

    # Threat Hunting NL-to-FQL
    hunt = client.post("/api/hunting/query", json={"prompt": "Find encoded powershell executions", "time_range": "24h"})
    assert hunt.status_code == 200
    assert "generated_fql" in hunt.json()
    assert hunt.json()["total_matches"] >= 1

    # Custom IOC Prevention Queue
    ioc = client.post(
        "/api/hunting/ioc",
        json={"indicator_type": "sha256", "value": "a" * 64, "reason": "Confirmed malware hash"},
    )
    assert ioc.status_code == 200
    assert ioc.json()["status"] == "queued"

    # Detection Engineering Rules & Dry-Run
    rules = client.get("/api/detections/rules").json()
    assert len(rules) >= 1
    dry_run = client.post("/api/detections/test", json={"query_logic": "powershell"})
    assert dry_run.status_code == 200
    assert "evaluated_events" in dry_run.json()


