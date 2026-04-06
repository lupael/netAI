# netAI — Full Project Investigation Report

> Generated: 2026-04-06 | Branch: `copilot/investigate-project-for-report`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Structure](#project-structure)
3. [Backend Analysis](#backend-analysis)
4. [Frontend Analysis](#frontend-analysis)
5. [Infrastructure & CI/CD](#infrastructure--cicd)
6. [Security Assessment](#security-assessment)
7. [Data Model Review](#data-model-review)
8. [API Completeness](#api-completeness)
9. [Code Quality](#code-quality)
10. [Gaps & Risks](#gaps--risks)
11. [Recommendations](#recommendations)

---

## Executive Summary

**netAI** is an enterprise-grade, AI-powered network monitoring and management platform. The full-stack application consists of a Python/FastAPI backend (57 REST endpoints + WebSocket) and a React 18/TypeScript frontend (15 pages). The system is containerised with Docker Compose and includes a GitHub Actions CI pipeline.

| Metric | Value |
|--------|-------|
| Backend routes | 57 across 14 modules |
| Frontend pages | 15 (all lazy-loaded) |
| Supported vendors | 8 (Cisco, MikroTik, Juniper, Nokia, Linux, BDcom, VSOL, DBC) |
| Test coverage | ⚠️ 0 unit tests (integration-only) |
| Authentication | ❌ None |
| Persistent storage | ❌ In-memory only |
| Documentation | ✅ Developer + User guides in `docs/` |

**Overall health: GOOD for a prototype / demonstration system. NOT production-ready without addressing security and persistence gaps.**

---

## Project Structure

```
netAI/
├── backend/                    # Python 3.11 / FastAPI / Pydantic v2
│   ├── app/
│   │   ├── main.py             # App entry, CORS, WebSocket, KPI, health
│   │   ├── api/routes/         # 14 route modules (57 endpoints)
│   │   ├── core/
│   │   │   ├── database.py     # In-memory datastore (15 seed devices)
│   │   │   ├── device_registry.py  # Per-vendor capability matrix
│   │   │   ├── ml/
│   │   │   │   └── anomaly_detector.py  # z-score, IQR, EWMA
│   │   │   ├── models.py       # Pydantic v2 models
│   │   │   └── vendors.py      # Vendor profiles & fingerprint
│   │   └── services/           # Business logic (6 services)
│   ├── requirements.txt        # 11 direct Python dependencies
│   └── Dockerfile
├── frontend/                   # React 18 + TypeScript + Vite 8
│   ├── src/
│   │   ├── api/client.ts       # Axios client (same-origin URL)
│   │   ├── components/         # 5 shared components
│   │   ├── pages/              # 15 page components
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── package.json            # 7 prod deps + 4 dev deps
│   └── Dockerfile + nginx.conf
├── docs/
│   ├── developer-guide.md
│   ├── user-guide.md
│   ├── investigation-report.md (this file)
│   ├── TODO.md
│   └── ai-instructions.md
├── docker-compose.yml          # 2 services, healthcheck, network
└── .github/workflows/
    ├── ci.yml                  # 3 CI jobs
    └── docs-gate.yml           # Documentation enforcement
```

---

## Backend Analysis

### Framework & Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| FastAPI | 0.115.14 | ✅ Latest stable |
| Uvicorn | 0.24.0 | ✅ Standard ASGI server |
| Pydantic | 2.4.2 | ✅ v2 syntax throughout |
| NumPy | 1.26.2 | ✅ Used for ML calculations |
| SciPy | 1.11.4 | ✅ Statistical analysis |
| python-jose | 3.4.0 | ⚠️ JWT ready but unused; has known CVEs — upgrade needed |
| passlib[bcrypt] | 1.7.4 | ⚠️ Auth ready but unused |
| websockets | 12.0 | ✅ Real-time telemetry |
| httpx | 0.25.1 | ✅ Async HTTP client |

### Route Modules

| Module | Endpoints | Data Source | Notes |
|--------|-----------|-------------|-------|
| topology | 2 | In-memory + topology_service | ✅ Working |
| threats | 3 | In-memory + threat_service | ✅ Working |
| config_mgmt | 6 | In-memory + config_service | ✅ Working |
| devices | 6 | In-memory + device_service | ✅ Working |
| software | 4 | In-memory + software_service | ✅ Working; 404 on unknown device_id |
| alerts | 2 | In-memory | ✅ Working |
| nlp | 1 | nlp_service (intent matching) | ✅ Working; no LLM integration |
| vendors | 3 | Static vendor profiles | ✅ Working |
| links | 3 | Synthetic data | ✅ Working |
| bgp | 3 | Static mock data | ⚠️ 100% mock |
| circuits | 2 | Static mock data | ⚠️ 100% mock |
| workflows | 3 | Static mock data | ⚠️ 100% mock |
| ip_management | 3 | Static mock data | ⚠️ 100% mock |
| reports | 4 | Computed from in-memory DB | ✅ Working |
| dashboard/kpi | 1 | Computed from in-memory DB | ✅ Working |

### Core Services

- **topology_service.py** — Builds topology graph, computes device positions, runs discovery simulation
- **threat_service.py** — Generates threat statistics, applies mitigations
- **config_service.py** — Config CRUD, compliance audit using anomaly_detector, rollback
- **device_service.py** — Device health, metrics time-series, failure prediction
- **software_service.py** — Firmware inventory, upgrade scheduling with device_id validation
- **nlp_service.py** — Keyword/intent matching for ChatOps; no LLM dependency

### ML / Anomaly Detection

Three algorithms implemented in `anomaly_detector.py`:
- **Z-Score** — CPU/memory spike detection, configurable threshold (default: 2.5σ)
- **IQR** — Traffic outlier detection, resistant to extremes
- **EWMA** — Trend-based drift detection with α=0.3

Additional: `predict_failure_probability()` — combines CPU trend, memory pressure, and uptime into a risk score.

**Finding**: The anomaly detector is well-implemented but only used in `device_service.py` and `config_service.py`. It is not wired to real-time data streams.

### WebSocket

- Endpoint: `/ws`
- Broadcasts telemetry every 5 seconds with random Gaussian noise applied to CPU/memory
- Supports ping/pong echo
- No authentication on WebSocket connection

---

## Frontend Analysis

### Technology Stack

| Technology | Version | Usage |
|-----------|---------|-------|
| React | 18.2 | UI framework |
| TypeScript | 5.3 | Type safety |
| Vite | 8.0 | Build tool + dev server proxy |
| React Router | 6.20 | SPA routing (15 routes) |
| Recharts | 2.10 | Charts and graphs |
| Axios | 1.6 | HTTP client |
| Lucide React | 0.294 | Icon library |

### Pages Inventory

| Page | Route | API Calls | Charts | Issues |
|------|-------|-----------|--------|--------|
| Dashboard | `/` | `/api/dashboard/kpi`, `/api/alerts` | BarChart, donut | ✅ |
| Topology | `/topology` | `/api/topology` | SVG custom | ✅ |
| Threats | `/threats` | `/api/threats` | PieChart, LineChart | ✅ |
| Config | `/config` | `/api/config/{id}` | — | ⚠️ Hardcoded DEVICE_ID_MAP |
| Devices | `/devices` | `/api/devices`, `/api/devices/{id}/health` | LineChart | ✅ |
| Software | `/software` | `/api/software/inventory`, `/api/software/upgrade` | — | ✅ |
| Alerts | `/alerts` | `/api/alerts` | BarChart | ✅ |
| NLP | `/nlp` | `/api/nlp/query` | — | ✅ |
| LinkMonitor | `/links` | `/api/links`, `/api/links/stats` | — | ✅ |
| BGP | `/bgp` | `/api/bgp/sessions`, `/api/bgp/hijacks` | — | ✅ |
| Circuits | `/circuits` | `/api/circuits` | — | ✅ |
| Workflows | `/workflows` | `/api/workflows`, `/api/workflows/runs` | — | ✅ |
| IPManagement | `/ip-management` | `/api/ip/subnets`, `/api/ip/assignments` | — | ✅ |
| Reports | `/reports` | `/api/reports/*` | BarChart, LineChart | ✅ |
| DeviceDetail | `/devices/:id` | `/api/devices/{id}`, `/api/devices/{id}/health` | LineChart | ✅ |

### Field Mapping Adapters

Backend uses Python naming conventions, frontend uses web conventions. Adapters exist in several pages:

| Page | Backend Field | Frontend Field |
|------|---------------|----------------|
| Devices.tsx | `name` | `hostname` |
| Devices.tsx | `ip` | `ip_address` |
| Devices.tsx | `type` | `device_type` |
| Devices.tsx | `firmware_version` | `os_version` |
| Topology.tsx | `devices` | `nodes` |
| Topology.tsx | `timestamp` | `last_updated` |
| Alerts.tsx | `device_name` | `device_hostname` |
| Threats.tsx | `target_ip` | `destination_ip` |

### Component Library

- `Header.tsx` — Top bar with WebSocket live/offline indicator
- `Sidebar.tsx` — Navigation with all 14 page links + icons
- `MetricCard.tsx` — KPI card with title, value, and trend
- `StatusBadge.tsx` — Coloured severity/status badge
- `LoadingSpinner.tsx` — Suspense fallback

---

## Infrastructure & CI/CD

### Docker Compose

- 2 services: `backend` (port 8000) and `frontend` (port 3000→80)
- Backend has health check: polls `/health` every 30s
- Frontend depends on backend being healthy
- No volume mounts (in-memory data is ephemeral)
- No secrets management

### nginx Configuration

- Proxies `/api/` → `http://backend:8000`
- Proxies `/ws` → `ws://backend:8000` with WebSocket upgrade headers
- Serves React SPA with `try_files $uri /index.html`

### GitHub Actions CI (`ci.yml`)

Three jobs run on every push and PR to `main`:

| Job | Duration | What it does |
|-----|----------|--------------|
| `backend-import-healthcheck` | ~30s | Install Python deps, verify imports, start server, curl `/health` |
| `frontend-build` | ~60s | `npm ci` + `npm run build` (Vite production build) |
| `docker-compose-validate` | ~10s | `docker compose config --quiet` |

**Gap**: No unit tests, no linting in CI, no docs validation.

---

## Security Assessment

### Critical Findings

| Severity | Finding | Location | Recommendation |
|----------|---------|----------|----------------|
| 🔴 HIGH | No authentication on any endpoint | `main.py` (all routes) | Add JWT middleware; use `python-jose` + `passlib` already in deps |
| 🔴 HIGH | WebSocket has no auth | `main.py:/ws` | Add token query param check |
| 🟠 MEDIUM | CORS allows all origins (`*`) | `main.py:121` | Restrict to frontend domain in production |
| 🟠 MEDIUM | `python-jose 3.4.0` has known CVEs | `requirements.txt` | Upgrade to latest; or switch to `PyJWT` |
| 🟡 LOW | No rate limiting on NLP endpoint | `routes/nlp.py` | Add `slowapi` or nginx rate limiting |
| 🟡 LOW | No input validation on free-text fields | NLP query body | Add max-length constraints |
| 🟡 LOW | HTTP management interface flagged in config | `anomaly_detector.py` patterns | Already detected — ensure mitigation action fires |

### Positive Security Findings

- ✅ `allow_credentials=False` in CORS — safe with wildcard origins
- ✅ `python-jose` and `passlib` already in requirements — auth scaffolding ready
- ✅ Immutable audit log for config changes
- ✅ `field(ge=0, le=100)` validators on all percentage fields
- ✅ Enum-based type system prevents injection via type fields
- ✅ No hardcoded secrets in codebase

---

## Data Model Review

### Pydantic v2 Models (`core/models.py`)

| Model | Fields | Validators | Notes |
|-------|--------|------------|-------|
| `Device` | 15 | `ge/le` on usage fields | ✅ Well-defined |
| `NetworkLink` | 8 | `ge/le` on % fields | ✅ |
| `ThreatAlert` | 12 | `ge/le` on confidence | ✅ |
| `Alert` | 13 | None | ✅ |
| `ConfigChange` | 11 | None | ✅ |
| `SoftwareUpdate` | 11 | None | ✅ |
| `NLPQuery` | 2 | None | ⚠️ No max_length on query string |
| `NLPResponse` | 4 | None | ✅ |
| `DeviceHealth` | 5 | `ge/le` on health_score | ✅ |

### Enumerations

10 enums defined: `DeviceType`, `DeviceStatus`, `LinkStatus`, `ThreatSeverity`, `ThreatType`, `ThreatStatus`, `ConfigChangeType`, `ConfigChangeStatus`, `UpdateStatus`, `AlertType`.

All use `str, Enum` for JSON serialization compatibility.

---

## API Completeness

### Missing / Incomplete Endpoints

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| `DELETE /api/alerts/{id}` | Can only acknowledge, not delete | Add delete endpoint |
| `PUT /api/devices/{id}` | Cannot update device metadata | Add update endpoint |
| `GET /api/devices/search?q=` | No search/filter capability | Add query params |
| `POST /api/auth/login` | No authentication | Implement JWT auth |
| `GET /api/users` | No user management | Add user RBAC |
| `GET /api/audit-log` | Config changes logged but not queryable separately | Add audit endpoint |
| Pagination on list endpoints | All lists return all records | Add `?skip=&limit=` |
| `GET /api/bgp/sessions/{id}` | Individual session detail missing | Add detail endpoint |

### NLP Service Gaps

The NLP service uses keyword/intent matching — it is not connected to an actual LLM. It recognises approximately 15 intent patterns. Production use would require:
- Integration with OpenAI / Azure OpenAI / local LLM
- Conversation history / context tracking
- Streaming response support

---

## Code Quality

### Backend

| Aspect | Rating | Notes |
|--------|--------|-------|
| Type annotations | ✅ Excellent | `from __future__ import annotations` used throughout |
| Docstrings | ✅ Good | Key functions documented |
| Error handling | ✅ Good | HTTPException used consistently |
| Logging | ✅ Good | Structured logging with levels |
| Code organisation | ✅ Excellent | Clean router/service/model separation |
| Testing | ❌ None | Zero unit tests |
| Linting | ⚠️ No CI lint step | Code style not enforced in CI |

### Frontend

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript coverage | ✅ Good | All pages typed; adapters handle field mapping |
| Component decomposition | ⚠️ Fair | Pages are large (200–500 lines); candidate for sub-component extraction |
| Error handling | ⚠️ Fair | Try/catch in fetch calls but no error boundary |
| Loading states | ✅ Good | Loading spinners shown during data fetches |
| Accessibility | ❌ Poor | No ARIA labels, no keyboard navigation beyond defaults |
| Testing | ❌ None | No unit or E2E tests |
| Bundle size | ⚠️ Unknown | Vite build not analysed — Recharts can be large |

---

## Gaps & Risks

### High Priority

1. **No authentication** — Any user can read all data and trigger mitigations
2. **In-memory only** — All data lost on restart; no persistence layer
3. **No tests** — No safety net for refactoring or new features
4. **python-jose CVEs** — Upgrade required before enabling auth

### Medium Priority

5. **Hardcoded `DEVICE_ID_MAP`** in `Config.tsx` — breaks when devices are added
6. **No pagination** — List endpoints return all records; performance risk at scale
7. **NLP is keyword-only** — No real AI/LLM integration
8. **BGP/Circuits/Workflows are 100% mock** — Not connected to real data

### Low Priority

9. **No accessibility (a11y)** — Screen readers unsupported
10. **No bundle analysis** — Potential large JS bundle
11. **No metrics export** — No Prometheus endpoint for infrastructure monitoring
12. **CORS wildcard in production** — Should be restricted

---

## Recommendations

### Immediate (Sprint 1)

- [ ] Add JWT authentication (`POST /api/auth/login`, `Depends(get_current_user)`)
- [ ] Upgrade `python-jose` or migrate to `PyJWT`
- [ ] Add pagination (`?skip=0&limit=50`) to all list endpoints
- [ ] Write unit tests for services and anomaly detector
- [ ] Add ESLint to frontend CI step

### Short-term (Sprint 2)

- [ ] Replace in-memory store with SQLite (SQLAlchemy + Alembic)
- [ ] Fix hardcoded `DEVICE_ID_MAP` in Config.tsx — use device search API
- [ ] Add React error boundary component
- [ ] Add Prometheus metrics endpoint to backend
- [ ] Wire BGP/Circuits/Workflows to real or simulated real-time data

### Medium-term (Sprint 3)

- [ ] Integrate real LLM (OpenAI API or local Ollama) for NLP
- [ ] Add SNMP polling service for real device data
- [ ] Add WebSocket authentication
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] Add E2E tests with Playwright

### Long-term

- [ ] Kubernetes deployment manifests
- [ ] Multi-tenant support
- [ ] SSO / SAML integration
- [ ] Real-time alerting via PagerDuty/OpsGenie webhook
- [ ] Network graph analytics (community detection, shortest path)

---

*This report was auto-generated by the AI investigation agent. See [TODO.md](TODO.md) for the prioritised task list and [ai-instructions.md](ai-instructions.md) for AI contribution guidelines.*
