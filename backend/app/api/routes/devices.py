"""Device health and metrics routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.models import Device, DeviceHealth
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


class DeviceUpdate(BaseModel):
    """Partial update payload for device metadata."""

    name: Optional[str] = None
    location: Optional[str] = None
    firmware_version: Optional[str] = None
    model: Optional[str] = None
    vendor: Optional[str] = None


@router.get("", summary="List all devices")
async def get_all_devices(
    skip: int = 0,
    limit: int = 50,
    search: str = "",
    type: str = "",
    status: str = "",
):
    """Return paginated and optionally filtered network devices."""
    devices = device_service.get_all_devices()
    if search:
        q = search.lower()
        devices = [
            d for d in devices
            if q in d.name.lower() or q in d.ip.lower() or q in (d.location or "").lower()
        ]
    if type:
        devices = [d for d in devices if d.type.value == type]
    if status:
        devices = [d for d in devices if d.status.value == status]
    return devices[skip : skip + limit]


@router.get("/predictions", summary="Get AI failure predictions")
async def get_failure_predictions():
    """Return AI-powered failure predictions for all devices."""
    return device_service.get_failure_predictions()


@router.get("/{device_id}", response_model=Device, summary="Get device by ID")
async def get_device(device_id: str):
    """Return details for a specific device."""
    device = device_service.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return device


@router.put(
    "/{device_id}",
    response_model=Device,
    summary="Update device metadata",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Device not found"}},
)
async def update_device(
    device_id: str,
    update: DeviceUpdate,
    _: str = Depends(get_current_user),
):
    """Update mutable metadata fields of a device."""
    from app.core import database as db

    for i, device in enumerate(db.devices_db):
        if device.id == device_id:
            changes = {k: v for k, v in update.model_dump().items() if v is not None}
            if changes:
                db.devices_db[i] = device.model_copy(update=changes)
            return db.devices_db[i]
    raise HTTPException(status_code=404, detail=f"Device {device_id} not found")


@router.get("/{device_id}/health", response_model=DeviceHealth, summary="Get device health")
async def get_device_health(device_id: str):
    """Return health metrics and anomaly scores for a device."""
    health = device_service.get_device_health(device_id)
    if not health:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return health


@router.get("/{device_id}/metrics", summary="Get device metrics")
async def get_device_metrics(device_id: str):
    """Return time-series performance metrics for a device."""
    metrics = device_service.get_device_metrics(device_id)
    if metrics is None:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return metrics
