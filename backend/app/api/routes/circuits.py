"""Circuit/WAN monitoring routes."""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/circuits", tags=["circuits"])

_CIRCUITS: List[Dict[str, Any]] = [
    {
        "id": "ckt-001",
        "name": "NTTN-Primary-Dhaka",
        "type": "NTTN",
        "provider": "NTTN Bangladesh",
        "bandwidth_mbps": 1000,
        "utilization_pct": 67.4,
        "status": "active",
        "latency_ms": 3.2,
        "sla_uptime_pct": 99.9,
        "actual_uptime_pct": 99.95,
        "circuit_id_provider": "NTTN-BD-DK-00142",
        "location": "DC1 — Dhaka",
    },
    {
        "id": "ckt-002",
        "name": "ISP-Fiber-Primary",
        "type": "ISP",
        "provider": "Grameenphone Enterprise",
        "bandwidth_mbps": 500,
        "utilization_pct": 82.1,
        "status": "degraded",
        "latency_ms": 8.7,
        "sla_uptime_pct": 99.5,
        "actual_uptime_pct": 98.9,
        "circuit_id_provider": "GP-ENT-20234",
        "location": "DC1 — Dhaka",
    },
    {
        "id": "ckt-003",
        "name": "MPLS-Chittagong-Link",
        "type": "MPLS",
        "provider": "Robi Business",
        "bandwidth_mbps": 200,
        "utilization_pct": 45.0,
        "status": "active",
        "latency_ms": 22.5,
        "sla_uptime_pct": 99.7,
        "actual_uptime_pct": 99.8,
        "circuit_id_provider": "ROBI-MPLS-CTG-0089",
        "location": "Chittagong Branch",
    },
    {
        "id": "ckt-004",
        "name": "Internet-Broadband-Backup",
        "type": "Internet",
        "provider": "Banglalink Business",
        "bandwidth_mbps": 100,
        "utilization_pct": 12.3,
        "status": "active",
        "latency_ms": 18.0,
        "sla_uptime_pct": 99.0,
        "actual_uptime_pct": 99.2,
        "circuit_id_provider": "BL-BIZ-2024-5511",
        "location": "DC1 — Dhaka",
    },
    {
        "id": "ckt-005",
        "name": "P2P-Sylhet-HQ",
        "type": "P2P",
        "provider": "BTTB",
        "bandwidth_mbps": 50,
        "utilization_pct": 0.0,
        "status": "down",
        "latency_ms": 0.0,
        "sla_uptime_pct": 99.5,
        "actual_uptime_pct": 97.1,
        "circuit_id_provider": "BTTB-P2P-SYL-0017",
        "location": "Sylhet Office",
    },
    {
        "id": "ckt-006",
        "name": "NTTN-Secondary-Dhaka",
        "type": "NTTN",
        "provider": "NTTN Bangladesh",
        "bandwidth_mbps": 500,
        "utilization_pct": 34.8,
        "status": "active",
        "latency_ms": 3.5,
        "sla_uptime_pct": 99.9,
        "actual_uptime_pct": 99.99,
        "circuit_id_provider": "NTTN-BD-DK-00198",
        "location": "DC2 — Dhaka",
    },
]


@router.get("", summary="List all circuits")
async def get_circuits(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=1000, description="Maximum records to return"),
) -> List[Dict[str, Any]]:
    """List all WAN/NTTN/ISP circuits (paginated)."""
    return _CIRCUITS[skip : skip + limit]


@router.get("/{circuit_id}")
async def get_circuit(circuit_id: str) -> Dict[str, Any]:
    """Return specific circuit details."""
    for ckt in _CIRCUITS:
        if ckt["id"] == circuit_id:
            return ckt
    raise HTTPException(status_code=404, detail=f"Circuit {circuit_id} not found")
