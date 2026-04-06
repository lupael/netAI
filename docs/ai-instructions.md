# netAI — AI Agent Instructions

> These instructions govern how AI coding agents (GitHub Copilot, Claude, GPT-4, Cursor, etc.)
> must behave when contributing to the **netAI** repository.
>
> **All contributors — human and AI — must follow these rules.**

---

## Table of Contents

1. [Golden Rules](#golden-rules)
2. [Documentation Requirements](#documentation-requirements)
3. [Project Conventions](#project-conventions)
4. [Backend Guidelines](#backend-guidelines)
5. [Frontend Guidelines](#frontend-guidelines)
6. [Testing Requirements](#testing-requirements)
7. [Security Rules](#security-rules)
8. [Commit & PR Rules](#commit--pr-rules)
9. [Prohibited Actions](#prohibited-actions)
10. [Quick Reference](#quick-reference)

---

## Golden Rules

1. **Documentation first** — You MUST update or create documentation in `docs/` before committing code or opening a PR.
2. **docs/ folder only** — All project documentation lives exclusively in the `docs/` folder. Never create `.md` files outside `docs/` (except `README.md`).
3. **Small, surgical changes** — Change only what is necessary. Do not refactor unrelated code.
4. **Never break existing behavior** — Run the CI checks before finalising. Do not remove or modify existing tests.
5. **No secrets** — Never commit credentials, API keys, passwords, or tokens. Use environment variables.
6. **Security first** — Never introduce authentication bypasses, CORS wildcards without justification, or unvalidated user input.

---

## Documentation Requirements

### Before Every Commit

You MUST ensure the following are current before committing:

- [ ] If you added or changed a **backend route** → update `docs/developer-guide.md` (API Reference section)
- [ ] If you added or changed a **frontend page** → update `docs/developer-guide.md` (Frontend section) and `docs/user-guide.md`
- [ ] If you added a **new vendor** → update both `docs/developer-guide.md` (Multi-Vendor section) and `docs/user-guide.md` (Supported Vendors section)
- [ ] If you changed the **data model** → update the field mapping table in `docs/developer-guide.md`
- [ ] If you changed **environment variables** → update the environment variable tables in both guides
- [ ] If you found and fixed a **bug** → add the fix to `docs/TODO.md` (Completed section)
- [ ] If you completed a **TODO item** → move it to the Completed section in `docs/TODO.md`

### Before Opening a PR

You MUST create or update **at minimum one** of these docs files to describe your change:

| docs/ file | When to update |
|-----------|----------------|
| `developer-guide.md` | Any backend or infrastructure change |
| `user-guide.md` | Any frontend feature visible to users |
| `TODO.md` | Any completed task or new task discovered |
| `investigation-report.md` | Major architectural findings or security discoveries |
| `ai-instructions.md` | Changes to AI contribution conventions |

### How to Document

- Write documentation in **Markdown**, following the style of existing docs files.
- Use **present tense** ("Returns a list of devices", not "will return").
- Include **code examples** for any new API endpoint or configuration.
- Update the **Table of Contents** of the modified document.
- Add a **date stamp** to changed sections when appropriate.

---

## Project Conventions

### File Locations

| Content type | Location | Rule |
|-------------|----------|------|
| All documentation | `docs/` | MANDATORY — no exceptions |
| Backend route modules | `backend/app/api/routes/` | One file per domain |
| Backend services | `backend/app/services/` | Business logic only |
| Backend models | `backend/app/core/models.py` | Pydantic v2 |
| Frontend pages | `frontend/src/pages/` | One file per page |
| Frontend components | `frontend/src/components/` | Shared components only |
| TypeScript types | `frontend/src/types/index.ts` | All interfaces here |
| Temporary scripts | `/tmp/` | Never commit temp files |

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Python files | `snake_case` | `device_service.py` |
| Python functions | `snake_case` | `get_device_health()` |
| Python classes | `PascalCase` | `DeviceHealth` |
| TypeScript files | `PascalCase` | `DeviceDetail.tsx` |
| TypeScript interfaces | `PascalCase` | `Device`, `NetworkLink` |
| TypeScript functions | `camelCase` | `fetchDevices()` |
| React components | `PascalCase` | `MetricCard` |
| CSS classes | `kebab-case` | `metric-card` |
| Git branches | `copilot/<description>` | `copilot/add-auth` |

### API Design Rules

- All API routes use `/api/...` prefix — **never** `/v1/...`
- GET endpoints must be idempotent
- POST endpoints return the created/modified resource
- Use Pydantic models for all request/response bodies — no raw `dict`
- Use `HTTPException` with appropriate status codes (404, 422, 500)
- All enumerations use `str, Enum` for JSON compatibility
- Field percentage values must use `Field(ge=0, le=100)` validator

---

## Backend Guidelines

### Adding a New Route

```python
# 1. Create backend/app/api/routes/my_module.py
from fastapi import APIRouter, HTTPException
from app.core import database as db

router = APIRouter(prefix="/api/my_module", tags=["my_module"])

@router.get("", response_model=list[MyModel])
async def list_items():
    """Return all items."""
    return db.my_items_db

@router.get("/{item_id}", response_model=MyModel)
async def get_item(item_id: str):
    """Return a specific item by ID."""
    item = next((i for i in db.my_items_db if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

```python
# 2. Mount in backend/app/main.py
from app.api.routes import my_module
app.include_router(my_module.router)
```

```markdown
# 3. Document in docs/developer-guide.md → API Reference table
| GET | `/api/my_module` | List all items |
| GET | `/api/my_module/{id}` | Get item detail |
```

### Adding a Pydantic Model

Always use Pydantic **v2** syntax:

```python
# In backend/app/core/models.py
from pydantic import BaseModel, Field
from typing import Optional

class MyModel(BaseModel):
    id: str
    name: str
    value: Optional[float] = None
    percentage: float = Field(ge=0, le=100)  # Always validate range
```

Mirror the model in `frontend/src/types/index.ts` and note any field name differences in `docs/developer-guide.md`.

### Service Layer Pattern

```python
# In backend/app/services/my_service.py
from app.core import database as db
from app.core.models import MyModel

def get_summary() -> dict:
    """Compute summary statistics."""
    return {
        "total": len(db.my_items_db),
        "active": sum(1 for i in db.my_items_db if i.active),
    }
```

Services must **not** import from `routes/` (no circular imports). Routes call services; services call `database` and `models`.

### WebSocket Guidelines

- The single `/ws` endpoint broadcasts telemetry every 5 seconds
- Do not add new WebSocket endpoints without documenting the message schema in `docs/developer-guide.md`
- All WebSocket messages must include `"event"` and `"timestamp"` fields

### Anomaly Detection

Use the existing detectors before adding new ML logic:

```python
from app.core.ml.anomaly_detector import detect_cpu_anomaly, detect_traffic_anomaly

result = detect_cpu_anomaly(current=92.3, history=[...])
if result.is_anomaly:
    # trigger alert
```

---

## Frontend Guidelines

### Adding a New Page

```tsx
// 1. Create frontend/src/pages/MyPage.tsx
import React, { useState, useEffect } from 'react'
import apiClient from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const MyPage: React.FC = () => {
  const [data, setData] = useState<MyType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/api/my_module')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner size={40} />
  return <div>{/* page content */}</div>
}

export default MyPage
```

```tsx
// 2. Add lazy import and route in frontend/src/App.tsx
const MyPage = lazy(() => import('./pages/MyPage'))
// inside <Routes>:
<Route path="/my-page" element={<MyPage />} />
```

```tsx
// 3. Add navigation link in frontend/src/components/Sidebar.tsx
// Follow the existing pattern with Lucide icon + label
```

```markdown
// 4. Document in docs/user-guide.md and docs/developer-guide.md
```

### TypeScript Interface Rules

All interfaces go in `frontend/src/types/index.ts`. Mirror backend Pydantic models. Note field name differences:

```typescript
// In frontend/src/types/index.ts
export interface MyModel {
  id: string
  name: string          // backend: name
  value?: number
  percentage: number    // always 0–100
}
```

### API Client

Always use the shared Axios client:

```typescript
import apiClient from '../api/client'

// Good
const res = await apiClient.get<Device[]>('/api/devices')

// Bad — never hardcode the base URL in pages
const res = await axios.get('http://localhost:8000/api/devices')
```

### Field Mapping Adapters

When backend field names differ from frontend interfaces, write an explicit adapter function:

```typescript
const adaptDevice = (raw: any): Device => ({
  hostname: raw.name,        // backend: name → frontend: hostname
  ip_address: raw.ip,        // backend: ip → frontend: ip_address
  device_type: raw.type,
  os_version: raw.firmware_version,
})

const devices = rawData.map(adaptDevice)
```

Document the mapping in `docs/developer-guide.md`.

---

## Testing Requirements

### Backend Tests

All new backend services and routes must have corresponding tests:

```python
# backend/tests/test_my_module.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_items():
    response = client.get("/api/my_module")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_item_not_found():
    response = client.get("/api/my_module/does-not-exist")
    assert response.status_code == 404
```

Run tests before committing:

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

### Frontend Tests

New components and utility functions should have tests:

```typescript
// frontend/src/components/__tests__/MetricCard.test.tsx
import { render, screen } from '@testing-library/react'
import MetricCard from '../MetricCard'

test('renders metric card with title and value', () => {
  render(<MetricCard title="CPU" value="72%" />)
  expect(screen.getByText('CPU')).toBeInTheDocument()
  expect(screen.getByText('72%')).toBeInTheDocument()
})
```

---

## Security Rules

1. **Never hardcode credentials** in any file. Use environment variables.
2. **Never add `allow_origins=["*"]` in production** without a comment explaining why it is safe.
3. **Always validate input** — use Pydantic `Field` validators for numbers, `max_length` for strings.
4. **Never log sensitive data** (passwords, tokens, full config blobs).
5. **Check for injection** — all config text goes through `detect_config_anomaly()` before display.
6. **Upgrade vulnerable dependencies** — check GitHub Advisory Database before adding or upgrading packages.
7. **NLP queries must have max length** — add `max_length=2000` to `NLPQuery.query` field.
8. **Rate limit write endpoints** — use `slowapi` for POST/PUT/DELETE.

---

## Commit & PR Rules

### Commit Message Format

```
<type>(<scope>): <short description>

Types: feat | fix | docs | test | refactor | security | ci | chore
Scopes: backend | frontend | docs | ci | infra | auth | nlp | topology | ...

Examples:
  feat(backend): add JWT authentication middleware
  fix(frontend): remove hardcoded DEVICE_ID_MAP in Config.tsx
  docs(developer-guide): add new auth endpoints to API reference
  test(backend): add unit tests for device_service
  security(deps): upgrade python-jose to 3.5.0
```

### Pre-Commit Checklist

Before every commit, verify:

- [ ] Documentation in `docs/` is updated (see [Documentation Requirements](#documentation-requirements))
- [ ] No secrets or credentials in changed files
- [ ] All changed Python code imports successfully (`python -c "from app.main import app"`)
- [ ] Frontend builds without errors (`npm run build`)
- [ ] New backend routes are mounted in `main.py`
- [ ] New TypeScript interfaces are in `frontend/src/types/index.ts`
- [ ] `docs/TODO.md` updated if tasks were completed

### Before Opening a PR

- [ ] At least one `docs/` file is modified in the PR
- [ ] CI is green (or you have explained why a failure is pre-existing)
- [ ] PR description includes: what changed, why it changed, what was documented
- [ ] If auth-related: security review requested
- [ ] If DB-related: migration scripts included

### PR Description Template

```markdown
## What changed
Brief description of the code change.

## Why
Link to TODO item, issue, or explanation.

## Documentation updated
- [ ] docs/developer-guide.md — section updated: <section name>
- [ ] docs/user-guide.md — section updated: <section name>
- [ ] docs/TODO.md — tasks completed: <list>

## Testing
- [ ] Backend: `pytest tests/ -v` — all pass
- [ ] Frontend: `npm run build` — no errors
- [ ] Manual: tested locally with Docker Compose

## Security considerations
None / <describe any security impact>
```

---

## Prohibited Actions

The following actions are **PROHIBITED** for all AI agents and human contributors:

| Action | Reason |
|--------|--------|
| Create `.md` files outside `docs/` (except `README.md`) | Docs must be centralised |
| Commit any file containing passwords, API keys, or tokens | Security policy |
| Remove existing tests | Could hide regressions |
| Add `eval()`, `exec()`, or dynamic code execution | Security risk |
| Add `shell=True` to subprocess calls | Command injection risk |
| Set `allow_credentials=True` with `allow_origins=["*"]` | CORS security vulnerability |
| Skip Pydantic validation with `model.model_construct()` | Bypasses security validators |
| Log request bodies containing user input at INFO level or below | Privacy / log injection |
| Add npm packages with known HIGH/CRITICAL CVEs | Supply chain security |
| Hard-code device IDs, IPs, or credentials in frontend code | Breaks multi-instance deployments |

---

## Quick Reference

### Run the full stack locally

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### CI checks

```bash
# Backend import check
cd backend && python -c "from app.main import app; print('OK')"

# Frontend build
cd frontend && npm run build

# Docker validation
docker compose config --quiet
```

### Key file locations

| What | Where |
|------|-------|
| All documentation | `docs/` |
| Backend entry point | `backend/app/main.py` |
| Backend models | `backend/app/core/models.py` |
| In-memory DB | `backend/app/core/database.py` |
| ML detector | `backend/app/core/ml/anomaly_detector.py` |
| Vendor profiles | `backend/app/core/vendors.py` |
| Frontend routes | `frontend/src/App.tsx` |
| TypeScript types | `frontend/src/types/index.ts` |
| Axios client | `frontend/src/api/client.ts` |
| CI workflows | `.github/workflows/` |

### API base path

`/api/...` — Never `/v1/...`

### WebSocket path

`/ws` — Single endpoint for all real-time telemetry

---

*These instructions are enforced by the `docs-gate.yml` CI workflow. PRs that do not include a `docs/` change will be flagged.*
