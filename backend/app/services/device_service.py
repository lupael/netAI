"""Device health and metrics service."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.core import database as db
from app.core.models import Device, DeviceHealth
from app.core.ml.anomaly_detector import detect_cpu_anomaly, predict_failure_probability


def get_all_devices() -> List[Device]:
    return db.devices_db


def get_device(device_id: str) -> Optional[Device]:
    return next((d for d in db.devices_db if d.id == device_id), None)


def get_device_health(device_id: str) -> Optional[DeviceHealth]:
    device = get_device(device_id)
    if not device:
        return None

    metrics_history = db.metrics_db.get(device_id, {})
    cpu_history: List[float] = metrics_history.get("cpu", [])
    mem_history: List[float] = metrics_history.get("memory", [])

    cpu_anomaly = detect_cpu_anomaly(device.cpu_usage, cpu_history)
    failure_pred = predict_failure_probability(cpu_history, mem_history, device.uptime)

    health_alerts: List[str] = []
    if device.cpu_usage > 90:
        health_alerts.append(f"Critical CPU usage: {device.cpu_usage:.1f}%")
    elif device.cpu_usage > 80:
        health_alerts.append(f"High CPU usage: {device.cpu_usage:.1f}%")
    if device.memory_usage > 85:
        health_alerts.append(f"Critical memory usage: {device.memory_usage:.1f}%")
    elif device.memory_usage > 75:
        health_alerts.append(f"High memory usage: {device.memory_usage:.1f}%")
    if device.disk_usage > 90:
        health_alerts.append(f"Critical disk usage: {device.disk_usage:.1f}%")
    if cpu_anomaly.is_anomaly:
        health_alerts.append(f"CPU anomaly detected (score={cpu_anomaly.score})")

    cpu_vals = [device.cpu_usage] + cpu_history[-5:]
    mem_vals = [device.memory_usage] + mem_history[-5:]
    disk_vals = [device.disk_usage]

    health_score = 100.0 - (
        max(0, device.cpu_usage - 70) * 0.5
        + max(0, device.memory_usage - 70) * 0.4
        + max(0, device.disk_usage - 80) * 0.3
    )
    health_score = max(0.0, min(100.0, health_score))

    return DeviceHealth(
        device_id=device_id,
        metrics={
            "cpu_usage": device.cpu_usage,
            "memory_usage": device.memory_usage,
            "disk_usage": device.disk_usage,
            "uptime_days": round(device.uptime / 86400, 1),
            "cpu_trend": cpu_vals,
            "memory_trend": mem_vals,
            "disk_trend": disk_vals,
            "cpu_anomaly": cpu_anomaly.model_dump(),
        },
        predictions={
            "failure_probability": failure_pred["probability"],
            "risk_level": failure_pred["risk_level"],
            "contributing_factors": failure_pred["factors"],
        },
        alerts=health_alerts,
        health_score=round(health_score, 1),
    )


def get_device_metrics(device_id: str) -> Optional[Dict[str, Any]]:
    device = get_device(device_id)
    if not device:
        return None
    return db.metrics_db.get(device_id)


def get_failure_predictions() -> List[Dict[str, Any]]:
    predictions = []
    for device in db.devices_db:
        metrics = db.metrics_db.get(device.id, {})
        cpu_history = metrics.get("cpu", [])
        mem_history = metrics.get("memory", [])
        pred = predict_failure_probability(cpu_history, mem_history, device.uptime)
        if pred["risk_level"] != "unknown":
            predictions.append({
                "device_id": device.id,
                "device_name": device.name,
                **pred,
            })
    return sorted(predictions, key=lambda x: x["probability"], reverse=True)
