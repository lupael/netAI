"""Unit tests for nlp_service."""
from __future__ import annotations

import pytest

from app.core.models import NLPQuery
from app.services import nlp_service


def test_get_suggestions_returns_list() -> None:
    suggestions = nlp_service.get_suggestions()
    assert isinstance(suggestions, list)
    assert len(suggestions) > 0
    assert all(isinstance(s, str) for s in suggestions)


def test_process_query_list_devices() -> None:
    query = NLPQuery(query="show all devices")
    response = nlp_service.process_query(query)
    assert response is not None
    assert isinstance(response.response, str)
    assert len(response.response) > 0


def test_process_query_threat_info() -> None:
    query = NLPQuery(query="show active threats")
    response = nlp_service.process_query(query)
    assert response is not None
    assert response.response


def test_process_query_unknown_intent() -> None:
    query = NLPQuery(query="xyzzy frobnicator irrelevant nonsense 12345")
    response = nlp_service.process_query(query)
    assert response is not None
    # Should not raise; may return a help message
    assert isinstance(response.response, str)


def test_process_query_help() -> None:
    query = NLPQuery(query="help")
    response = nlp_service.process_query(query)
    assert response is not None
    assert response.response


def test_process_query_has_required_fields() -> None:
    from app.core.models import NLPResponse
    # Verify required fields exist on the NLPResponse Pydantic model
    assert "response" in NLPResponse.model_fields
    assert "confidence" in NLPResponse.model_fields
    query = NLPQuery(query="list all routers")
    response = nlp_service.process_query(query)
    assert response.response is not None
