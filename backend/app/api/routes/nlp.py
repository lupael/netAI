"""NLP ChatOps routes."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter

from app.core.models import NLPQuery, NLPResponse
from app.services import nlp_service

router = APIRouter(prefix="/api/nlp", tags=["nlp"])


@router.post("/query", response_model=NLPResponse)
async def process_query(query: NLPQuery):
    """Process a natural language query and return an AI-generated response."""
    return nlp_service.process_query(query)


@router.get("/suggestions", response_model=List[str])
async def get_suggestions():
    """Return suggested ChatOps commands."""
    return nlp_service.get_suggestions()
