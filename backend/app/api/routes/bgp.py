"""BGP monitoring routes."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/bgp", tags=["bgp"])

_NOW = datetime.now(timezone.utc)


def _dt(hours_ago: float = 0) -> str:
    return (_NOW - timedelta(hours=hours_ago)).isoformat()


_BGP_SESSIONS: List[Dict[str, Any]] = [
    {
        "id": "bgp-001",
        "peer_ip": "203.0.113.1",
        "remote_as": 64512,
        "local_as": 65001,
        "state": "established",
        "prefixes_received": 142,
        "prefixes_sent": 8,
        "uptime_seconds": 864000,
        "uptime_human": "10d 0h",
        "description": "Transit Provider A",
        "router": "edge-router-01",
    },
    {
        "id": "bgp-002",
        "peer_ip": "198.51.100.1",
        "remote_as": 64513,
        "local_as": 65001,
        "state": "established",
        "prefixes_received": 98,
        "prefixes_sent": 8,
        "uptime_seconds": 432000,
        "uptime_human": "5d 0h",
        "description": "Transit Provider B",
        "router": "edge-router-01",
    },
    {
        "id": "bgp-003",
        "peer_ip": "192.0.2.50",
        "remote_as": 64514,
        "local_as": 65001,
        "state": "idle",
        "prefixes_received": 0,
        "prefixes_sent": 0,
        "uptime_seconds": 0,
        "uptime_human": "—",
        "description": "Backup ISP",
        "router": "edge-router-02",
    },
    {
        "id": "bgp-004",
        "peer_ip": "10.10.10.2",
        "remote_as": 65002,
        "local_as": 65001,
        "state": "established",
        "prefixes_received": 24,
        "prefixes_sent": 16,
        "uptime_seconds": 1296000,
        "uptime_human": "15d 0h",
        "description": "iBGP Peer — Core Router 02",
        "router": "core-router-01",
    },
    {
        "id": "bgp-005",
        "peer_ip": "172.16.0.1",
        "remote_as": 64520,
        "local_as": 65001,
        "state": "active",
        "prefixes_received": 0,
        "prefixes_sent": 0,
        "uptime_seconds": 0,
        "uptime_human": "—",
        "description": "IXP Peer",
        "router": "edge-router-02",
    },
]

_BGP_HIJACKS: List[Dict[str, Any]] = [
    {
        "id": "hijack-001",
        "prefix": "192.0.2.0/24",
        "expected_origin_as": 65001,
        "actual_origin_as": 64999,
        "detected_at": _dt(hours_ago=2),
        "severity": "critical",
        "description": "Unauthorized prefix announcement detected from AS64999",
        "status": "active",
        "affected_routes": 12,
    },
    {
        "id": "hijack-002",
        "prefix": "203.0.113.0/25",
        "expected_origin_as": 65001,
        "actual_origin_as": 64888,
        "detected_at": _dt(hours_ago=8),
        "severity": "high",
        "description": "More-specific hijack of /25 subnet from AS64888",
        "status": "active",
        "affected_routes": 5,
    },
    {
        "id": "hijack-003",
        "prefix": "10.0.0.0/8",
        "expected_origin_as": 65001,
        "actual_origin_as": 64777,
        "detected_at": _dt(hours_ago=48),
        "severity": "medium",
        "description": "Private IP range announced externally by AS64777",
        "status": "resolved",
        "affected_routes": 0,
    },
]


@router.get("/sessions", summary="List BGP sessions")
async def get_bgp_sessions(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=1000, description="Maximum records to return"),
) -> List[Dict[str, Any]]:
    """List all BGP sessions (paginated)."""
    return _BGP_SESSIONS[skip : skip + limit]


@router.get("/hijacks")
async def get_bgp_hijacks() -> List[Dict[str, Any]]:
    """List detected BGP hijack events."""
    return _BGP_HIJACKS


@router.post("/hijacks/{hijack_id}/resolve")
async def resolve_hijack(hijack_id: str) -> Dict[str, Any]:
    """Mark a BGP hijack event as resolved."""
    for hijack in _BGP_HIJACKS:
        if hijack["id"] == hijack_id:
            hijack["status"] = "resolved"
            hijack["resolved_at"] = datetime.now(timezone.utc).isoformat()
            return {"success": True, "hijack": hijack}
    raise HTTPException(status_code=404, detail=f"Hijack event {hijack_id} not found")
