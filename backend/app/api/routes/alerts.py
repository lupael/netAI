"""Alerts routes."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Body, HTTPException

from app.core import database as db
from app.core.models import Alert, AlertStats, ThreatSeverity

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_all_alerts():
    """Return all alerts, newest first."""
    return sorted(db.alerts_db, key=lambda a: a.timestamp, reverse=True)


@router.get("/stats", response_model=AlertStats)
async def get_alert_stats():
    """Return aggregate alert statistics."""
    alerts = db.alerts_db
    by_severity = {s.value: 0 for s in ThreatSeverity}
    by_type: dict = {}
    for a in alerts:
        by_severity[a.severity.value] += 1
        by_type[a.type.value] = by_type.get(a.type.value, 0) + 1
    return AlertStats(
        total=len(alerts),
        acknowledged=sum(1 for a in alerts if a.acknowledged),
        unacknowledged=sum(1 for a in alerts if not a.acknowledged),
        by_severity=by_severity,
        by_type=by_type,
    )


@router.post("/{alert_id}/acknowledge", response_model=Alert)
async def acknowledge_alert(
    alert_id: str,
    acknowledged_by: str = Body("noc-operator", embed=True),
):
    """Acknowledge an alert."""
    for i, alert in enumerate(db.alerts_db):
        if alert.id == alert_id:
            db.alerts_db[i] = alert.model_copy(
                update={
                    "acknowledged": True,
                    "acknowledged_by": acknowledged_by,
                    "acknowledged_at": datetime.now(timezone.utc),
                }
            )
            return db.alerts_db[i]
    raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
