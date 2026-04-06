"""Device Capability Registry — JSON/dict-based registry of per-vendor device capabilities."""
from __future__ import annotations

CAPABILITY_REGISTRY: dict[str, list[dict]] = {
    "cisco": [
        {"category": "topology_discovery", "command": "show cdp neighbors detail", "description": "CDP-based neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "show processes cpu", "description": "CPU & process health polling", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "show running-config", "description": "Running configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "NETCONF/RESTCONF", "description": "Push configuration via NETCONF or RESTCONF", "supported": True, "output_format": "xml"},
        {"category": "firmware_upgrade", "command": "install add/activate", "description": "IOS-XE in-service software upgrade (ISSU)", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "syslog", "description": "Syslog streaming to collector", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "NetFlow/IPFIX", "description": "NetFlow v9 / IPFIX flow export", "supported": True, "output_format": "netflow"},
    ],
    "mikrotik": [
        {"category": "topology_discovery", "command": "/ip neighbor print", "description": "LLDP/CDP neighbour discovery via RouterOS API", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "/system resource print", "description": "System resource monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "/export", "description": "Full configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "RouterOS API", "description": "Push config via RouterOS REST API", "supported": True, "output_format": "json"},
        {"category": "firmware_upgrade", "command": "/system package update", "description": "RouterOS package upgrade", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "/system logging", "description": "Remote syslog streaming", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "Traffic Flow", "description": "MikroTik Traffic Flow (IPFIX-compatible)", "supported": True, "output_format": "netflow"},
    ],
    "juniper": [
        {"category": "topology_discovery", "command": "show lldp neighbors", "description": "LLDP neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "show system processes", "description": "JunOS process and resource monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "show configuration", "description": "Full configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "NETCONF", "description": "Push configuration via NETCONF", "supported": True, "output_format": "xml"},
        {"category": "firmware_upgrade", "command": "request system software add", "description": "JunOS ISSU upgrade", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "syslog", "description": "Structured syslog streaming", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "jflow/IPFIX", "description": "JFlow / IPFIX flow export", "supported": True, "output_format": "netflow"},
    ],
    "nokia": [
        {"category": "topology_discovery", "command": "show router lldp neighbor", "description": "LLDP neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "show system cpu", "description": "CPU and memory monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "admin display-config", "description": "Full configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "NETCONF/gRPC", "description": "Push configuration via NETCONF or gNMI", "supported": True, "output_format": "xml"},
        {"category": "firmware_upgrade", "command": "admin upgrade", "description": "SR OS in-service upgrade", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "syslog/gRPC", "description": "Syslog or gRPC telemetry streaming", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "cflowd/IPFIX", "description": "Cflowd / IPFIX flow export", "supported": True, "output_format": "netflow"},
    ],
    "linux": [
        {"category": "topology_discovery", "command": "lldpd", "description": "LLDP daemon neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "node_exporter", "description": "Prometheus node_exporter metrics", "supported": True, "output_format": "prometheus"},
        {"category": "config_backup", "command": "cat /etc/network/interfaces", "description": "Network interface configuration backup", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "SSH/Ansible", "description": "Push configuration via SSH or Ansible", "supported": True, "output_format": "text"},
        {"category": "firmware_upgrade", "command": "apt upgrade / yum update", "description": "Package manager-based OS upgrade", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "net-snmp", "description": "net-snmp SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "rsyslog/journald", "description": "Syslog / journald streaming to collector", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "nflow/softflowd", "description": "Software-based flow export", "supported": False, "output_format": "netflow"},
    ],
    "bdcom": [
        {"category": "topology_discovery", "command": "show lldp neighbors", "description": "LLDP neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "show processes cpu", "description": "CPU and memory health monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "show running-config", "description": "Running configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "SSH/CLI", "description": "Push configuration via SSH CLI", "supported": True, "output_format": "text"},
        {"category": "firmware_upgrade", "command": "upgrade", "description": "Firmware upgrade via TFTP", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "syslog", "description": "Syslog streaming", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "sFlow", "description": "sFlow export", "supported": False, "output_format": "sflow"},
    ],
    "vsol": [
        {"category": "topology_discovery", "command": "show lldp neighbors", "description": "LLDP neighbour discovery", "supported": False, "output_format": "text"},
        {"category": "health_monitoring", "command": "show system status", "description": "System status and resource monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "show running-config", "description": "Running configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "TR-069/SSH", "description": "Push configuration via TR-069 or SSH", "supported": True, "output_format": "xml"},
        {"category": "firmware_upgrade", "command": "TR-069 upgrade", "description": "TR-069 remote firmware upgrade", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "syslog", "description": "Basic syslog streaming", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "N/A", "description": "Flow export not supported", "supported": False, "output_format": "n/a"},
    ],
    "dbc": [
        {"category": "topology_discovery", "command": "display lldp neighbor", "description": "LLDP neighbour discovery", "supported": True, "output_format": "text"},
        {"category": "health_monitoring", "command": "display cpu-usage", "description": "CPU usage monitoring", "supported": True, "output_format": "text"},
        {"category": "config_backup", "command": "display current-configuration", "description": "Running configuration export", "supported": True, "output_format": "text"},
        {"category": "config_push", "command": "NETCONF", "description": "Push configuration via NETCONF", "supported": True, "output_format": "xml"},
        {"category": "firmware_upgrade", "command": "startup system-software", "description": "Firmware upgrade via FTP/TFTP", "supported": True, "output_format": "text"},
        {"category": "snmp_polling", "command": "SNMP GET/WALK", "description": "SNMP v2c/v3 polling", "supported": True, "output_format": "snmp"},
        {"category": "log_streaming", "command": "info-center loghost", "description": "Syslog streaming to remote host", "supported": True, "output_format": "syslog"},
        {"category": "flow_export", "command": "NetStream", "description": "Huawei NetStream flow export", "supported": True, "output_format": "netflow"},
    ],
}


def get_capabilities(vendor: str) -> list[dict]:
    """Return capability list for *vendor* key, or an empty list if unknown."""
    return CAPABILITY_REGISTRY.get(vendor, [])


def supports(vendor: str, capability: str) -> bool:
    """Return True if *vendor* has *capability* marked as supported."""
    for cap in get_capabilities(vendor):
        if cap.get("category") == capability:
            return bool(cap.get("supported", False))
    return False
