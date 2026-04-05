"""Device health and metrics routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.models import Device, DeviceHealth
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("")
async def get_all_devices():
    """Return all network devices."""
    return device_service.get_all_devices()


@router.get("/predictions")
async def get_failure_predictions():
    """Return AI-powered failure predictions for all devices."""
    return device_service.get_failure_predictions()


@router.get("/{device_id}", response_model=Device)
async def get_device(device_id: str):
    """Return details for a specific device."""
    device = device_service.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return device


@router.get("/{device_id}/health", response_model=DeviceHealth)
async def get_device_health(device_id: str):
    """Return health metrics and anomaly scores for a device."""
    health = device_service.get_device_health(device_id)
    if not health:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return health


@router.get("/{device_id}/metrics")
async def get_device_metrics(device_id: str):
    """Return time-series performance metrics for a device."""
    metrics = device_service.get_device_metrics(device_id)
    if metrics is None:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return metrics
