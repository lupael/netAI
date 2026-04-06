"""Vendor management routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core import device_registry, vendors
from app.services import topology_service

router = APIRouter(prefix="/api", tags=["vendors"])


@router.get("/vendors")
def list_vendors():
    """List all vendor profiles."""
    return {
        key: {
            "name": profile.name,
            "os_family": profile.os_family,
            "snmp_oid_prefix": profile.snmp_oid_prefix,
            "identify_keywords": profile.identify_keywords,
            "cli_command_map": profile.cli_command_map,
            "supported_protocols": profile.supported_protocols,
        }
        for key, profile in vendors.VENDOR_PROFILES.items()
    }


@router.get("/vendors/{vendor_key}")
def get_vendor(vendor_key: str):
    """Get a specific vendor profile by key."""
    try:
        profile = vendors.get_vendor_profile(vendor_key)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_key!r} not found")
    return {
        "vendor_key": vendor_key,
        "name": profile.name,
        "os_family": profile.os_family,
        "snmp_oid_prefix": profile.snmp_oid_prefix,
        "identify_keywords": profile.identify_keywords,
        "cli_command_map": profile.cli_command_map,
        "supported_protocols": profile.supported_protocols,
    }


@router.get("/vendors/{vendor_key}/capabilities")
def get_vendor_capabilities(vendor_key: str):
    """Get capabilities for a specific vendor."""
    if vendor_key not in vendors.VENDOR_PROFILES:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_key!r} not found")
    return {
        "vendor_key": vendor_key,
        "capabilities": device_registry.get_capabilities(vendor_key),
    }


@router.get("/devices/{device_id}/vendor")
def get_device_vendor(device_id: str):
    """Get vendor info for a specific device."""
    try:
        return topology_service.get_vendor_info(device_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
