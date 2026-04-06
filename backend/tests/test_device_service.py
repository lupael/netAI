"""Unit tests for device_service."""
from __future__ import annotations

import pytest

from app.services import device_service


def test_get_all_devices_returns_list() -> None:
    devices = device_service.get_all_devices()
    assert isinstance(devices, list)
    assert len(devices) > 0


def test_get_device_found() -> None:
    all_devices = device_service.get_all_devices()
    first_id = all_devices[0].id
    device = device_service.get_device(first_id)
    assert device is not None
    assert device.id == first_id


def test_get_device_not_found() -> None:
    device = device_service.get_device("nonexistent-xyz")
    assert device is None


def test_get_device_health_found() -> None:
    all_devices = device_service.get_all_devices()
    first_id = all_devices[0].id
    health = device_service.get_device_health(first_id)
    assert health is not None
    assert health.device_id == first_id
    assert 0.0 <= health.health_score <= 100.0


def test_get_device_health_not_found() -> None:
    health = device_service.get_device_health("nonexistent-xyz")
    assert health is None


def test_get_failure_predictions_returns_list() -> None:
    predictions = device_service.get_failure_predictions()
    assert isinstance(predictions, list)


def test_device_metrics_have_required_fields() -> None:
    all_devices = device_service.get_all_devices()
    first_id = all_devices[0].id
    metrics = device_service.get_device_metrics(first_id)
    assert metrics is not None
    assert "cpu_history" in metrics or "cpu" in str(metrics)
