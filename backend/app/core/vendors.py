"""Vendor adapter layer — normalises device data from different network vendors."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class VendorProfile:
    name: str
    os_family: str
    snmp_oid_prefix: str
    identify_keywords: list[str]
    cli_command_map: dict[str, str]
    supported_protocols: list[str]


VENDOR_PROFILES: dict[str, VendorProfile] = {
    "cisco": VendorProfile(
        name="Cisco",
        os_family="IOS/IOS-XE",
        snmp_oid_prefix="1.3.6.1.4.1.9",
        identify_keywords=["cisco", "ios", "ios-xe", "ios-xr", "catalyst", "asr", "nexus", "isr"],
        cli_command_map={
            "show_interfaces": "show interfaces",
            "show_version": "show version",
            "show_config": "show running-config",
            "show_routes": "show ip route",
            "show_health": "show processes cpu",
        },
        supported_protocols=["SNMP", "SSH", "NETCONF", "RESTCONF", "CLI"],
    ),
    "mikrotik": VendorProfile(
        name="MikroTik",
        os_family="RouterOS",
        snmp_oid_prefix="1.3.6.1.4.1.14988",
        identify_keywords=["mikrotik", "routeros", "ccr", "crs", "rb"],
        cli_command_map={
            "show_interfaces": "/interface print",
            "show_version": "/system resource print",
            "show_config": "/export",
            "show_routes": "/ip route print",
            "show_health": "/system resource print",
        },
        supported_protocols=["API", "SSH", "SNMP", "Winbox"],
    ),
    "juniper": VendorProfile(
        name="Juniper",
        os_family="JunOS",
        snmp_oid_prefix="1.3.6.1.4.1.2636",
        identify_keywords=["juniper", "junos", "mx", "ex", "qfx", "srx"],
        cli_command_map={
            "show_interfaces": "show interfaces",
            "show_version": "show version",
            "show_config": "show configuration",
            "show_routes": "show route",
            "show_health": "show system processes",
        },
        supported_protocols=["NETCONF", "RESTCONF", "SSH", "SNMP", "CLI"],
    ),
    "nokia": VendorProfile(
        name="Nokia",
        os_family="SR OS",
        snmp_oid_prefix="1.3.6.1.4.1.6527",
        identify_keywords=["nokia", "alcatel", "sr os", "sros", "7750", "7210"],
        cli_command_map={
            "show_interfaces": "show router interface",
            "show_version": "show system information",
            "show_config": "admin display-config",
            "show_routes": "show router route-table",
            "show_health": "show system cpu",
        },
        supported_protocols=["NETCONF", "gRPC", "SNMP", "SSH", "CLI"],
    ),
    "linux": VendorProfile(
        name="Ubuntu/Linux",
        os_family="Linux",
        snmp_oid_prefix="1.3.6.1.4.1.8072",
        identify_keywords=["linux", "ubuntu", "debian", "centos", "rhel", "net-snmp"],
        cli_command_map={
            "show_interfaces": "ip addr show",
            "show_version": "uname -a",
            "show_config": "cat /etc/network/interfaces",
            "show_routes": "ip route show",
            "show_health": "top -bn1",
        },
        supported_protocols=["SNMP", "SSH", "Prometheus", "REST"],
    ),
    "bdcom": VendorProfile(
        name="BDcom",
        os_family="BDcom OS",
        snmp_oid_prefix="1.3.6.1.4.1.3652",
        identify_keywords=["bdcom", "bdos"],
        cli_command_map={
            "show_interfaces": "show interfaces",
            "show_version": "show version",
            "show_config": "show running-config",
            "show_routes": "show ip route",
            "show_health": "show processes cpu",
        },
        supported_protocols=["SNMP", "SSH", "CLI", "Telnet"],
    ),
    "vsol": VendorProfile(
        name="VSOL",
        os_family="VSOL OS",
        snmp_oid_prefix="1.3.6.1.4.1.34592",
        identify_keywords=["vsol", "vpon"],
        cli_command_map={
            "show_interfaces": "show interfaces",
            "show_version": "show version",
            "show_config": "show running-config",
            "show_health": "show system status",
        },
        supported_protocols=["SNMP", "SSH", "CLI", "TR-069"],
    ),
    "dbc": VendorProfile(
        name="DBC",
        os_family="DBC OS",
        snmp_oid_prefix="1.3.6.1.4.1.2011",
        identify_keywords=["dbc", "huawei", "vrp"],
        cli_command_map={
            "show_interfaces": "display interface",
            "show_version": "display version",
            "show_config": "display current-configuration",
            "show_routes": "display ip routing-table",
            "show_health": "display cpu-usage",
        },
        supported_protocols=["NETCONF", "SNMP", "SSH", "CLI"],
    ),
}


def identify_vendor(sys_descr: str) -> str:
    """Return a vendor key by matching *sys_descr* against known keywords."""
    lower = sys_descr.lower()
    for key, profile in VENDOR_PROFILES.items():
        for kw in profile.identify_keywords:
            if kw in lower:
                return key
    return "cisco"


def get_vendor_profile(vendor_key: str) -> VendorProfile:
    """Return VendorProfile for *vendor_key* or raise KeyError."""
    if vendor_key not in VENDOR_PROFILES:
        raise KeyError(f"Unknown vendor key: {vendor_key!r}")
    return VENDOR_PROFILES[vendor_key]
