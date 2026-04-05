"""Statistical anomaly detection — no heavy ML libraries required."""
from __future__ import annotations

import math
import statistics
from typing import Any, Dict, List, Optional, Sequence

from app.core.models import AnomalyResult


def _z_score(value: float, data: Sequence[float]) -> float:
    """Return the z-score of *value* relative to *data*."""
    if len(data) < 2:
        return 0.0
    mean = statistics.mean(data)
    stdev = statistics.stdev(data)
    if stdev == 0:
        return 0.0
    return abs(value - mean) / stdev


def _iqr_score(value: float, data: Sequence[float]) -> float:
    """Return how many IQR widths *value* sits above the 75th percentile."""
    if len(data) < 4:
        return 0.0
    sorted_data = sorted(data)
    n = len(sorted_data)
    q1 = sorted_data[n // 4]
    q3 = sorted_data[(3 * n) // 4]
    iqr = q3 - q1
    if iqr == 0:
        return 0.0
    return max(0.0, (value - q3) / iqr)


def _ewma_deviation(value: float, data: Sequence[float], alpha: float = 0.3) -> float:
    """Return the deviation from an EWMA forecast."""
    if not data:
        return 0.0
    ewma = data[0]
    for point in data[1:]:
        ewma = alpha * point + (1 - alpha) * ewma
    variance_sum = sum((p - ewma) ** 2 for p in data[-20:])
    ewma_std = math.sqrt(variance_sum / max(len(data[-20:]), 1))
    if ewma_std == 0:
        return 0.0
    return abs(value - ewma) / ewma_std


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_cpu_anomaly(
    current: float,
    history: List[float],
    threshold_z: float = 2.5,
    threshold_abs: float = 85.0,
) -> AnomalyResult:
    """Detect anomalous CPU usage using z-score and absolute thresholds."""
    z = _z_score(current, history) if history else 0.0
    iqr = _iqr_score(current, history) if history else 0.0
    ewma = _ewma_deviation(current, history) if history else 0.0

    combined_score = max(z, iqr * 1.5, ewma)
    is_anomaly = combined_score >= threshold_z or current >= threshold_abs

    details = (
        f"z-score={z:.2f}, IQR-score={iqr:.2f}, EWMA-dev={ewma:.2f}; "
        f"current={current:.1f}%, baseline-mean={statistics.mean(history) if history else 'N/A':.1f}%"
        if history
        else f"current={current:.1f}%"
    )
    return AnomalyResult(
        is_anomaly=is_anomaly,
        score=round(combined_score, 3),
        threshold=threshold_z,
        details=details,
    )


def detect_traffic_anomaly(
    flows: List[Dict[str, Any]],
    history_volumes: Optional[List[float]] = None,
    threshold_z: float = 3.0,
) -> AnomalyResult:
    """Detect anomalous traffic patterns from flow records."""
    if not flows:
        return AnomalyResult(is_anomaly=False, score=0.0, threshold=threshold_z, details="No flows provided")

    total_bytes = sum(float(f.get("bytes", 0)) for f in flows)
    unique_dsts = len({f.get("dst_ip") for f in flows})
    unique_ports = len({f.get("dst_port") for f in flows})

    # Port scan heuristic: many unique ports from few sources
    port_scan_score = 0.0
    if unique_ports > 100:
        port_scan_score = min(unique_ports / 100.0, 5.0)

    # Volume anomaly vs historical baseline
    volume_score = 0.0
    if history_volumes:
        volume_score = _z_score(total_bytes, history_volumes)

    combined_score = max(volume_score, port_scan_score)
    is_anomaly = combined_score >= threshold_z

    details = (
        f"total_bytes={total_bytes:.0f}, unique_dst_ips={unique_dsts}, "
        f"unique_ports={unique_ports}, volume_z={volume_score:.2f}, "
        f"port_scan_score={port_scan_score:.2f}"
    )
    return AnomalyResult(
        is_anomaly=is_anomaly,
        score=round(combined_score, 3),
        threshold=threshold_z,
        details=details,
    )


def detect_config_anomaly(
    config: str,
    baseline_patterns: Optional[List[str]] = None,
) -> AnomalyResult:
    """Detect configuration anomalies by checking for risky patterns."""
    risky_patterns = [
        ("permit ip any any", 3.0, "Overly permissive ACL — permits all traffic"),
        ("community public", 2.5, "Default SNMP community string in use"),
        ("no ip ssh", 2.0, "SSH disabled on device"),
        ("telnet", 1.5, "Telnet enabled — plaintext protocol"),
        ("no service password-encryption", 1.5, "Password encryption disabled"),
        ("ip http server", 1.0, "HTTP management interface enabled"),
        ("no logging", 1.0, "Logging disabled"),
    ]

    findings: List[str] = []
    max_score = 0.0

    config_lower = config.lower()
    for pattern, score, description in risky_patterns:
        if pattern.lower() in config_lower:
            findings.append(description)
            max_score = max(max_score, score)

    # Reward compliant patterns (reduce score)
    compliant_patterns = ["ssh version 2", "service password-encryption", "logging host", "ntp server"]
    compliance_bonus = sum(0.2 for p in compliant_patterns if p.lower() in config_lower)
    final_score = max(0.0, max_score - compliance_bonus)

    is_anomaly = final_score >= 2.0

    details = "; ".join(findings) if findings else "No risky patterns detected"
    return AnomalyResult(
        is_anomaly=is_anomaly,
        score=round(final_score, 3),
        threshold=2.0,
        details=details,
    )


def predict_failure_probability(
    cpu_history: List[float],
    memory_history: List[float],
    uptime_seconds: int,
) -> Dict[str, Any]:
    """Estimate probability of device failure in the next 24 hours."""
    if not cpu_history or not memory_history:
        return {"probability": 0.0, "risk_level": "unknown", "factors": []}

    factors: List[str] = []
    score = 0.0

    # High sustained CPU
    recent_cpu = cpu_history[-12:] if len(cpu_history) >= 12 else cpu_history
    avg_cpu = statistics.mean(recent_cpu)
    if avg_cpu > 90:
        score += 0.4
        factors.append(f"Sustained critical CPU ({avg_cpu:.1f}%)")
    elif avg_cpu > 75:
        score += 0.2
        factors.append(f"Elevated CPU usage ({avg_cpu:.1f}%)")

    # High sustained memory
    recent_mem = memory_history[-12:] if len(memory_history) >= 12 else memory_history
    avg_mem = statistics.mean(recent_mem)
    if avg_mem > 90:
        score += 0.35
        factors.append(f"Critical memory pressure ({avg_mem:.1f}%)")
    elif avg_mem > 80:
        score += 0.15
        factors.append(f"High memory usage ({avg_mem:.1f}%)")

    # CPU trend (is it increasing?)
    if len(cpu_history) >= 6:
        early = statistics.mean(cpu_history[:len(cpu_history) // 2])
        late = statistics.mean(cpu_history[len(cpu_history) // 2 :])
        if late - early > 15:
            score += 0.15
            factors.append(f"Rising CPU trend (+{late - early:.1f}%)")

    # Long uptime without restart
    uptime_days = uptime_seconds / 86400
    if uptime_days > 180:
        score += 0.1
        factors.append(f"Extended uptime ({uptime_days:.0f} days) without restart")

    probability = min(1.0, score)
    if probability < 0.2:
        risk_level = "low"
    elif probability < 0.5:
        risk_level = "medium"
    elif probability < 0.75:
        risk_level = "high"
    else:
        risk_level = "critical"

    return {
        "probability": round(probability, 3),
        "risk_level": risk_level,
        "factors": factors,
    }
