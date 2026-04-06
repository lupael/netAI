"""Topology service."""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core import database as db
from app.core import device_registry, vendors
from app.core.models import Device, DiscoveryResult, NetworkLink, Topology


def get_topology() -> Topology:
    return Topology(
        devices=db.devices_db,
        links=db.links_db,
        timestamp=datetime.now(timezone.utc),
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
        timestamp=datetime.now(timezone.utc),
        new_devices=[],
    )


def get_vendor_info(device_id: str) -> Dict[str, Any]:
    """Return vendor profile and capabilities for a given device."""
    device = next((d for d in db.devices_db if d.id == device_id), None)
    if device is None:
        raise KeyError(f"Device {device_id!r} not found")

    vendor_key = vendors.identify_vendor(device.vendor or "")
    profile = vendors.VENDOR_PROFILES.get(vendor_key)
    profile_dict = asdict(profile) if profile is not None else {}

    return {
        "device_id": device_id,
        "vendor": device.vendor,
        "vendor_key": vendor_key,
        "vendor_profile": profile_dict,
        "capabilities": device_registry.get_capabilities(vendor_key),
    }
