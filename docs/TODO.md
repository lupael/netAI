# netAI — TODO List

> Last updated: 2026-04-06 | Generated from investigation report

Priority levels: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## 🔴 Critical

- [x] **AUTH-001** — Add JWT authentication (`POST /api/auth/login` returning signed token)
  - Files: `backend/app/main.py`, new `backend/app/api/routes/auth.py`, new `backend/app/core/auth.py`
  - Dependencies: `python-jose`, `passlib` already in `requirements.txt`
  - Accept: All protected routes return 401 without valid Bearer token

- [x] **AUTH-002** — Add `Depends(get_current_user)` to all write endpoints (POST, PUT, DELETE)
  - Files: all `backend/app/api/routes/*.py`
  - Note: GET endpoints may remain public for initial read-only dashboard use

- [x] **AUTH-003** — Upgrade `python-jose` from `3.4.0` to latest (or migrate to `PyJWT>=2.8`)
  - Files: `backend/requirements.txt`
  - Reason: Known CVEs in python-jose 3.4.0 (GHSA-* — check GitHub Advisory DB)

- [x] **AUTH-004** — Add authentication to WebSocket endpoint `/ws`
  - Files: `backend/app/main.py`
  - Pattern: `?token=<jwt>` query param validated on connect

- [x] **DB-001** — Replace in-memory datastore with persistent SQLite (dev) / PostgreSQL (prod)
  - Files: `backend/app/core/database.py` → SQLAlchemy + Alembic migrations
  - Impact: All data currently lost on every restart

---

## 🟠 High

- [x] **TEST-001** — Add unit tests for all backend services
  - Directory: `backend/tests/`
  - Files: `test_device_service.py`, `test_threat_service.py`, `test_config_service.py`, `test_nlp_service.py`, `test_anomaly_detector.py`
  - Tools: `pytest`, `pytest-asyncio`, `httpx.AsyncClient`

- [x] **TEST-002** — Add FastAPI integration tests using `TestClient`
  - File: `backend/tests/test_routes.py`
  - Goal: ≥ 80% endpoint coverage

- [ ] **TEST-003** — Add frontend unit tests
  - Tools: `vitest` + `@testing-library/react`
  - Priority pages: Dashboard, Devices, Threats, Alerts

- [x] **API-001** — Add pagination to all list endpoints
  - Pattern: `?skip=0&limit=50` query params on GET endpoints returning arrays
  - Files: `devices.py`, `alerts.py`, `threats.py`, `links.py`, `bgp.py`, `circuits.py`, `workflows.py`

- [x] **FRONTEND-001** — Remove hardcoded `DEVICE_ID_MAP` from `Config.tsx`
  - Current: `Config.tsx` has a static map of hostname → device_id
  - Fix: Fetch device list from `GET /api/devices` and build map dynamically

- [x] **CORS-001** — Restrict CORS `allow_origins` from `["*"]` to frontend domain in production
  - File: `backend/app/main.py:121`
  - Pattern: Read from environment variable `ALLOWED_ORIGINS`

- [x] **CI-001** — Add ESLint step to frontend CI job
  - File: `.github/workflows/ci.yml`
  - Command: `npm run lint`

- [x] **CI-002** — Add `pytest` step to backend CI job
  - File: `.github/workflows/ci.yml`
  - Prerequisite: TEST-001 must be done first

---

## 🟡 Medium

- [ ] **NLP-001** — Integrate a real LLM for natural language processing
  - Options: OpenAI API, Azure OpenAI, local Ollama (llama3)
  - File: `backend/app/services/nlp_service.py`
  - Current: Keyword/intent matching only (~15 intents)

- [ ] **NLP-002** — Add conversation history / context to NLP service
  - Allow multi-turn conversations with session tracking

- [ ] **NLP-003** — Add streaming response support for NLP endpoint
  - Use FastAPI `StreamingResponse` with SSE or WebSocket

- [x] **FRONTEND-002** — Add React error boundary component
  - Wrap page routes in an `<ErrorBoundary>` that shows a friendly fallback UI
  - File: `frontend/src/components/ErrorBoundary.tsx`

- [ ] **FRONTEND-003** — Decompose large page components into sub-components
  - Pages > 300 lines: `Dashboard.tsx`, `Devices.tsx`, `Threats.tsx`, `DeviceDetail.tsx`
  - Extract chart sections, table sections into separate files under `components/`

- [x] **FRONTEND-004** — Add route-level `404` page
  - Currently: `*` route redirects to Dashboard, which masks bad URLs

- [x] **API-002** — Add `DELETE /api/alerts/{id}` endpoint
  - File: `backend/app/api/routes/alerts.py`

- [x] **API-003** — Add `PUT /api/devices/{id}` endpoint for device metadata updates
  - File: `backend/app/api/routes/devices.py`

- [x] **API-004** — Add `GET /api/devices?search=&type=&status=` filtering
  - File: `backend/app/api/routes/devices.py`

- [x] **API-005** — Add `GET /api/audit-log` endpoint for config change history
  - File: `backend/app/api/routes/audit.py`

- [x] **MONITORING-001** — Add Prometheus metrics endpoint to backend
  - Package: `prometheus-fastapi-instrumentator`
  - Expose at `/metrics`

- [ ] **BGP-001** — Wire BGP sessions to real or simulated real-time data source
  - Currently: 100% static mock data in `bgp.py`

- [ ] **CIRCUIT-001** — Wire circuit status to real or simulated real-time data
  - Currently: 100% static mock data in `circuits.py`

