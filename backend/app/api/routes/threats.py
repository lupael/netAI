"""Threat detection routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.models import ThreatStats
from app.services import threat_service

router = APIRouter(prefix="/api/threats", tags=["threats"])


@router.get("", summary="List all threats")
async def get_all_threats(skip: int = 0, limit: int = 50):
    """Return paginated threat alerts."""
    threats = threat_service.get_all_threats()
    return threats[skip : skip + limit]


@router.get("/active", summary="List active threats")
async def get_active_threats(skip: int = 0, limit: int = 50):
    """Return paginated active and investigating threats."""
    threats = threat_service.get_active_threats()
    return threats[skip : skip + limit]


@router.get("/stats", response_model=ThreatStats, summary="Get threat statistics")
async def get_threat_stats():
    """Return aggregate threat statistics."""
    return threat_service.get_threat_stats()


@router.post(
    "/{threat_id}/mitigate",
    summary="Mitigate a threat",
    responses={401: {"description": "Not authenticated"}, 404: {"description": "Threat not found"}},
)
async def mitigate_threat(threat_id: str, _: str = Depends(get_current_user)):
    """Mark a threat as mitigated."""
    result = threat_service.mitigate_threat(threat_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Threat {threat_id} not found")
    return result
