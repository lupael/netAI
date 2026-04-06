"""IP address management routes."""
from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/api/ip", tags=["ip-management"])

_SUBNETS: List[Dict[str, Any]] = [
    {
        "id": "subnet-001",
        "cidr": "10.0.0.0/24",
        "description": "DC1 Core Infrastructure",
        "vlan": 10,
        "total_ips": 254,
        "assigned": 48,
        "free": 206,
        "utilization_pct": 18.9,
        "gateway": "10.0.0.1",
        "status": "active",
    },
    {
        "id": "subnet-002",
        "cidr": "10.0.1.0/24",
        "description": "DC1 Server Farm",
        "vlan": 20,
        "total_ips": 254,
        "assigned": 192,
        "free": 62,
        "utilization_pct": 75.6,
        "gateway": "10.0.1.1",
        "status": "active",
    },
    {
        "id": "subnet-003",
        "cidr": "10.0.2.0/24",
        "description": "DC1 Workstations",
        "vlan": 30,
        "total_ips": 254,
        "assigned": 210,
        "free": 44,
        "utilization_pct": 82.7,
        "gateway": "10.0.2.1",
        "status": "active",
    },
    {
        "id": "subnet-004",
        "cidr": "192.168.1.0/24",
        "description": "Edge Network / DMZ",
        "vlan": 100,
        "total_ips": 254,
        "assigned": 12,
        "free": 242,
        "utilization_pct": 4.7,
        "gateway": "192.168.1.1",
        "status": "active",
    },
    {
        "id": "subnet-005",
        "cidr": "172.16.0.0/24",
        "description": "Management Network",
        "vlan": 999,
        "total_ips": 254,
        "assigned": 25,
        "free": 229,
        "utilization_pct": 9.8,
        "gateway": "172.16.0.1",
        "status": "active",
    },
]

_IP_ASSIGNMENTS: List[Dict[str, Any]] = [
    {"id": "ip-001", "ip": "10.0.0.1", "hostname": "core-router-01", "device_id": "dev-001", "vlan": 10, "mac": "00:1A:2B:3C:4D:01", "status": "active"},
    {"id": "ip-002", "ip": "10.0.0.2", "hostname": "core-router-02", "device_id": "dev-002", "vlan": 10, "mac": "00:1A:2B:3C:4D:02", "status": "active"},
    {"id": "ip-003", "ip": "192.168.1.1", "hostname": "edge-router-01", "device_id": "dev-003", "vlan": 100, "mac": "00:1A:2B:3C:4D:03", "status": "active"},
    {"id": "ip-004", "ip": "192.168.1.2", "hostname": "edge-router-02", "device_id": "dev-004", "vlan": 100, "mac": "00:1A:2B:3C:4D:04", "status": "degraded"},
    {"id": "ip-005", "ip": "10.0.0.10", "hostname": "dist-sw-01", "device_id": "dev-005", "vlan": 10, "mac": "00:1A:2B:3C:4D:05", "status": "active"},
    {"id": "ip-006", "ip": "10.0.0.11", "hostname": "dist-sw-02", "device_id": "dev-006", "vlan": 10, "mac": "00:1A:2B:3C:4D:06", "status": "active"},
    {"id": "ip-007", "ip": "10.0.0.12", "hostname": "access-sw-01", "device_id": "dev-007", "vlan": 10, "mac": "00:1A:2B:3C:4D:07", "status": "active"},
    {"id": "ip-008", "ip": "10.0.0.13", "hostname": "access-sw-02", "device_id": "dev-008", "vlan": 10, "mac": "00:1A:2B:3C:4D:08", "status": "active"},
    {"id": "ip-009", "ip": "10.0.0.14", "hostname": "access-sw-03", "device_id": "dev-009", "vlan": 10, "mac": "00:1A:2B:3C:4D:09", "status": "offline"},
    {"id": "ip-010", "ip": "10.0.0.15", "hostname": "access-sw-04", "device_id": "dev-010", "vlan": 10, "mac": "00:1A:2B:3C:4D:10", "status": "active"},
    {"id": "ip-011", "ip": "10.0.0.20", "hostname": "firewall-01", "device_id": "dev-011", "vlan": 10, "mac": "00:1A:2B:3C:4D:11", "status": "active"},
    {"id": "ip-012", "ip": "172.16.0.50", "hostname": "mgmt-server", "device_id": "dev-012", "vlan": 999, "mac": "00:1A:2B:3C:4D:12", "status": "active"},
    {"id": "ip-013", "ip": "172.16.0.51", "hostname": "nms-server", "device_id": "dev-013", "vlan": 999, "mac": "00:1A:2B:3C:4D:13", "status": "active"},
    {"id": "ip-014", "ip": "172.16.0.52", "hostname": "siem-server", "device_id": "dev-014", "vlan": 999, "mac": "00:1A:2B:3C:4D:14", "status": "active"},
    {"id": "ip-015", "ip": "10.0.0.30", "hostname": "wan-router-01", "device_id": "dev-015", "vlan": 10, "mac": "00:1A:2B:3C:4D:15", "status": "active"},
]

_PORT_ASSIGNMENTS: List[Dict[str, Any]] = [
    {"id": "port-001", "switch": "access-sw-01", "port": "Gi0/1", "vlan": 30, "connected_device": "workstation-101", "ip": "10.0.2.10", "status": "active"},
    {"id": "port-002", "switch": "access-sw-01", "port": "Gi0/2", "vlan": 30, "connected_device": "workstation-102", "ip": "10.0.2.11", "status": "active"},
    {"id": "port-003", "switch": "access-sw-02", "port": "Gi0/1", "vlan": 20, "connected_device": "app-server-01", "ip": "10.0.1.10", "status": "active"},
    {"id": "port-004", "switch": "access-sw-03", "port": "Gi0/1", "vlan": 20, "connected_device": "db-server-01", "ip": "10.0.1.20", "status": "inactive"},
]


@router.get("/subnets")
async def get_subnets() -> List[Dict[str, Any]]:
    """List all IP subnets/ranges."""
    return _SUBNETS


@router.get("/assignments")
async def get_ip_assignments() -> List[Dict[str, Any]]:
    """List all IP address assignments."""
    return _IP_ASSIGNMENTS


@router.get("/ports")
async def get_port_assignments() -> List[Dict[str, Any]]:
    """List switch port assignments."""
    return _PORT_ASSIGNMENTS
