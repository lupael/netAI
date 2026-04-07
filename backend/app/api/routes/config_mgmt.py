"""Configuration management routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.models import ConfigAuditResult, ConfigChange, ConfigChangeType
from app.services import config_service

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/history", summary="Get config change history")
async def get_config_history():
    """Return all configuration change history, newest first."""
    return config_service.get_config_history()


@router.get("/{device_id}", summary="Get device configuration")
async def get_device_config(device_id: str):
    """Return the current running configuration for a device."""
    config = config_service.get_device_config(device_id)
    if config is None:
        raise HTTPException(status_code=404, detail=f"Config for device {device_id} not found")
    return {"device_id": device_id, "config": config}


@router.post(
    "/{device_id}/audit",
    response_model=ConfigAuditResult,
    summary="Run compliance audit",
    responses={401: {"description": "Not authenticated"}},
)
async def audit_config(device_id: str, _: str = Depends(get_current_user)):
    """Run a compliance audit on the device configuration."""
    return config_service.audit_config(device_id)


@router.post(
    "/{device_id}/apply",
    response_model=ConfigChange,
    summary="Apply configuration change",
    responses={401: {"description": "Not authenticated"}},
)
async def apply_config(
    device_id: str,
    change_type: ConfigChangeType = Body(...),
    new_config: str = Body(...),
    author: str = Body("api-user"),
    comment: str = Body(""),
    _: str = Depends(get_current_user),
):
    """Apply a configuration change to a device."""
    return config_service.apply_config_change(device_id, change_type, new_config, author, comment)


@router.post(
    "/{device_id}/rollback",
    response_model=ConfigChange,
    summary="Rollback configuration",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Change not found"}},
)
async def rollback_config(
    device_id: str,
    change_id: str = Body(..., embed=True),
    _: str = Depends(get_current_user),
):
    """Rollback a device configuration to a previous state."""
    result = config_service.rollback_config(device_id, change_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Change {change_id} not found or has no previous config to restore",
        )
    return result
