"""Audit log routes — exposes paginated config change history."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Query

from app.core import database as db
from app.core.models import ConfigChange

router = APIRouter(prefix="/api/audit-log", tags=["audit"])


@router.get(
    "",
    response_model=List[ConfigChange],
    summary="Retrieve paginated audit log",
    description="Returns all configuration change events, newest first.",
    responses={200: {"description": "Paginated audit log entries"}},
)
async def get_audit_log(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=1000, description="Maximum records to return"),
):
    """Return paginated configuration audit log."""
    events = sorted(db.config_changes_db, key=lambda c: c.timestamp, reverse=True)
    return events[skip : skip + limit]
