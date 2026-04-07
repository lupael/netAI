"""FastAPI application entry point."""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time as _time
from collections import defaultdict as _defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import (
    alerts, bgp, circuits, config_mgmt, devices, ip_management,
    links, nlp, reports, software, threats, topology, vendors, workflows,
)
from app.api.routes import audit, auth
from app.core.auth import decode_token

logger = logging.getLogger("netai")

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket connected — total=%d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info("WebSocket disconnected — total=%d", len(self.active_connections))

    async def broadcast(self, message: dict) -> None:
        disconnected: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception:
                disconnected.append(connection)
        for ws in disconnected:
            self.active_connections.remove(ws)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Request body size limit middleware (1 MB)
# ---------------------------------------------------------------------------

class LimitBodySizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_bytes: int = 1_048_576) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                parsed = int(content_length)
            except (TypeError, ValueError):
                return Response(status_code=400, content="Content-Length must be a valid number")
            if parsed < 0:
                return Response(status_code=400, content="Content-Length cannot be negative")
            if parsed > self.max_bytes:
                return Response(status_code=413, content="Request body too large")
        return await call_next(request)


# ---------------------------------------------------------------------------
# Simple in-memory rate limiter middleware
# Limits: 30 req/min on /api/nlp/query, 10 req/min on /api/auth/login
# ---------------------------------------------------------------------------

_rate_windows: dict = _defaultdict(list)
_rate_window_last_seen: dict = {}
_rate_lock = asyncio.Lock()
_RATE_LIMITS = {
    "/api/nlp/query": (30, 60),
    "/api/auth/login": (10, 60),
}
_RATE_LIMIT_MAX_KEYS = 10_000
_RATE_LIMIT_MAX_WINDOW = max(w for _, w in _RATE_LIMITS.values())
_rate_request_count = 0
_RATE_CLEANUP_INTERVAL = 256


def _cleanup_rate_windows(now: float) -> None:
    """Evict stale and excess entries from the rate-limit window dict.

    A key is stale when its timestamp list is empty (all entries expired)
    *and* no request has been seen for at least one full rate-limit window —
    both checks are needed so we don't prematurely remove a key that was
    just written but hasn't been seen yet after the last window expiry.
    """
    stale = [
        key for key, timestamps in list(_rate_windows.items())
        # Empty list means all timestamps have expired; only remove if the key
        # has also been idle for at least one window to avoid a race with
        # concurrent writers that just cleared the list.
        if not timestamps and now - _rate_window_last_seen.get(key, 0.0) >= _RATE_LIMIT_MAX_WINDOW
    ]
    for key in stale:
        _rate_windows.pop(key, None)
        _rate_window_last_seen.pop(key, None)

    overflow = len(_rate_windows) - _RATE_LIMIT_MAX_KEYS
    if overflow > 0:
        oldest = sorted(_rate_window_last_seen.items(), key=lambda x: x[1])[:overflow]
        for key, _ in oldest:
            _rate_windows.pop(key, None)
            _rate_window_last_seen.pop(key, None)


class PathRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        global _rate_request_count
        path = request.url.path
        if path in _RATE_LIMITS:
            max_calls, window = _RATE_LIMITS[path]
            client_ip = (request.client.host if request.client else "unknown")
            key = f"{client_ip}:{path}"
            now = _time.monotonic()
            async with _rate_lock:
                _rate_request_count += 1
                if _rate_request_count % _RATE_CLEANUP_INTERVAL == 0:
                    _cleanup_rate_windows(now)
                _rate_windows[key] = [t for t in _rate_windows[key] if now - t < window]
                _rate_window_last_seen[key] = now
                if len(_rate_windows[key]) >= max_calls:
                    return Response(
                        status_code=429,
                        content="Too Many Requests",
                        headers={"Retry-After": str(window)},
                    )
                _rate_windows[key].append(now)
        return await call_next(request)


# ---------------------------------------------------------------------------
# Background task — emit periodic network telemetry over WebSocket
# ---------------------------------------------------------------------------

