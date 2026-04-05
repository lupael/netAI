"""Topology service."""
from __future__ import annotations

from datetime import datetime
from typing import List

from app.core import database as db
from app.core.models import Device, DiscoveryResult, NetworkLink, Topology


def get_topology() -> Topology:
    return Topology(
        devices=db.devices_db,
        links=db.links_db,
        timestamp=datetime.utcnow(),
    )


def get_devices() -> List[Device]:
    return db.devices_db


def get_links() -> List[NetworkLink]:
    return db.links_db


def discover_topology() -> DiscoveryResult:
    """Simulate network discovery — in production this would run SNMP/LLDP discovery."""
    return DiscoveryResult(
        discovered=len(db.devices_db),
        updated=2,
        timestamp=datetime.utcnow(),
        new_devices=[],
    )
