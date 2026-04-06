"""FastAPI application entry point."""
from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import alerts, bgp, circuits, config_mgmt, devices, ip_management, links, nlp, reports, software, threats, topology, vendors, workflows

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

# CORS — credentials are not used, so wildcard origins are safe here.
# In production, restrict allow_origins to your frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
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
