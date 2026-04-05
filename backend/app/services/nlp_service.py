"""Natural language processing / ChatOps service."""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from app.core import database as db
from app.core.models import NLPQuery, NLPResponse


# ---------------------------------------------------------------------------
# Intent matching helpers
# ---------------------------------------------------------------------------

_INTENTS = [
    (r"\b(show|list|get|display)\b.*(device|router|switch|firewall|server)", "list_devices"),
    (r"\b(show|list|get)\b.*(threat|attack|ddos|scan|intrusion)", "list_threats"),
    (r"\b(show|list|get)\b.*(alert)", "list_alerts"),
    (r"\b(cpu|memory|mem|disk|utilization|usage)\b.*\b(high|usage|stats?)\b", "device_health"),
    (r"\b(health|status)\b.*(device|router|switch|server)", "device_health"),
    (r"\b(topology|network map|map)\b", "topology"),
    (r"\b(config|configuration|compliance|audit)\b", "config_status"),
    (r"\b(update|upgrade|patch|software|firmware|version)\b", "software_updates"),
    (r"\b(predict|fail|failure|risk)\b", "failure_prediction"),
    (r"\b(bandwidth|throughput|traffic|link)\b", "link_stats"),
    (r"\b(help|commands?|what can)\b", "help"),
]


def _match_intent(query: str) -> Optional[str]:
    q = query.lower()
    for pattern, intent in _INTENTS:
        if re.search(pattern, q):
            return intent
    return None


def _device_name_in_query(query: str) -> Optional[str]:
    q = query.lower()
    for device in db.devices_db:
        if device.name.lower() in q or device.ip in q:
            return device.id
    return None


# ---------------------------------------------------------------------------
# Intent handlers
# ---------------------------------------------------------------------------

def _handle_list_devices() -> NLPResponse:
    online = [d for d in db.devices_db if d.status.value == "online"]
    degraded = [d for d in db.devices_db if d.status.value == "degraded"]
    offline = [d for d in db.devices_db if d.status.value == "offline"]
    response = (
        f"There are **{len(db.devices_db)} devices** in the network:\n"
        f"- ✅ Online: {len(online)}\n"
        f"- ⚠️ Degraded: {len(degraded)}\n"
        f"- ❌ Offline: {len(offline)}\n\n"
        "Devices requiring attention: "
        + ", ".join(d.name for d in db.devices_db if d.cpu_usage > 80 or d.memory_usage > 85)
        or "none"
    )
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/topology"}],
        data=[d.model_dump() for d in db.devices_db],
        confidence=0.95,
    )


def _handle_list_threats() -> NLPResponse:
    active = [t for t in db.threats_db if t.status.value in ("active", "investigating")]
    response = (
        f"**{len(active)} active threats** detected:\n"
        + "\n".join(
            f"- [{t.severity.value.upper()}] {t.type.value}: {t.description[:80]}..."
            for t in active
        )
    ) if active else "✅ No active threats detected at this time."
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/threats"}],
        data=[t.model_dump() for t in active],
        confidence=0.95,
    )


def _handle_list_alerts() -> NLPResponse:
    unacked = [a for a in db.alerts_db if not a.acknowledged]
    response = (
        f"**{len(unacked)} unacknowledged alerts**:\n"
        + "\n".join(f"- [{a.severity.value.upper()}] {a.message}" for a in unacked[:5])
        + ("\n... and more" if len(unacked) > 5 else "")
    ) if unacked else "✅ All alerts have been acknowledged."
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/alerts"}],
        data=[a.model_dump() for a in unacked],
        confidence=0.92,
    )


def _handle_device_health(query: str) -> NLPResponse:
    device_id = _device_name_in_query(query)
    if device_id:
        device = next(d for d in db.devices_db if d.id == device_id)
        response = (
            f"**{device.name}** health summary:\n"
            f"- CPU: {device.cpu_usage:.1f}%\n"
            f"- Memory: {device.memory_usage:.1f}%\n"
            f"- Disk: {device.disk_usage:.1f}%\n"
            f"- Status: {device.status.value}\n"
            f"- Uptime: {device.uptime // 86400} days"
        )
        data: Any = device.model_dump()
    else:
        high_cpu = [d for d in db.devices_db if d.cpu_usage > 80]
        high_mem = [d for d in db.devices_db if d.memory_usage > 80]
        response = (
            f"**Device health overview:**\n"
            f"- {len(high_cpu)} device(s) with high CPU: {', '.join(d.name for d in high_cpu)}\n"
            f"- {len(high_mem)} device(s) with high memory: {', '.join(d.name for d in high_mem)}"
        )
        data = [d.model_dump() for d in db.devices_db]
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/devices"}],
        data=data,
        confidence=0.88,
    )