async def _telemetry_broadcaster() -> None:
    """Emit a lightweight telemetry snapshot to all connected clients every 5 s."""
    from app.core import database as db
    import random

    while True:
        await asyncio.sleep(5)
        if not manager.active_connections:
            continue
        try:
            # Simulate small real-time fluctuations
            random.seed()
            sample_device = random.choice(db.devices_db)
            payload = {
                "event": "telemetry",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "device_id": sample_device.id,
                "device_name": sample_device.name,
                "cpu_usage": round(
                    max(0, min(100, sample_device.cpu_usage + random.gauss(0, 3))), 1
                ),
                "memory_usage": round(
                    max(0, min(100, sample_device.memory_usage + random.gauss(0, 1.5))), 1
                ),
                "active_threats": sum(
                    1 for t in db.threats_db if t.status.value in ("active", "investigating")
                ),
                "unacked_alerts": sum(1 for a in db.alerts_db if not a.acknowledged),
            }
            await manager.broadcast(payload)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Telemetry broadcast error: %s", exc)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_telemetry_broadcaster())
    logger.info("netAI backend started — telemetry broadcaster running")
    yield
    task.cancel()
    logger.info("netAI backend shutting down")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="netAI — AI Network Monitoring API",
    description=(
        "Full-stack AI-powered network monitoring system. "
        "Provides topology discovery, threat detection, configuration management, "
        "device health analytics, software lifecycle management, and NLP ChatOps."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — origins configurable via ALLOWED_ORIGINS env var (comma-separated)
# ---------------------------------------------------------------------------
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
_origins = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body size limit (1 MB)
app.add_middleware(LimitBodySizeMiddleware, max_bytes=1_048_576)
# Path-level rate limiting (30/min NLP, 10/min auth)
app.add_middleware(PathRateLimitMiddleware)

# ---------------------------------------------------------------------------
# Prometheus metrics — exposes /metrics endpoint
# ---------------------------------------------------------------------------
Instrumentator().instrument(app).expose(app)

# ---------------------------------------------------------------------------
# Mount routers
# ---------------------------------------------------------------------------

app.include_router(topology.router)
app.include_router(threats.router)
app.include_router(config_mgmt.router)
app.include_router(devices.router)
app.include_router(software.router)
app.include_router(alerts.router)
app.include_router(nlp.router)
app.include_router(vendors.router)
app.include_router(bgp.router)
app.include_router(circuits.router)
app.include_router(workflows.router)
app.include_router(ip_management.router)
app.include_router(links.router)
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(audit.router)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
):
    """WebSocket endpoint for real-time telemetry.

    Requires a valid JWT token via the ``?token=<jwt>`` query parameter.
    Connections without a token or with an invalid/expired token are rejected
    with close code 1008 (Policy Violation).
    """
    if not token:
        await websocket.close(code=1008)
        return
    try:
        decode_token(token)
    except Exception:
        await websocket.close(code=1008)
        return
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back with a timestamp so clients can confirm connectivity
            await websocket.send_text(
                json.dumps({"event": "pong", "echo": data, "timestamp": datetime.now(timezone.utc).isoformat()})
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ---------------------------------------------------------------------------
# Health + root endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
async def health_check():
    from app.core import database as db
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "devices": len(db.devices_db),
        "active_threats": sum(1 for t in db.threats_db if t.status.value in ("active", "investigating")),
        "unacked_alerts": sum(1 for a in db.alerts_db if not a.acknowledged),
    }


@app.get("/api/dashboard/kpi", tags=["system"])
async def dashboard_kpi():
    """Return KPI summary for the dashboard."""
    from app.core import database as db
    active_devices = sum(1 for d in db.devices_db if d.status.value in ("online", "degraded"))
    active_threats = sum(1 for t in db.threats_db if t.status.value in ("active", "investigating"))
    config_issues = sum(
        1 for c in db.config_changes_db
        if c.status.value == "applied" and c.compliance is False
    )
    pending_updates = sum(
        1 for u in db.software_updates_db
        if u.status.value in ("pending", "scheduled")
    )
    critical_alerts = sum(
        1 for a in db.alerts_db
        if not a.acknowledged and a.severity.value == "critical"
    )
    # Simple health score: 100 - (active_threats * 5) - (config_issues * 3) - (not-online devices * 2)
    offline = len(db.devices_db) - active_devices
    health_score = max(0, min(100, 100 - active_threats * 5 - config_issues * 3 - offline * 2))
    return {
        "total_devices": len(db.devices_db),
        "active_devices": active_devices,
        "active_threats": active_threats,
        "config_issues": config_issues,
        "pending_updates": pending_updates,
        "critical_alerts": critical_alerts,
        "network_health_score": health_score,
    }


@app.get("/", tags=["system"])
async def root():
    return JSONResponse(
        content={
            "name": "netAI API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "websocket": "ws://localhost:8000/ws",
        }
    )
