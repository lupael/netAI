"""Integration tests for key API routes using FastAPI TestClient."""
from __future__ import annotations

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# System endpoints
# ---------------------------------------------------------------------------

def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "devices" in body


def test_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "netAI API"


def test_dashboard_kpi(client: TestClient) -> None:
    response = client.get("/api/dashboard/kpi")
    assert response.status_code == 200
    body = response.json()
    assert "total_devices" in body
    assert "network_health_score" in body


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

def test_login_success(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_invalid(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_auth(client: TestClient, auth_headers: dict) -> None:
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "admin"


# ---------------------------------------------------------------------------
# Devices
# ---------------------------------------------------------------------------

def test_get_devices(client: TestClient) -> None:
    response = client.get("/api/devices")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_devices_pagination(client: TestClient) -> None:
    all_resp = client.get("/api/devices")
    page_resp = client.get("/api/devices?skip=0&limit=3")
    assert page_resp.status_code == 200
    assert len(page_resp.json()) <= 3
    assert len(page_resp.json()) <= len(all_resp.json())


def test_get_device_not_found(client: TestClient) -> None:
    response = client.get("/api/devices/nonexistent-id")
    assert response.status_code == 404


def test_put_device_requires_auth(client: TestClient) -> None:
    response = client.put("/api/devices/dev-001", json={"name": "new-name"})
    assert response.status_code == 401


def test_put_device_with_auth(client: TestClient, auth_headers: dict) -> None:
    response = client.put(
        "/api/devices/dev-001",
        json={"location": "Test Location"},
        headers=auth_headers,
    )
    assert response.status_code in (200, 404)


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

def test_get_alerts(client: TestClient) -> None:
    response = client.get("/api/alerts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_alert_stats(client: TestClient) -> None:
    response = client.get("/api/alerts/stats")
    assert response.status_code == 200
    body = response.json()
    assert "total" in body


def test_acknowledge_alert_requires_auth(client: TestClient) -> None:
    response = client.post("/api/alerts/some-id/acknowledge")
    assert response.status_code == 401


def test_delete_alert_requires_auth(client: TestClient) -> None:
    response = client.delete("/api/alerts/some-id")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Threats
# ---------------------------------------------------------------------------

def test_get_threats(client: TestClient) -> None:
    response = client.get("/api/threats")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_active_threats(client: TestClient) -> None:
    response = client.get("/api/threats/active")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_mitigate_threat_requires_auth(client: TestClient) -> None:
    response = client.post("/api/threats/some-id/mitigate")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------

def test_get_audit_log(client: TestClient) -> None:
    response = client.get("/api/audit-log")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_audit_log_pagination(client: TestClient) -> None:
    response = client.get("/api/audit-log?skip=0&limit=5")
    assert response.status_code == 200
    assert len(response.json()) <= 5


# ---------------------------------------------------------------------------
# Config management
# ---------------------------------------------------------------------------

def test_get_config_history(client: TestClient) -> None:
    response = client.get("/api/config/history")
    assert response.status_code == 200


def test_audit_config_requires_auth(client: TestClient) -> None:
    response = client.post("/api/config/dev-001/audit")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------

def test_get_workflows(client: TestClient) -> None:
    response = client.get("/api/workflows")
    assert response.status_code == 200


def test_trigger_workflow_requires_auth(client: TestClient) -> None:
    response = client.post("/api/workflows/backup_all_configs/run")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Metrics endpoint (Prometheus)
# ---------------------------------------------------------------------------

def test_metrics_endpoint(client: TestClient) -> None:
    response = client.get("/metrics")
    assert response.status_code == 200
