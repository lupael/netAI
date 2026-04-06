"""Software lifecycle management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.models import ScheduleUpgradeRequest, SoftwareUpdate
from app.services import software_service

router = APIRouter(prefix="/api/software", tags=["software"])


@router.get("/inventory", summary="Get software inventory")
async def get_software_inventory():
    """Return software inventory for all devices."""
    return software_service.get_software_inventory()


@router.get("/updates", summary="Get pending software updates")
async def get_pending_updates():
    """Return all pending and scheduled software updates."""
    return software_service.get_pending_updates()


@router.post(
    "/upgrade",
    response_model=SoftwareUpdate,
    summary="Schedule a software upgrade",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Device not found"}},
)
async def schedule_upgrade(
    request: ScheduleUpgradeRequest,
    _: str = Depends(get_current_user),
):
    """Schedule a software/firmware upgrade for a device."""
    try:
        return software_service.schedule_upgrade(request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/{update_id}/execute",
    response_model=SoftwareUpdate,
    summary="Execute a scheduled update",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Update not found"}},
)
async def execute_update(update_id: str, _: str = Depends(get_current_user)):
    """Execute a scheduled software update immediately."""
    result = software_service.execute_update(update_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Update {update_id} not found")
    return result