def _handle_topology() -> NLPResponse:
    response = (
        f"**Network topology:** {len(db.devices_db)} devices, {len(db.links_db)} links.\n"
        f"- Degraded links: {sum(1 for l in db.links_db if l.status.value == 'degraded')}\n"
        f"- High utilization links (>80%): {sum(1 for l in db.links_db if l.utilization > 80)}"
    )
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/topology"}],
        data={"devices": len(db.devices_db), "links": len(db.links_db)},
        confidence=0.93,
    )


def _handle_config_status() -> NLPResponse:
    non_compliant = [c for c in db.config_changes_db if c.compliance is False]
    response = (
        f"**Configuration status:**\n"
        f"- Total changes tracked: {len(db.config_changes_db)}\n"
        f"- Non-compliant changes: {len(non_compliant)}\n"
        + (
            "Devices with compliance issues: "
            + ", ".join({next((d.name for d in db.devices_db if d.id == c.device_id), c.device_id) for c in non_compliant})
            if non_compliant else "✅ All configurations are compliant"
        )
    )
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/config"}],
        data=[c.model_dump() for c in non_compliant],
        confidence=0.90,
    )


def _handle_software_updates() -> NLPResponse:
    pending = [u for u in db.software_updates_db if u.status.value in ("pending", "scheduled")]
    response = (
        f"**Software updates:** {len(pending)} pending/scheduled:\n"
        + "\n".join(
            f"- {next((d.name for d in db.devices_db if d.id == u.device_id), u.device_id)}: "
            f"{u.current_version} → {u.target_version} [{u.severity or 'unknown'}]"
            for u in pending
        )
    ) if pending else "✅ All devices are running up-to-date software."
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/software"}],
        data=[u.model_dump() for u in pending],
        confidence=0.91,
    )


def _handle_failure_prediction() -> NLPResponse:
    from app.services.device_service import get_failure_predictions
    preds = get_failure_predictions()
    high_risk = [p for p in preds if p["risk_level"] in ("high", "critical")]
    response = (
        f"**Failure predictions:** {len(high_risk)} high-risk device(s):\n"
        + "\n".join(
            f"- {p['device_name']}: {p['risk_level'].upper()} ({p['probability']*100:.0f}% probability) — {', '.join(p['factors'][:2])}"
            for p in high_risk
        )
    ) if high_risk else "✅ No devices predicted to fail in the next 24 hours."
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/devices"}],
        data=preds,
        confidence=0.82,
    )


def _handle_link_stats() -> NLPResponse:
    degraded = [l for l in db.links_db if l.status.value == "degraded"]
    high_util = [l for l in db.links_db if l.utilization > 80]
    response = (
        f"**Link statistics:**\n"
        f"- Total links: {len(db.links_db)}\n"
        f"- Degraded: {len(degraded)}\n"
        f"- High utilization (>80%): {len(high_util)}\n"
        f"- Highest utilization: {max(db.links_db, key=lambda l: l.utilization).utilization:.1f}%"
    )
    return NLPResponse(
        response=response,
        actions=[{"type": "navigate", "target": "/topology"}],
        data=[l.model_dump() for l in db.links_db],
        confidence=0.89,
    )


def _handle_help() -> NLPResponse:
    response = (
        "**netAI ChatOps — available queries:**\n"
        "- `show devices` — list all network devices\n"
        "- `show threats` — list active security threats\n"
        "- `show alerts` — list unacknowledged alerts\n"
        "- `device health` / `<device-name> health` — device health metrics\n"
        "- `show topology` — network topology overview\n"
        "- `config status` — configuration compliance\n"
        "- `software updates` — pending firmware/software upgrades\n"
        "- `failure predictions` — AI-powered failure forecasts\n"
        "- `link stats` — network link utilization"
    )
    return NLPResponse(response=response, actions=[], data=None, confidence=1.0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_query(query: NLPQuery) -> NLPResponse:
    intent = _match_intent(query.query)
    if intent == "list_devices":
        return _handle_list_devices()
    if intent == "list_threats":
        return _handle_list_threats()
    if intent == "list_alerts":
        return _handle_list_alerts()
    if intent == "device_health":
        return _handle_device_health(query.query)
    if intent == "topology":
        return _handle_topology()
    if intent == "config_status":
        return _handle_config_status()
    if intent == "software_updates":
        return _handle_software_updates()
    if intent == "failure_prediction":
        return _handle_failure_prediction()
    if intent == "link_stats":
        return _handle_link_stats()
    if intent == "help":
        return _handle_help()

    return NLPResponse(
        response=(
            "I didn't understand that query. Try asking about devices, threats, alerts, "
            "topology, configuration, software updates, or failure predictions. "
            "Type `help` for a list of supported commands."
        ),
        actions=[],
        data=None,
        confidence=0.0,
    )


SUGGESTIONS = [
    "show all devices",
    "show active threats",
    "show unacknowledged alerts",
    "device health overview",
    "show network topology",
    "config compliance status",
    "show pending software updates",
    "failure prediction for all devices",
    "show link utilization",
    "help",
]


def get_suggestions() -> List[str]:
    return SUGGESTIONS
