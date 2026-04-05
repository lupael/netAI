"""Software lifecycle management service."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from app.core import database as db
from app.core.models import ScheduleUpgradeRequest, SoftwareUpdate, UpdateStatus


def get_software_inventory() -> List[dict]:
    inventory = []
    for device in db.devices_db:
        update = next(
            (u for u in db.software_updates_db if u.device_id == device.id and u.status != UpdateStatus.COMPLETED),
            None,
        )
        inventory.append({
            "device_id": device.id,
            "device_name": device.name,
            "device_type": device.type.value,
            "current_version": device.firmware_version,
            "vendor": device.vendor,
            "model": device.model,
            "pending_update": update.model_dump() if update else None,
            "last_updated": next(
                (u.completed_at.isoformat() for u in reversed(db.software_updates_db)
                 if u.device_id == device.id and u.status == UpdateStatus.COMPLETED),
                None,
            ),
        })
    return inventory


def get_pending_updates() -> List[SoftwareUpdate]:
    return [u for u in db.software_updates_db if u.status in (UpdateStatus.PENDING, UpdateStatus.SCHEDULED)]


def schedule_upgrade(request: ScheduleUpgradeRequest) -> SoftwareUpdate:
    device = next((d for d in db.devices_db if d.id == request.device_id), None)
    current_version = device.firmware_version if device else "unknown"

    update = SoftwareUpdate(
        id=f"sw-{uuid.uuid4().hex[:6]}",
        device_id=request.device_id,
        current_version=current_version,
        target_version=request.target_version,
        status=UpdateStatus.SCHEDULED,
        scheduled_at=request.scheduled_at or datetime.utcnow(),
        rollback_version=current_version,
    )
    db.software_updates_db.append(update)
    return update


def execute_update(update_id: str) -> Optional[SoftwareUpdate]:
    for i, update in enumerate(db.software_updates_db):
        if update.id == update_id:
            db.software_updates_db[i] = update.model_copy(
                update={
                    "status": UpdateStatus.COMPLETED,
                    "completed_at": datetime.utcnow(),
                }
            )
            # Update firmware version on the device record
            for j, device in enumerate(db.devices_db):
                if device.id == update.device_id:
                    db.devices_db[j] = device.model_copy(
                        update={"firmware_version": update.target_version}
                    )
                    break
            return db.software_updates_db[i]
    return None