- [ ] **WORKFLOW-001** — Implement actual workflow execution engine
  - Currently: Workflows return mock "running" status
  - Could use `asyncio.create_task()` with progress broadcasting via WebSocket

---

## 🟢 Low

- [ ] **A11Y-001** — Add ARIA labels to all interactive elements in frontend
  - Files: all `frontend/src/pages/*.tsx` and `components/*.tsx`
  - Tools: `axe-core` or `@axe-core/react` for automated checks

- [ ] **A11Y-002** — Add keyboard navigation support to Topology SVG map
  - File: `frontend/src/pages/Topology.tsx`

- [ ] **BUNDLE-001** — Add Vite bundle analyser to measure frontend bundle size
  - Package: `rollup-plugin-visualizer`
  - Goal: Identify heavy dependencies (Recharts is ~300 KB gzip)

- [x] **DOCS-001** — Add inline JSDoc / TSDoc comments to all TypeScript interfaces
  - File: `frontend/src/types/index.ts`

- [x] **DOCS-002** — Add OpenAPI tags, descriptions, and response schemas to all routes
  - All `backend/app/api/routes/*.py`
  - Goal: Make `/docs` Swagger UI more useful

- [x] **DOCS-003** — Add architecture decision records (ADRs) under `docs/adr/`
  - Template: `docs/adr/0001-in-memory-datastore.md`, `0002-nlp-keyword-matching.md`

- [ ] **INFRA-001** — Add Kubernetes deployment manifests
  - Directory: `k8s/`
  - Files: `backend-deployment.yaml`, `frontend-deployment.yaml`, `ingress.yaml`

- [ ] **INFRA-002** — Add TLS configuration example to `nginx.conf`
  - Show Let's Encrypt / Certbot integration

- [x] **INFRA-003** — Add `VITE_API_BASE_URL` environment variable support
  - Implemented as `VITE_API_URL` in `frontend/src/api/client.ts`

- [x] **SECURITY-001** — Add rate limiting to NLP and auth endpoints
  - Implementation: custom in-memory `PathRateLimitMiddleware` in `backend/app/main.py`
  - Limit: 30 req/min per IP on `/api/nlp/query`, 10 req/min per IP on `/api/auth/login`

- [x] **SECURITY-002** — Add request size limit to prevent DoS via large payloads
  - FastAPI `Request` body size limit middleware

- [ ] **SECURITY-003** — Add Content Security Policy headers in nginx
  - File: `frontend/nginx.conf`

---

## Completed ✅

- [x] 15-page React frontend with all pages wired to backend
- [x] 57-endpoint FastAPI backend across 14 modules
- [x] WebSocket real-time telemetry broadcast
- [x] ML anomaly detector (z-score, IQR, EWMA)
- [x] Multi-vendor adapter system (8 vendors)
- [x] Docker Compose with health checks
- [x] GitHub Actions CI (backend + frontend + docker validate)
- [x] Developer guide and user guide in `docs/`
- [x] Field mapping adapters (backend ↔ frontend naming)
- [x] Pydantic v2 data validation throughout backend
- [x] **AUTH-001** — JWT authentication (`POST /api/auth/login`, `GET /api/auth/me`)
- [x] **AUTH-002** — `Depends(get_current_user)` on all write endpoints
- [x] **AUTH-003** — Migrated from `python-jose` to `PyJWT==2.12.0`
- [x] **AUTH-004** — WebSocket `?token=<jwt>` query param validation
- [x] **CORS-001** — `ALLOWED_ORIGINS` environment variable support
- [x] **API-001** — Pagination (`skip` / `limit`) on all list endpoints
- [x] **API-002** — `DELETE /api/alerts/{id}`
- [x] **API-003** — `PUT /api/devices/{id}` with `DeviceUpdate` model
- [x] **API-004** — Device filtering by `search`, `type`, `status`
- [x] **API-005** — `GET /api/audit-log` (paginated config change log)
- [x] **MONITORING-001** — Prometheus metrics via `prometheus-fastapi-instrumentator`
- [x] **SECURITY-001** — Rate limiting via `slowapi` (30 req/min NLP, 10 req/min auth)
- [x] **SECURITY-002** — Request body size limit middleware (1 MB)
- [x] **TEST-001** — Unit tests: `test_device_service.py`, `test_nlp_service.py`
- [x] **TEST-002** — FastAPI integration tests: `test_routes.py`
- [x] **CI-001** — `npm run lint` step in frontend CI job
- [x] **CI-002** — `pytest tests/` step in backend CI job
- [x] **FRONTEND-001** — Removed hardcoded `DEVICE_ID_MAP`; fetches from `GET /api/devices`
- [x] **FRONTEND-002** — `ErrorBoundary` component wrapping all routes
- [x] **FRONTEND-004** — `NotFound` 404 page; `*` route no longer redirects to Dashboard
- [x] **DOCS-001** — TSDoc comments on all TypeScript interfaces in `frontend/src/types/index.ts`
- [x] **DOCS-002** — OpenAPI `summary=` and `responses=` on route decorators
- [x] **DOCS-003** — ADRs: `docs/adr/0001-in-memory-datastore.md`, `docs/adr/0002-nlp-keyword-matching.md`
- [x] **DB-001** — SQLAlchemy + Alembic scaffolding (`database_sql.py`, `alembic/`, `alembic.ini`)
- [x] **INFRA-003** — `VITE_API_URL` env var support (already implemented via `frontend/src/api/client.ts`)

---

*See [investigation-report.md](investigation-report.md) for full analysis. See [ai-instructions.md](ai-instructions.md) for AI contribution guidelines.*
