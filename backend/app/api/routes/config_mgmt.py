"""Configuration management routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Body, HTTPException

from app.core.models import ConfigAuditResult, ConfigChange, ConfigChangeType
from app.services import config_service

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/history")
async def get_config_history():
    """Return all configuration change history, newest first."""
    return config_service.get_config_history()


@router.get("/{device_id}")
async def get_device_config(device_id: str):
    """Return the current running configuration for a device."""
    config = config_service.get_device_config(device_id)
    if config is None:
        raise HTTPException(status_code=404, detail=f"Config for device {device_id} not found")
    return {"device_id": device_id, "config": config}


@router.post("/{device_id}/audit", response_model=ConfigAuditResult)
async def audit_config(device_id: str):
    """Run a compliance audit on the device configuration."""
    return config_service.audit_config(device_id)


@router.post("/{device_id}/apply", response_model=ConfigChange)
async def apply_config(
    device_id: str,
    change_type: ConfigChangeType = Body(...),
    new_config: str = Body(...),
    author: str = Body("api-user"),
    comment: str = Body(""),
):
    """Apply a configuration change to a device."""
    return config_service.apply_config_change(device_id, change_type, new_config, author, comment)


@router.post("/{device_id}/rollback", response_model=ConfigChange)
async def rollback_config(
    device_id: str,
    change_id: str = Body(..., embed=True),
):
    """Rollback a device configuration to a previous state."""
    result = config_service.rollback_config(device_id, change_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Change {change_id} not found or has no previous config to restore",
        )
    return result
