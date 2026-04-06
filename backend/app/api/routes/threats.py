"""Threat detection routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.models import ThreatStats
from app.services import threat_service

router = APIRouter(prefix="/api/threats", tags=["threats"])


@router.get("")
async def get_all_threats():
    """Return all threat alerts."""
    return threat_service.get_all_threats()


@router.get("/active")
async def get_active_threats():
    """Return only active and investigating threats."""
    return threat_service.get_active_threats()


@router.get("/stats", response_model=ThreatStats)
async def get_threat_stats():
    """Return aggregate threat statistics."""
    return threat_service.get_threat_stats()


@router.post("/{threat_id}/mitigate")
async def mitigate_threat(threat_id: str):
    """Mark a threat as mitigated."""
    result = threat_service.mitigate_threat(threat_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Threat {threat_id} not found")
    return result
