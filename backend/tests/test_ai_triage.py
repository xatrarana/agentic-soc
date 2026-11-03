"""Tests for AI triage agent, cases, and SOAR human-in-the-loop action approval."""

from app.db.models import Action, Alert, Case


def test_triage_alert_endpoint_and_case_generation(client):
    # Ingest some alerts
    client.post("/api/ingest/run")

    alerts = client.get("/api/alerts").json()["items"]
    assert len(alerts) > 0
    first_alert = alerts[0]

    # Trigger triage on the alert
    res = client.post(f"/api/alerts/{first_alert['id']}/triage")
    assert res.status_code == 200
    triaged = res.json()

    assert triaged["status"] == "triaged"
    assert triaged["ai_verdict"] in ("true_positive", "false_positive", "needs_review")
    assert triaged["ai_confidence"] is not None
    assert triaged["ai_summary"] is not None
    assert triaged["case_id"] is not None

    # Verify associated case was created
    case = client.get(f"/api/cases/{triaged['case_id']}").json()
    assert case["id"] == triaged["case_id"]
    assert case["verdict"] == triaged["ai_verdict"]
    assert len(case["alerts"]) >= 1


def test_triage_pending_batch(client):
    client.post("/api/ingest/run")

    res = client.post("/api/alerts/triage-pending", params={"limit": 5})
    assert res.status_code == 200
    assert res.json()["triaged"] >= 1

    # Verify audit log recorded triage events
    audit_events = client.get("/api/audit").json()
    assert any(e["event"] == "alert.triaged" for e in audit_events)


def test_soar_human_in_the_loop_action_lifecycle(client):
    client.post("/api/ingest/run")
    alerts = client.get("/api/alerts").json()["items"]

    # Pick an alert and triage it
    alert = alerts[0]
    client.post(f"/api/alerts/{alert['id']}/triage")

    # Fetch actions
    actions = client.get("/api/actions").json()

    if not actions:
        # If no destructive action was proposed by heuristic for this alert, create one to test the approval queue
        from app.db import session as db_session
        db = db_session.new_session()
        act = Action(
            alert_id=alert["id"],
            action_type="contain_host",
            risk_tier="destructive",
            status="pending_approval",
            params={"device_id": "test-dev-1", "hostname": "TEST-HOST"},
            proposed_by="test",
        )
        db.add(act)
        db.commit()
        act_id = act.id
        db.close()
    else:
        act_id = actions[0]["id"]

    # Test reject action
    reject_res = client.post(
        f"/api/actions/{act_id}/decide",
        json={"decision": "rejected", "decided_by": "analyst-marcus", "comment": "Legitimate admin script"},
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "rejected"
    assert reject_res.json()["decided_by"] == "analyst-marcus"

    # Test approve action on a pending action
    from app.db import session as db_session
    db = db_session.new_session()
    pending_act = Action(
        alert_id=alert["id"],
        action_type="contain_host",
        risk_tier="destructive",
        status="pending_approval",
        params={"device_id": "test-dev-2", "hostname": "TEST-HOST-2"},
        proposed_by="claude-agent",
    )
    db.add(pending_act)
    db.commit()
    pending_id = pending_act.id
    db.close()

    approve_res = client.post(
        f"/api/actions/{pending_id}/decide",
        json={"decision": "approved", "decided_by": "analyst-alex"},
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "executed"
    assert approved_data["decided_by"] == "analyst-alex"

    # Verify audit trail contains action.executed
    audit_events = client.get("/api/audit").json()
    assert any(e["event"] == "action.executed" for e in audit_events)
