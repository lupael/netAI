"""Audit log routes — exposes paginated config change history."""
from __future__ import annotations

from fastapi import APIRouter

from app.core import database as db

router = APIRouter(prefix="/api/audit-log", tags=["audit"])


@router.get(
    "",
    summary="Retrieve paginated audit log",
    description="Returns all configuration change events, newest first.",
)
async def get_audit_log(skip: int = 0, limit: int = 50):
    """Return paginated configuration audit log."""
    events = sorted(db.config_changes_db, key=lambda c: c.timestamp, reverse=True)
    return events[skip : skip + limit]
