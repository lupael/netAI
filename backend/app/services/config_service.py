"""Configuration management service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.core import database as db
from app.core.models import (
    ConfigAuditResult,
    ConfigChange,
    ConfigChangeStatus,
    ConfigChangeType,
)
from app.core.ml.anomaly_detector import detect_config_anomaly


def get_device_config(device_id: str) -> Optional[str]:
    return db.configs_db.get(device_id)


def audit_config(device_id: str) -> ConfigAuditResult:
    config = db.configs_db.get(device_id, "")
    result = detect_config_anomaly(config)

    issues: List[str] = []
    recommendations: List[str] = []

    if result.details and result.details != "No risky patterns detected":
        issues = [s.strip() for s in result.details.split(";") if s.strip()]

    if "Default SNMP community" in result.details:
        recommendations.append("Replace default SNMP community string with a strong, unique value")
    if "Telnet" in result.details:
        recommendations.append("Disable Telnet and enforce SSH v2 for all management access")
    if "HTTP management" in result.details:
        recommendations.append("Disable HTTP management interface and use HTTPS only")
    if "Overly permissive ACL" in result.details:
        recommendations.append("Replace 'permit ip any any' with explicit allow rules")
    if not issues:
        recommendations.append("Configuration appears compliant — continue regular audits")

    score = max(0.0, 100.0 - result.score * 20)

    return ConfigAuditResult(
        device_id=device_id,
        compliant=not result.is_anomaly,
        issues=issues,
        recommendations=recommendations,
        score=round(score, 1),
    )


def apply_config_change(
    device_id: str,
    change_type: ConfigChangeType,
    new_config: str,
    author: str = "api-user",
    comment: str = "",
) -> ConfigChange:
    old_config = db.configs_db.get(device_id, "")
    change = ConfigChange(
        id=f"cfg-{uuid.uuid4().hex[:6]}",
        device_id=device_id,
        change_type=change_type,
        old_config=old_config,
        new_config=new_config,
        status=ConfigChangeStatus.APPLIED,
        timestamp=datetime.now(timezone.utc),
        author=author,
        comment=comment,
        compliance=True,
    )
    db.configs_db[device_id] = new_config
    db.config_changes_db.append(change)
    return change


def rollback_config(device_id: str, change_id: str) -> Optional[ConfigChange]:
    target = next((c for c in db.config_changes_db if c.id == change_id and c.device_id == device_id), None)
    if not target or not target.old_config:
        return None

    rollback = ConfigChange(
        id=f"cfg-{uuid.uuid4().hex[:6]}",
        device_id=device_id,
        change_type=target.change_type,
        old_config=db.configs_db.get(device_id, ""),
        new_config=target.old_config,
        status=ConfigChangeStatus.APPLIED,
        timestamp=datetime.now(timezone.utc),
        author="rollback-system",
        comment=f"Rollback of change {change_id}",
        compliance=True,
    )
    db.configs_db[device_id] = target.old_config
    db.config_changes_db.append(rollback)
    return rollback


def get_config_history() -> List[ConfigChange]:
    return sorted(db.config_changes_db, key=lambda c: c.timestamp, reverse=True)
