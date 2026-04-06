from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class DeviceType(str, Enum):
    ROUTER = "router"
    SWITCH = "switch"
    FIREWALL = "firewall"
    SERVER = "server"
    ACCESS_POINT = "access_point"
    LOAD_BALANCER = "load_balancer"


class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


class LinkStatus(str, Enum):
    UP = "up"
    DOWN = "down"
    DEGRADED = "degraded"


class ThreatSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ThreatType(str, Enum):
    DDOS = "ddos"
    PORT_SCAN = "port_scan"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DATA_EXFILTRATION = "data_exfiltration"
    BRUTE_FORCE = "brute_force"
    ANOMALY = "anomaly"


class ThreatStatus(str, Enum):
    ACTIVE = "active"
    MITIGATED = "mitigated"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"


class ConfigChangeType(str, Enum):
    ACL_UPDATE = "acl_update"
    ROUTING_CHANGE = "routing_change"
    VLAN_CHANGE = "vlan_change"
    FIRMWARE_UPDATE = "firmware_update"
    INTERFACE_CHANGE = "interface_change"
    SECURITY_POLICY = "security_policy"
    NTP_CHANGE = "ntp_change"
    SNMP_CHANGE = "snmp_change"


class ConfigChangeStatus(str, Enum):
    PENDING = "pending"
    APPLIED = "applied"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class UpdateStatus(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AlertType(str, Enum):
    CPU_HIGH = "cpu_high"
    MEMORY_HIGH = "memory_high"
    DISK_HIGH = "disk_high"
    LINK_DOWN = "link_down"
    DEVICE_OFFLINE = "device_offline"
    THREAT_DETECTED = "threat_detected"
    CONFIG_DRIFT = "config_drift"
    LATENCY_HIGH = "latency_high"
    PACKET_LOSS = "packet_loss"
    FIRMWARE_OUTDATED = "firmware_outdated"


# ---------------------------------------------------------------------------
# Core models
# ---------------------------------------------------------------------------

class Device(BaseModel):
    id: str
    name: str
    type: DeviceType
    ip: str
    status: DeviceStatus
    cpu_usage: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0, le=100)
    disk_usage: float = Field(ge=0, le=100)
    uptime: int  # seconds
    firmware_version: str
    location: str
    interfaces: Optional[int] = None
    model: Optional[str] = None
    vendor: Optional[str] = None
    last_seen: Optional[datetime] = None


class NetworkLink(BaseModel):
    id: str
    source_id: str
    target_id: str
    bandwidth: float  # Mbps
    latency: float    # ms
    packet_loss: float = Field(ge=0, le=100)  # %
    status: LinkStatus
    utilization: float = Field(ge=0, le=100)  # %


class Topology(BaseModel):
    devices: List[Device]
    links: List[NetworkLink]
    timestamp: datetime


class ThreatAlert(BaseModel):
    id: str
    severity: ThreatSeverity
    type: ThreatType
    source_ip: str
    target_ip: str
    description: str
    timestamp: datetime
    status: ThreatStatus
    affected_devices: Optional[List[str]] = None
    mitigation_steps: Optional[List[str]] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)


class ConfigChange(BaseModel):
    id: str
    device_id: str
    change_type: ConfigChangeType
    old_config: Optional[str] = None
    new_config: Optional[str] = None
    status: ConfigChangeStatus
    timestamp: datetime
    author: str
    comment: Optional[str] = None
    compliance: Optional[bool] = None


class DeviceHealth(BaseModel):
    device_id: str
    metrics: Dict[str, Any]
    predictions: Dict[str, Any]
    alerts: List[str]
    health_score: Optional[float] = Field(None, ge=0, le=100)


class SoftwareUpdate(BaseModel):
    id: str
    device_id: str
    current_version: str
    target_version: str
    status: UpdateStatus
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    rollback_version: Optional[str] = None
    release_notes: Optional[str] = None
    severity: Optional[str] = None


class Alert(BaseModel):
    id: str
    type: AlertType
    severity: ThreatSeverity
    device_id: str
    device_name: Optional[str] = None
    title: str = ""
    message: str
    timestamp: datetime
    acknowledged: bool
    resolved: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class NLPQuery(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


class NLPResponse(BaseModel):
    response: str
    actions: Optional[List[Dict[str, Any]]] = None
    data: Optional[Any] = None
    confidence: Optional[float] = None


class MetricPoint(BaseModel):
    timestamp: datetime
    value: float


class DeviceMetrics(BaseModel):
    device_id: str
    cpu: List[MetricPoint]
    memory: List[MetricPoint]
    disk: List[MetricPoint]
    network_in: List[MetricPoint]
    network_out: List[MetricPoint]


class AnomalyResult(BaseModel):
    is_anomaly: bool
    score: float
    threshold: float
    details: Optional[str] = None


class ScheduleUpgradeRequest(BaseModel):
    device_id: str
    target_version: str
    scheduled_at: Optional[datetime] = None


class ConfigAuditResult(BaseModel):
    device_id: str
    compliant: bool
    issues: List[str]
    recommendations: List[str]
    score: float


class DiscoveryResult(BaseModel):
    discovered: int
    updated: int
    timestamp: datetime
    new_devices: List[str]


class ThreatStats(BaseModel):
    total: int
    active: int
    mitigated: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]


class AlertStats(BaseModel):
    total: int
    acknowledged: int
    unacknowledged: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
