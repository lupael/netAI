"""Links monitoring routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core import database as db

router = APIRouter(prefix="/api/links", tags=["links"])


@router.get("")
async def get_all_links():
    """Return all network links with status, utilization, latency, bandwidth."""
    return db.links_db


@router.get("/stats")
async def get_link_stats():
    """Return aggregate link statistics."""
    links = db.links_db
    total = len(links)
    down_count = sum(1 for lnk in links if lnk.status.value == "down")
    degraded_count = sum(1 for lnk in links if lnk.status.value == "degraded")
    avg_utilization = round(sum(lnk.utilization for lnk in links) / total, 1) if total else 0.0
    avg_latency = round(sum(lnk.latency for lnk in links) / total, 2) if total else 0.0
    return {
        "total_links": total,
        "active_links": total - down_count - degraded_count,
        "degraded_links": degraded_count,
        "down_links": down_count,
        "avg_utilization_pct": avg_utilization,
        "avg_latency_ms": avg_latency,
    }


@router.get("/{link_id}")
async def get_link(link_id: str):
    """Return specific link details."""
    for lnk in db.links_db:
        if lnk.id == link_id:
            return lnk
    raise HTTPException(status_code=404, detail=f"Link {link_id} not found")
