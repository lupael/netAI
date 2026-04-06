"""Software lifecycle management routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.models import ScheduleUpgradeRequest, SoftwareUpdate
from app.services import software_service

router = APIRouter(prefix="/api/software", tags=["software"])


@router.get("/inventory")
async def get_software_inventory():
    """Return software inventory for all devices."""
    return software_service.get_software_inventory()


@router.get("/updates")
async def get_pending_updates():
    """Return all pending and scheduled software updates."""
    return software_service.get_pending_updates()


@router.post("/upgrade", response_model=SoftwareUpdate)
async def schedule_upgrade(request: ScheduleUpgradeRequest):
    """Schedule a software/firmware upgrade for a device."""
    try:
        return software_service.schedule_upgrade(request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{update_id}/execute", response_model=SoftwareUpdate)
async def execute_update(update_id: str):
    """Execute a scheduled software update immediately."""
    result = software_service.execute_update(update_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Update {update_id} not found")
    return result
