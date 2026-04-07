# ADR 0002 — NLP Keyword Matching

**Status:** Accepted (pending LLM integration)  
**Date:** 2026-04-06  
**Deciders:** netAI core team

---

## Context

The netAI ChatOps interface (`/api/nlp/query`) allows operators to ask free-form
questions about the network in natural language, e.g. *"show active threats"* or
*"which devices have high CPU?"*.

A production-grade implementation would call an LLM (OpenAI, Azure OpenAI, or a
local Ollama model), but that introduces external API costs, latency, and a
dependency on internet connectivity or GPU hardware.

## Decision

Implement NLP using **regex-based keyword matching** with a fixed intent catalogue
(`backend/app/services/nlp_service.py`).

Each intent maps a compiled regex to a handler function that queries the
in-memory datastore and returns a structured `NLPResponse`.

### Supported intents (~15)

| Intent | Example query |
|---|---|
| `list_devices` | "show all routers" |
| `list_threats` | "list active threats" |
| `list_alerts` | "get unacked alerts" |
| `device_health` | "CPU usage on core-router-01" |
| `topology` | "show network map" |
| `config_status` | "check compliance" |
| `software_updates` | "pending firmware updates" |
| `failure_prediction` | "which devices might fail?" |
| `link_stats` | "bandwidth utilization" |
| `help` | "what can you do?" |

## Consequences

### Positive
- No external API keys or network access required
- Deterministic, fast, easily unit-testable
- Sufficient for demo and proof-of-concept use

### Negative
- Only handles ~15 known intents; unknown queries return a generic help message
- No context / conversation history between turns
- Cannot answer truly novel questions not covered by the intent list

---

## Upgrade Path

### Option A — OpenAI / Azure OpenAI

```python
import openai

def process_query(query: NLPQuery) -> NLPResponse:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": query.query},
    ]
    completion = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )
    return NLPResponse(response=completion.choices[0].message.content)
```

Set `OPENAI_API_KEY` env var; add `openai>=1.0.0` to `requirements.txt`.

### Option B — Local Ollama (llama3)

```python
import httpx

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

def process_query(query: NLPQuery) -> NLPResponse:
    r = httpx.post(f"{OLLAMA_URL}/api/generate",
                   json={"model": "llama3", "prompt": query.query, "stream": False})
    return NLPResponse(response=r.json()["response"])
```

No API key needed; requires Ollama running locally or in a sidecar container.

### Option C — Streaming responses (NLP-003)

Replace `NLPResponse` with `StreamingResponse` + server-sent events to stream
tokens as the LLM generates them, improving perceived responsiveness.
