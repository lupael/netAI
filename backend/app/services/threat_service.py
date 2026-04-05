"""Threat detection service."""
from __future__ import annotations

from typing import List, Optional

from app.core import database as db
from app.core.models import ThreatAlert, ThreatSeverity, ThreatStats, ThreatStatus


def get_all_threats() -> List[ThreatAlert]:
    return db.threats_db


def get_active_threats() -> List[ThreatAlert]:
    return [t for t in db.threats_db if t.status in (ThreatStatus.ACTIVE, ThreatStatus.INVESTIGATING)]


def mitigate_threat(threat_id: str) -> Optional[ThreatAlert]:
    for i, threat in enumerate(db.threats_db):
        if threat.id == threat_id:
            db.threats_db[i] = threat.model_copy(update={"status": ThreatStatus.MITIGATED})
            return db.threats_db[i]
    return None


def get_threat_stats() -> ThreatStats:
    threats = db.threats_db
    by_severity: dict = {s.value: 0 for s in ThreatSeverity}
    by_type: dict = {}

    for t in threats:
        by_severity[t.severity.value] += 1
        by_type[t.type.value] = by_type.get(t.type.value, 0) + 1

    return ThreatStats(
        total=len(threats),
        active=sum(1 for t in threats if t.status == ThreatStatus.ACTIVE),
        mitigated=sum(1 for t in threats if t.status == ThreatStatus.MITIGATED),
        by_severity=by_severity,
        by_type=by_type,
    )
