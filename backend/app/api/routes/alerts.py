"""Alerts routes."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException

from app.core import database as db
from app.core.auth import get_current_user
from app.core.models import Alert, AlertStats, ThreatSeverity

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", summary="List all alerts")
async def get_all_alerts(skip: int = 0, limit: int = 50):
    """Return paginated alerts, newest first."""
    alerts = sorted(db.alerts_db, key=lambda a: a.timestamp, reverse=True)
    return alerts[skip : skip + limit]


@router.get("/stats", response_model=AlertStats, summary="Get alert statistics")
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


@router.post(
    "/{alert_id}/acknowledge",
    response_model=Alert,
    summary="Acknowledge an alert",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Alert not found"}},
)
async def acknowledge_alert(
    alert_id: str,
    acknowledged_by: str = Body("noc-operator", embed=True),
    _: str = Depends(get_current_user),
):
    """Acknowledge an alert by ID."""
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


@router.delete(
    "/{alert_id}",
    status_code=204,
    summary="Delete an alert",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Alert not found"}},
)
async def delete_alert(alert_id: str, _: str = Depends(get_current_user)):
    """Permanently delete an alert by ID."""
    for i, alert in enumerate(db.alerts_db):
        if alert.id == alert_id:
            db.alerts_db.pop(i)
            return
    raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
