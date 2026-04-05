"""In-memory data store with realistic sample data."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import random

from app.core.models import (
    Alert,
    AlertType,
    ConfigChange,
    ConfigChangeStatus,
    ConfigChangeType,
    Device,
    DeviceStatus,
    DeviceType,
    LinkStatus,
    NetworkLink,
    SoftwareUpdate,
    ThreatAlert,
    ThreatSeverity,
    ThreatStatus,
    ThreatType,
    UpdateStatus,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_NOW = datetime.utcnow()


def _dt(hours_ago: float = 0, days_ago: float = 0) -> datetime:
    return _NOW - timedelta(hours=hours_ago, days=days_ago)


# ---------------------------------------------------------------------------
# Sample devices
# ---------------------------------------------------------------------------

DEVICES: List[Device] = [
    Device(
        id="dev-001",
        name="core-router-01",
        type=DeviceType.ROUTER,
        ip="10.0.0.1",
        status=DeviceStatus.ONLINE,
        cpu_usage=72.4,
        memory_usage=61.8,
        disk_usage=34.2,
        uptime=2592000,  # 30 days
        firmware_version="IOS-XE 17.9.3",
        location="DC1-Core",
        interfaces=48,
        model="Cisco ASR 1002-X",
        vendor="Cisco",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-002",
        name="core-router-02",
        type=DeviceType.ROUTER,
        ip="10.0.0.2",
        status=DeviceStatus.ONLINE,
        cpu_usage=58.1,
        memory_usage=54.3,
        disk_usage=31.7,
        uptime=2505600,  # 29 days
        firmware_version="IOS-XE 17.9.3",
        location="DC1-Core",
        interfaces=48,
        model="Cisco ASR 1002-X",
        vendor="Cisco",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-003",
        name="edge-router-01",
        type=DeviceType.ROUTER,
        ip="192.168.1.1",
        status=DeviceStatus.ONLINE,
        cpu_usage=88.9,   # high — triggers alert
        memory_usage=79.2,
        disk_usage=45.0,
        uptime=864000,   # 10 days
        firmware_version="IOS-XE 17.6.1",  # outdated
        location="DC1-Edge",
        interfaces=24,
        model="Cisco ISR 4451",
        vendor="Cisco",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-004",
        name="edge-router-02",
        type=DeviceType.ROUTER,
        ip="192.168.1.2",
        status=DeviceStatus.DEGRADED,
        cpu_usage=45.3,
        memory_usage=67.4,
        disk_usage=52.1,
        uptime=345600,   # 4 days
        firmware_version="IOS-XE 17.9.3",
        location="DC1-Edge",
        interfaces=24,
        model="Cisco ISR 4451",
        vendor="Cisco",
        last_seen=_dt(0.5),
    ),
    Device(
        id="dev-005",
        name="dist-switch-01",
        type=DeviceType.SWITCH,
        ip="10.0.1.1",
        status=DeviceStatus.ONLINE,
        cpu_usage=23.7,
        memory_usage=38.5,
        disk_usage=22.1,
        uptime=5184000,  # 60 days
        firmware_version="NX-OS 10.2.5",
        location="DC1-Distribution",
        interfaces=96,
        model="Cisco Nexus 9396TX",
        vendor="Cisco",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-006",
        name="access-switch-01",
        type=DeviceType.SWITCH,
        ip="10.0.2.1",
        status=DeviceStatus.ONLINE,
        cpu_usage=18.2,
        memory_usage=32.1,
        disk_usage=19.4,
        uptime=7776000,  # 90 days
        firmware_version="NX-OS 10.2.3",  # slightly outdated
        location="Floor-1",
        interfaces=48,
        model="Cisco Nexus 3172TQ",
        vendor="Cisco",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-007",
        name="fw-primary",
        type=DeviceType.FIREWALL,
        ip="10.0.0.254",
        status=DeviceStatus.ONLINE,
        cpu_usage=41.5,
        memory_usage=55.9,
        disk_usage=28.7,
        uptime=4320000,  # 50 days
        firmware_version="PAN-OS 11.0.2",
        location="DC1-DMZ",
        interfaces=16,
        model="Palo Alto PA-5260",
        vendor="Palo Alto",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-008",
        name="fw-secondary",
        type=DeviceType.FIREWALL,
        ip="10.0.0.253",
        status=DeviceStatus.ONLINE,
        cpu_usage=38.2,
        memory_usage=52.4,
        disk_usage=27.3,
        uptime=4320000,
        firmware_version="PAN-OS 11.0.2",
        location="DC1-DMZ",
        interfaces=16,
        model="Palo Alto PA-5260",
        vendor="Palo Alto",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-009",
        name="web-server-01",
        type=DeviceType.SERVER,
        ip="192.168.10.10",
        status=DeviceStatus.ONLINE,
        cpu_usage=65.3,
        memory_usage=78.1,
        disk_usage=61.4,
        uptime=1296000,  # 15 days
        firmware_version="Ubuntu 22.04 LTS",
        location="DC1-Web-Tier",
        interfaces=4,
        model="Dell PowerEdge R750",
        vendor="Dell",
        last_seen=_dt(0),
    ),
    Device(
        id="dev-010",
        name="db-server-01",
        type=DeviceType.SERVER,
        ip="192.168.20.10",
        status=DeviceStatus.ONLINE,
        cpu_usage=91.7,   # critical — triggers alert
        memory_usage=87.4,
        disk_usage=76.2,
        uptime=2160000,  # 25 days
        firmware_version="Ubuntu 22.04 LTS",
        location="DC1-DB-Tier",
        interfaces=4,
        model="Dell PowerEdge R750",
        vendor="Dell",
        last_seen=_dt(0),
    ),
]

# ---------------------------------------------------------------------------
# Sample links
# ---------------------------------------------------------------------------

LINKS: List[NetworkLink] = [
    NetworkLink(id="lnk-001", source_id="dev-001", target_id="dev-005", bandwidth=10000, latency=0.3, packet_loss=0.0, status=LinkStatus.UP, utilization=62.1),
    NetworkLink(id="lnk-002", source_id="dev-002", target_id="dev-005", bandwidth=10000, latency=0.3, packet_loss=0.0, status=LinkStatus.UP, utilization=54.8),
    NetworkLink(id="lnk-003", source_id="dev-001", target_id="dev-003", bandwidth=1000, latency=1.2, packet_loss=0.01, status=LinkStatus.UP, utilization=88.4),
    NetworkLink(id="lnk-004", source_id="dev-002", target_id="dev-004", bandwidth=1000, latency=2.8, packet_loss=0.12, status=LinkStatus.DEGRADED, utilization=71.2),
    NetworkLink(id="lnk-005", source_id="dev-003", target_id="dev-007", bandwidth=1000, latency=0.8, packet_loss=0.0, status=LinkStatus.UP, utilization=45.3),
    NetworkLink(id="lnk-006", source_id="dev-004", target_id="dev-008", bandwidth=1000, latency=0.9, packet_loss=0.0, status=LinkStatus.UP, utilization=39.7),
    NetworkLink(id="lnk-007", source_id="dev-005", target_id="dev-006", bandwidth=10000, latency=0.1, packet_loss=0.0, status=LinkStatus.UP, utilization=28.5),
    NetworkLink(id="lnk-008", source_id="dev-005", target_id="dev-009", bandwidth=10000, latency=0.2, packet_loss=0.0, status=LinkStatus.UP, utilization=67.9),
    NetworkLink(id="lnk-009", source_id="dev-005", target_id="dev-010", bandwidth=10000, latency=0.2, packet_loss=0.0, status=LinkStatus.UP, utilization=82.3),
    NetworkLink(id="lnk-010", source_id="dev-007", target_id="dev-008", bandwidth=10000, latency=0.1, packet_loss=0.0, status=LinkStatus.UP, utilization=12.1),
    NetworkLink(id="lnk-011", source_id="dev-001", target_id="dev-002", bandwidth=40000, latency=0.05, packet_loss=0.0, status=LinkStatus.UP, utilization=35.6),
]

# ---------------------------------------------------------------------------
# Sample threat alerts
# ---------------------------------------------------------------------------

THREATS: List[ThreatAlert] = [
    ThreatAlert(
        id="thr-001",
        severity=ThreatSeverity.CRITICAL,
        type=ThreatType.DDOS,
        source_ip="203.0.113.45",
        target_ip="192.168.1.1",
        description="Volumetric DDoS attack detected — 45 Gbps UDP flood targeting edge-router-01. Traffic exceeds 300% of baseline.",
        timestamp=_dt(1),
        status=ThreatStatus.ACTIVE,
        affected_devices=["dev-003"],
        mitigation_steps=[
            "Apply rate limiting on upstream interfaces",
            "Activate DDoS scrubbing service",
            "Block source IP range 203.0.113.0/24",
        ],
        confidence=0.97,
    ),
    ThreatAlert(
        id="thr-002",
        severity=ThreatSeverity.HIGH,
        type=ThreatType.PORT_SCAN,
        source_ip="198.51.100.77",
        target_ip="10.0.0.0/24",
        description="Systematic TCP SYN port scan detected from external host. 65,000+ ports probed in 30 seconds.",
        timestamp=_dt(3),
        status=ThreatStatus.ACTIVE,
        affected_devices=["dev-007", "dev-008"],
        mitigation_steps=[
            "Block source IP on perimeter firewall",
            "Enable SYN flood protection",
            "Review firewall ACLs",
        ],
        confidence=0.93,
    ),
    ThreatAlert(
        id="thr-003",
        severity=ThreatSeverity.HIGH,
        type=ThreatType.UNAUTHORIZED_ACCESS,
        source_ip="10.0.2.55",
        target_ip="192.168.20.10",
        description="Multiple failed SSH authentication attempts on db-server-01 followed by successful login from unexpected internal host.",
        timestamp=_dt(6),
        status=ThreatStatus.INVESTIGATING,
        affected_devices=["dev-010"],
        mitigation_steps=[
            "Lock compromised account",
            "Rotate SSH keys",
            "Review access logs",
            "Enable MFA for SSH",
        ],
        confidence=0.88,
    ),
    ThreatAlert(
        id="thr-004",
        severity=ThreatSeverity.MEDIUM,
        type=ThreatType.BRUTE_FORCE,
        source_ip="198.51.100.120",
        target_ip="10.0.0.254",
        description="Brute force login attempts detected on fw-primary management interface — 1,200 failed attempts in 10 minutes.",
        timestamp=_dt(12),
        status=ThreatStatus.MITIGATED,
        affected_devices=["dev-007"],
        mitigation_steps=[
            "IP blocked via auto-remediation",
            "Management access locked for 24h",
        ],
        confidence=0.99,
    ),
    ThreatAlert(
        id="thr-005",
        severity=ThreatSeverity.MEDIUM,
        type=ThreatType.ANOMALY,
        source_ip="192.168.10.10",
        target_ip="203.0.113.0/24",
        description="Unusual outbound data transfer from web-server-01. Volume 8x above 7-day baseline — possible data exfiltration.",
        timestamp=_dt(24),
        status=ThreatStatus.INVESTIGATING,
        affected_devices=["dev-009"],
        mitigation_steps=[
            "Capture and analyse traffic",
            "Check for malware on host",
            "Temporarily block outbound connections",
        ],
        confidence=0.74,
    ),
    ThreatAlert(
        id="thr-006",
        severity=ThreatSeverity.LOW,
        type=ThreatType.PORT_SCAN,
        source_ip="192.168.1.88",
        target_ip="192.168.20.0/24",
        description="Internal host performing reconnaissance scan of database network segment.",
        timestamp=_dt(48),
        status=ThreatStatus.RESOLVED,
        affected_devices=["dev-010"],
        mitigation_steps=["Source isolated and remediated"],
        confidence=0.85,
    ),
]

# ---------------------------------------------------------------------------
# Sample config changes
# ---------------------------------------------------------------------------

CONFIG_CHANGES: List[ConfigChange] = [
    ConfigChange(
        id="cfg-001",
        device_id="dev-003",
        change_type=ConfigChangeType.ACL_UPDATE,
        old_config="ip access-list extended WAN-IN\n permit ip any any",
        new_config="ip access-list extended WAN-IN\n deny ip 203.0.113.0 0.0.0.255 any\n permit ip any any",
        status=ConfigChangeStatus.APPLIED,
        timestamp=_dt(0.5),
        author="noc-admin",
        comment="Block DDoS source range",
        compliance=True,
    ),
    ConfigChange(
        id="cfg-002",
        device_id="dev-007",
        change_type=ConfigChangeType.SECURITY_POLICY,
        old_config='<security-policy><rule name="allow-all"><action>allow</action></rule></security-policy>',
        new_config='<security-policy><rule name="block-bruteforce"><action>deny</action><source>198.51.100.120</source></rule></security-policy>',
        status=ConfigChangeStatus.APPLIED,
        timestamp=_dt(11.5),
        author="security-bot",
        comment="Auto-remediation: brute force block",
        compliance=True,
    ),
    ConfigChange(
        id="cfg-003",
        device_id="dev-006",
        change_type=ConfigChangeType.VLAN_CHANGE,
        old_config="vlan 100\n name Corp-Users",
        new_config="vlan 100\n name Corp-Users\nvlan 200\n name IoT-Devices",
        status=ConfigChangeStatus.APPLIED,
        timestamp=_dt(hours_ago=0, days_ago=2),
        author="net-engineer",
        comment="Add IoT VLAN",
        compliance=True,
    ),
    ConfigChange(
        id="cfg-004",
        device_id="dev-003",
        change_type=ConfigChangeType.ROUTING_CHANGE,
        old_config="ip route 0.0.0.0 0.0.0.0 10.0.0.1",
        new_config="ip route 0.0.0.0 0.0.0.0 10.0.0.1\nip route 192.168.100.0 255.255.255.0 Null0",
        status=ConfigChangeStatus.APPLIED,
        timestamp=_dt(hours_ago=0, days_ago=3),
        author="net-engineer",
        comment="Add null route for bogon range",
        compliance=False,  # non-compliant — missing documentation
    ),
    ConfigChange(
        id="cfg-005",
        device_id="dev-010",
        change_type=ConfigChangeType.SNMP_CHANGE,
        old_config='snmp-server community "public" ro',
        new_config='snmp-server community "n3tAI-mon-2024" ro',
        status=ConfigChangeStatus.PENDING,
        timestamp=_dt(hours_ago=0, days_ago=0),
        author="auto-compliance",
        comment="Replace default SNMP community string",
        compliance=True,
    ),
    ConfigChange(
        id="cfg-006",
        device_id="dev-001",
        change_type=ConfigChangeType.NTP_CHANGE,
        old_config="ntp server 0.pool.ntp.org",
        new_config="ntp server 10.0.0.100\nntp server 10.0.0.101",
        status=ConfigChangeStatus.APPLIED,
        timestamp=_dt(hours_ago=0, days_ago=5),
        author="net-engineer",
        comment="Switch to internal NTP servers",
        compliance=True,
    ),
]

# ---------------------------------------------------------------------------
# Sample software updates
# ---------------------------------------------------------------------------

SOFTWARE_UPDATES: List[SoftwareUpdate] = [
    SoftwareUpdate(
        id="sw-001",
        device_id="dev-003",
        current_version="IOS-XE 17.6.1",
        target_version="IOS-XE 17.9.3",
        status=UpdateStatus.SCHEDULED,
        scheduled_at=_dt(hours_ago=-24),  # in 24h
        rollback_version="IOS-XE 17.6.1",
        release_notes="Security patches CVE-2024-1234, CVE-2024-5678. Performance improvements.",
        severity="critical",
    ),
    SoftwareUpdate(
        id="sw-002",
        device_id="dev-006",
        current_version="NX-OS 10.2.3",
        target_version="NX-OS 10.2.5",
        status=UpdateStatus.PENDING,
        rollback_version="NX-OS 10.2.3",
        release_notes="Bug fixes and minor security improvements.",
        severity="medium",
    ),
    SoftwareUpdate(
        id="sw-003",
        device_id="dev-009",
        current_version="Ubuntu 22.04.2 LTS",
        target_version="Ubuntu 22.04.4 LTS",
        status=UpdateStatus.PENDING,
        rollback_version="Ubuntu 22.04.2 LTS",
        release_notes="Kernel security patches and OpenSSL updates.",
        severity="high",
    ),
    SoftwareUpdate(
        id="sw-004",
        device_id="dev-001",
        current_version="IOS-XE 17.9.2",
        target_version="IOS-XE 17.9.3",
        status=UpdateStatus.COMPLETED,
        scheduled_at=_dt(hours_ago=0, days_ago=7),
        completed_at=_dt(hours_ago=0, days_ago=7),
        rollback_version="IOS-XE 17.9.2",
        release_notes="Minor bug fixes.",
        severity="low",
    ),
    SoftwareUpdate(
        id="sw-005",
        device_id="dev-007",
        current_version="PAN-OS 11.0.1",
        target_version="PAN-OS 11.0.2",
        status=UpdateStatus.COMPLETED,
        scheduled_at=_dt(hours_ago=0, days_ago=14),
        completed_at=_dt(hours_ago=0, days_ago=14),
        rollback_version="PAN-OS 11.0.1",
        release_notes="Security updates and threat prevention improvements.",
        severity="high",
    ),
]

# ---------------------------------------------------------------------------
# Sample alerts
# ---------------------------------------------------------------------------

ALERTS: List[Alert] = [
    Alert(
        id="alt-001",
        type=AlertType.CPU_HIGH,
        severity=ThreatSeverity.CRITICAL,
        device_id="dev-010",
        message="db-server-01 CPU usage at 91.7% — exceeds critical threshold of 90%",
        timestamp=_dt(0.1),
        acknowledged=False,
    ),
    Alert(
        id="alt-002",
        type=AlertType.CPU_HIGH,
        severity=ThreatSeverity.HIGH,
        device_id="dev-003",
        message="edge-router-01 CPU usage at 88.9% — exceeds warning threshold of 80%",
        timestamp=_dt(0.2),
        acknowledged=False,
    ),
    Alert(
        id="alt-003",
        type=AlertType.MEMORY_HIGH,
        severity=ThreatSeverity.HIGH,
        device_id="dev-010",
        message="db-server-01 memory usage at 87.4% — exceeds warning threshold of 85%",
        timestamp=_dt(0.3),
        acknowledged=False,
    ),
    Alert(
        id="alt-004",
        type=AlertType.THREAT_DETECTED,
        severity=ThreatSeverity.CRITICAL,
        device_id="dev-003",
        message="Active DDoS attack targeting edge-router-01 — 45 Gbps flood",
        timestamp=_dt(1),
        acknowledged=False,
    ),
    Alert(
        id="alt-005",
        type=AlertType.LINK_DOWN,
        severity=ThreatSeverity.MEDIUM,
        device_id="dev-004",
        message="Link lnk-004 between edge-router-02 and core-router-02 is degraded (0.12% packet loss)",
        timestamp=_dt(2),
        acknowledged=True,
        acknowledged_by="noc-admin",
        acknowledged_at=_dt(1.5),
    ),
    Alert(
        id="alt-006",
        type=AlertType.FIRMWARE_OUTDATED,
        severity=ThreatSeverity.HIGH,
        device_id="dev-003",
        message="edge-router-01 running IOS-XE 17.6.1 — critical security vulnerabilities (CVE-2024-1234, CVE-2024-5678)",
        timestamp=_dt(hours_ago=0, days_ago=1),
        acknowledged=False,
    ),
    Alert(
        id="alt-007",
        type=AlertType.CONFIG_DRIFT,
        severity=ThreatSeverity.MEDIUM,
        device_id="dev-003",
        message="edge-router-01 config change cfg-004 lacks required change ticket documentation",
        timestamp=_dt(hours_ago=0, days_ago=3),
        acknowledged=True,
        acknowledged_by="net-engineer",
        acknowledged_at=_dt(hours_ago=0, days_ago=2),
    ),
    Alert(
        id="alt-008",
        type=AlertType.LATENCY_HIGH,
        severity=ThreatSeverity.MEDIUM,
        device_id="dev-004",
        message="Link lnk-004 latency at 2.8ms — exceeds SLA threshold of 2ms",
        timestamp=_dt(hours_ago=0, days_ago=0),
        acknowledged=False,
    ),
]

# ---------------------------------------------------------------------------
# Metrics history — generate 24h of 15-minute data points
# ---------------------------------------------------------------------------

def _generate_metrics(
    base_cpu: float,
    base_mem: float,
    base_disk: float,
    points: int = 96,
) -> Dict[str, Any]:
    random.seed(42)
    timestamps = [_NOW - timedelta(minutes=15 * i) for i in range(points, 0, -1)]
    cpu = [max(0, min(100, base_cpu + random.gauss(0, 8))) for _ in timestamps]
    mem = [max(0, min(100, base_mem + random.gauss(0, 3))) for _ in timestamps]
    disk = [max(0, min(100, base_disk + random.gauss(0, 1))) for _ in timestamps]
    net_in = [max(0, 100 + random.gauss(0, 30)) for _ in timestamps]
    net_out = [max(0, 80 + random.gauss(0, 25)) for _ in timestamps]
    return {
        "timestamps": [t.isoformat() for t in timestamps],
        "cpu": cpu,
        "memory": mem,
        "disk": disk,
        "network_in_mbps": net_in,
        "network_out_mbps": net_out,
    }


METRICS_HISTORY: Dict[str, Dict[str, Any]] = {
    dev.id: _generate_metrics(dev.cpu_usage, dev.memory_usage, dev.disk_usage)
    for dev in DEVICES
}

# ---------------------------------------------------------------------------
# Device configs (simplified text representation)
# ---------------------------------------------------------------------------

DEVICE_CONFIGS: Dict[str, str] = {
    "dev-001": (
        "hostname core-router-01\n"
        "ip routing\n"
        "ntp server 10.0.0.100\n"
        "ntp server 10.0.0.101\n"
        "snmp-server community n3tAI-mon-2024 ro\n"
        "logging host 10.0.0.50\n"
        "ip access-list extended MGMT-IN\n"
        " permit tcp 10.0.0.0 0.0.0.255 any eq 22\n"
        " deny ip any any log\n"
    ),
    "dev-003": (
        "hostname edge-router-01\n"
        "ip routing\n"
        "ntp server 0.pool.ntp.org\n"
        "snmp-server community public ro\n"
        "ip access-list extended WAN-IN\n"
        " deny ip 203.0.113.0 0.0.0.255 any\n"
        " permit ip any any\n"
        "ip route 0.0.0.0 0.0.0.0 10.0.0.1\n"
        "ip route 192.168.100.0 255.255.255.0 Null0\n"
    ),
    "dev-007": (
        "hostname fw-primary\n"
        "<security-zone name='trust'><interface>eth1/1</interface></security-zone>\n"
        "<security-zone name='untrust'><interface>eth1/2</interface></security-zone>\n"
        "<security-policy>\n"
        "  <rule name='block-bruteforce'><action>deny</action><source>198.51.100.120</source></rule>\n"
        "  <rule name='allow-established'><action>allow</action><state>established</state></rule>\n"
        "</security-policy>\n"
    ),
    "dev-010": (
        "hostname db-server-01\n"
        "# PostgreSQL 15 on Ubuntu 22.04\n"
        "# Interfaces: eth0=192.168.20.10/24\n"
        "# SSH: port 22, key-based auth only\n"
        "# Firewall: ufw enabled — allow 5432 from 192.168.20.0/24\n"
        "snmp-server community public ro\n"  # compliance issue
    ),
}


# ---------------------------------------------------------------------------
# Mutable stores (copies allow mutation without touching originals)
# ---------------------------------------------------------------------------

devices_db: List[Device] = list(DEVICES)
links_db: List[NetworkLink] = list(LINKS)
threats_db: List[ThreatAlert] = list(THREATS)
config_changes_db: List[ConfigChange] = list(CONFIG_CHANGES)
software_updates_db: List[SoftwareUpdate] = list(SOFTWARE_UPDATES)
alerts_db: List[Alert] = list(ALERTS)
metrics_db: Dict[str, Dict[str, Any]] = dict(METRICS_HISTORY)
configs_db: Dict[str, str] = dict(DEVICE_CONFIGS)
