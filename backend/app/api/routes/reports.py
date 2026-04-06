"""Reports and analytics routes."""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/api/reports", tags=["reports"])

_NOW = datetime.now(timezone.utc)


def _dt(hours_ago: float = 0, days_ago: float = 0) -> str:
    return (_NOW - timedelta(hours=hours_ago, days=days_ago)).isoformat()


@router.get("/summary")
async def get_summary_report() -> Dict[str, Any]:
    """Return a high-level network summary report."""
    from app.core import database as db

    total = len(db.devices_db)
    online = sum(1 for d in db.devices_db if d.status.value == "online")
    avg_cpu = round(sum(d.cpu_usage for d in db.devices_db) / total, 1) if total else 0.0
    avg_mem = round(sum(d.memory_usage for d in db.devices_db) / total, 1) if total else 0.0
    total_links = len(db.links_db)
    active_links = sum(1 for lnk in db.links_db if lnk.status.value == "up")
    avg_util = round(sum(lnk.utilization for lnk in db.links_db) / total_links, 1) if total_links else 0.0
    active_threats = sum(1 for t in db.threats_db if t.status.value in ("active", "investigating"))

    return {
        "generated_at": _NOW.isoformat(),
        "period": "last_30_days",
        "devices": {
            "total": total,
            "online": online,
            "online_pct": round(online / total * 100, 1) if total else 0,
        },
        "network": {
            "total_links": total_links,
            "active_links": active_links,
            "avg_utilization_pct": avg_util,
        },
        "performance": {
            "avg_cpu_pct": avg_cpu,
            "avg_memory_pct": avg_mem,
        },
        "security": {
            "active_threats": active_threats,
            "total_alerts": len(db.alerts_db),
        },
    }


@router.get("/uptime")
async def get_uptime_report() -> List[Dict[str, Any]]:
    """Return device uptime statistics for the last 30 days."""
    from app.core import database as db

    result = []
    for device in db.devices_db:
        uptime_days = device.uptime / 86400
        uptime_pct = round(min(100.0, (uptime_days / 30) * 100), 2)
        result.append({
            "device_id": device.id,
            "device_name": device.name,
            "uptime_seconds": device.uptime,
            "uptime_days": round(uptime_days, 1),
            "uptime_pct_30d": uptime_pct,
            "status": device.status.value,
        })

    return sorted(result, key=lambda r: r["uptime_pct_30d"], reverse=True)


@router.get("/bandwidth")
async def get_bandwidth_report() -> List[Dict[str, Any]]:
    """Return 24-hour bandwidth utilization data points (hourly)."""
    random.seed(42)
    data_points: List[Dict[str, Any]] = []
    for hour in range(24):
        ts = _NOW - timedelta(hours=23 - hour)
        base_in = 300 + 200 * math.sin(hour * math.pi / 12)
        base_out = 150 + 100 * math.sin(hour * math.pi / 12 + 1)
        data_points.append({
            "timestamp": ts.isoformat(),
            "hour": f"{ts.hour:02d}:00",
            "inbound_mbps": round(base_in + random.gauss(0, 20), 1),
            "outbound_mbps": round(base_out + random.gauss(0, 10), 1),
            "utilization_pct": round(min(100.0, (base_in / 1000) * 100 + random.gauss(0, 3)), 1),
        })
    return data_points


@router.get("/incidents")
async def get_incidents_report() -> List[Dict[str, Any]]:
    """Return rolled-up incident report combining threats and alerts."""
    from app.core import database as db

    incidents: List[Dict[str, Any]] = []

    for threat in db.threats_db:
        incidents.append({
            "id": threat.id,
            "type": "threat",
            "subtype": threat.type.value,
            "severity": threat.severity.value,
            "description": threat.description,
            "affected_devices": threat.affected_devices,
            "detected_at": threat.timestamp.isoformat(),
            "status": threat.status.value,
            "duration_min": None,
        })

    for alert in db.alerts_db:
        incidents.append({
            "id": alert.id,
            "type": "alert",
            "subtype": alert.type.value,
            "severity": alert.severity.value,
            "description": alert.message,
            "affected_devices": [alert.device_id] if alert.device_id else [],
            "detected_at": alert.timestamp.isoformat(),
            "status": "acknowledged" if alert.acknowledged else "open",
            "duration_min": None,
        })

    return sorted(incidents, key=lambda inc: inc["detected_at"], reverse=True)
