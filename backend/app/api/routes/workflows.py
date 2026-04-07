"""Workflow automation routes."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

_NOW = datetime.now(timezone.utc)


def _dt(hours_ago: float = 0, days_ago: float = 0) -> str:
    return (_NOW - timedelta(hours=hours_ago, days=days_ago)).isoformat()


_WORKFLOW_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "backup_all_configs",
        "name": "Backup All Configs",
        "description": "Connect to all reachable devices and archive running configurations to the config store.",
        "category": "config",
        "estimated_duration_sec": 180,
        "last_run": _dt(hours_ago=6),
        "last_status": "success",
        "enabled": True,
    },
    {
        "id": "firmware_audit",
        "name": "Firmware Audit",
        "description": "Compare installed firmware versions against vendor advisory and flag outdated devices.",
        "category": "compliance",
        "estimated_duration_sec": 120,
        "last_run": _dt(hours_ago=24),
        "last_status": "success",
        "enabled": True,
    },
    {
        "id": "threat_scan",
        "name": "Threat Scan",
        "description": "Run a full threat intelligence sweep across all active sessions and flows.",
        "category": "security",
        "estimated_duration_sec": 300,
        "last_run": _dt(hours_ago=1),
        "last_status": "success",
        "enabled": True,
    },
    {
        "id": "compliance_check",
        "name": "Compliance Check",
        "description": "Validate device configurations against CIS benchmark and internal policy rules.",
        "category": "compliance",
        "estimated_duration_sec": 240,
        "last_run": _dt(days_ago=2),
        "last_status": "warning",
        "enabled": True,
    },
    {
        "id": "topology_discovery",
        "name": "Topology Discovery",
        "description": "Re-discover network topology using LLDP/CDP and update the topology database.",
        "category": "discovery",
        "estimated_duration_sec": 90,
        "last_run": _dt(hours_ago=12),
        "last_status": "success",
        "enabled": True,
    },
]

_WORKFLOW_RUNS: List[Dict[str, Any]] = [
    {
        "run_id": "run-001",
        "workflow_id": "backup_all_configs",
        "workflow_name": "Backup All Configs",
        "triggered_by": "scheduler",
        "started_at": _dt(hours_ago=6),
        "finished_at": _dt(hours_ago=5.95),
        "duration_sec": 172,
        "status": "success",
        "log_summary": "15/15 devices backed up successfully.",
    },
    {
        "run_id": "run-002",
        "workflow_id": "threat_scan",
        "workflow_name": "Threat Scan",
        "triggered_by": "noc-operator",
        "started_at": _dt(hours_ago=1),
        "finished_at": _dt(hours_ago=0.92),
        "duration_sec": 295,
        "status": "success",
        "log_summary": "4 new threat indicators detected.",
    },
    {
        "run_id": "run-003",
        "workflow_id": "firmware_audit",
        "workflow_name": "Firmware Audit",
        "triggered_by": "scheduler",
        "started_at": _dt(hours_ago=24),
        "finished_at": _dt(hours_ago=23.97),
        "duration_sec": 118,
        "status": "success",
        "log_summary": "3 devices have outdated firmware.",
    },
    {
        "run_id": "run-004",
        "workflow_id": "compliance_check",
        "workflow_name": "Compliance Check",
        "triggered_by": "scheduler",
        "started_at": _dt(days_ago=2),
        "finished_at": _dt(days_ago=2, hours_ago=-0.07),
        "duration_sec": 238,
        "status": "warning",
        "log_summary": "2 devices failed CIS Level 1 checks.",
    },
    {
        "run_id": "run-005",
        "workflow_id": "topology_discovery",
        "workflow_name": "Topology Discovery",
        "triggered_by": "scheduler",
        "started_at": _dt(hours_ago=12),
        "finished_at": _dt(hours_ago=11.975),
        "duration_sec": 89,
        "status": "success",
        "log_summary": "Topology updated — 15 nodes, 11 links.",
    },
]


@router.get("")
async def get_workflows(skip: int = 0, limit: int = 50) -> Dict[str, Any]:
    """Return paginated workflow templates and full recent run history."""
    templates = _WORKFLOW_TEMPLATES[skip : skip + limit]
    return {"templates": templates, "recent_runs": _WORKFLOW_RUNS}


@router.get("/runs")
async def get_workflow_runs(skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
    """Return recent workflow execution history (paginated)."""
    runs = sorted(_WORKFLOW_RUNS, key=lambda r: r["started_at"], reverse=True)
    return runs[skip : skip + limit]


@router.post("/{workflow_id}/run")
async def trigger_workflow(
    workflow_id: str,
    _: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Trigger a workflow by ID."""
    template = next((t for t in _WORKFLOW_TEMPLATES if t["id"] == workflow_id), None)
    if not template:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")

    new_run: Dict[str, Any] = {
        "run_id": f"run-{len(_WORKFLOW_RUNS) + 1:03d}",
        "workflow_id": workflow_id,
        "workflow_name": template["name"],
        "triggered_by": "api-user",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "duration_sec": None,
        "status": "running",
        "log_summary": "Workflow started.",
    }
    _WORKFLOW_RUNS.append(new_run)
    return {"success": True, "run": new_run}
