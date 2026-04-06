"""Network topology routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.models import DiscoveryResult, Topology
from app.services import topology_service

router = APIRouter(prefix="/api/topology", tags=["topology"])


@router.get("", response_model=Topology)
async def get_topology():
    """Return the full network topology (devices + links)."""
    return topology_service.get_topology()


@router.get("/devices")
async def get_devices():
    """Return a list of all network devices."""
    return topology_service.get_devices()


@router.get("/links")
async def get_links():
    """Return a list of all network links."""
    return topology_service.get_links()


@router.post("/discover", response_model=DiscoveryResult)
async def discover_topology():
    """Trigger a network discovery scan."""
    return topology_service.discover_topology()
