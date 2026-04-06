# netAI Developer Guide

> Technical reference for developers extending or integrating with the netAI platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Development](#backend-development)
3. [Frontend Development](#frontend-development)
4. [Multi-Vendor Adapter System](#multi-vendor-adapter-system)
5. [Device Capability Registry](#device-capability-registry)
6. [API Reference](#api-reference)
7. [WebSocket Protocol](#websocket-protocol)
8. [ML / Anomaly Detection](#ml--anomaly-detection)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Testing](#testing)
11. [Extending the System](#extending-the-system)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Browser (Port 3000)                │
│         React 18 + TypeScript + Vite SPA            │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/WS via nginx proxy
┌────────────────────▼────────────────────────────────┐
│            nginx (Port 80 / 3000)                   │
│   /api/*  →  backend:8000                           │
│   /ws     →  backend:8000 (WebSocket upgrade)       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          FastAPI Backend (Port 8000)                │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   Routers    │  │   Services   │  │  Core    │  │
│  │ topology     │  │ topology_svc │  │ models   │  │
│  │ threats      │  │ threat_svc   │  │ database │  │
│  │ config       │  │ config_svc   │  │ ml/      │  │
│  │ devices      │  │ device_svc   │  │ vendors  │  │
│  │ software     │  │ software_svc │  │ registry │  │
│  │ alerts       │  │ nlp_svc      │  │          │  │
│  │ nlp          │  └──────────────┘  └──────────┘  │
│  │ vendors      │                                   │
│  └──────────────┘                                   │
│                                                     │
│  WebSocket /ws  ─── 5s telemetry broadcast          │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend API | Python / FastAPI | 3.11 / 0.115+ |
| Data Validation | Pydantic | v2 |
| ASGI Server | Uvicorn | 0.24+ |
| ML / Statistics | NumPy + SciPy | 1.26+ / 1.11+ |
| Frontend Framework | React | 18.2 |
| Frontend Build | Vite | 5.x |
| Language (frontend) | TypeScript | 5.x |
| Charts | Recharts | 2.10+ |
| HTTP Client | Axios | 1.6+ |
| Container Runtime | Docker + Compose | latest |
| Reverse Proxy | nginx | alpine |
| CI | GitHub Actions | - |

---

## Backend Development

### Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, WebSocket, health endpoints
│   ├── api/
│   │   └── routes/
│   │       ├── alerts.py        # GET /api/alerts, POST /{id}/acknowledge
│   │       ├── config_mgmt.py   # GET/POST /api/config/{device_id}
│   │       ├── devices.py       # GET /api/devices, /devices/{id}/health
│   │       ├── nlp.py           # POST /api/nlp/query
│   │       ├── software.py      # GET /api/software/inventory, POST /upgrade
│   │       ├── threats.py       # GET /api/threats, POST /{id}/mitigate
│   │       ├── topology.py      # GET /api/topology, POST /discover
│   │       └── vendors.py       # GET /api/vendors, /{key}/capabilities
│   ├── core/
│   │   ├── database.py          # In-memory datastore with 15 seed devices
│   │   ├── device_registry.py   # Per-vendor capability registry
│   │   ├── ml/
│   │   │   └── anomaly_detector.py   # z-score, IQR, EWMA anomaly detection
│   │   ├── models.py            # Pydantic v2 models
│   │   └── vendors.py           # Vendor profiles & identification
│   └── services/
│       ├── config_service.py
│       ├── device_service.py
│       ├── nlp_service.py
│       ├── software_service.py
│       ├── threat_service.py
│       └── topology_service.py
├── requirements.txt
└── Dockerfile
```

### Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Access interactive docs at http://localhost:8000/docs

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENV` | `development` | Set to `production` to tighten security |

### Adding a New Route

1. Create `backend/app/api/routes/my_module.py`:

```python
from fastapi import APIRouter
router = APIRouter(prefix="/api/my_module", tags=["my_module"])

@router.get("")
async def list_items():
    return []
```

2. Import and mount in `app/main.py`:

```python
from app.api.routes import my_module
app.include_router(my_module.router)
```

### Adding a New Pydantic Model

Add to `backend/app/core/models.py`. Use Pydantic v2 syntax:

```python
class MyModel(BaseModel):
    id: str
    name: str
    value: Optional[float] = None
```

---

## Frontend Development

### Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts        # Axios client (base URL from env or localhost)
│   ├── components/
│   │   ├── Header.tsx        # Top bar with WS connectivity indicator
│   │   ├── LoadingSpinner.tsx
│   │   ├── MetricCard.tsx    # KPI card component
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   └── StatusBadge.tsx   # Coloured severity/status badge
│   ├── pages/
│   │   ├── Alerts.tsx
│   │   ├── Config.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Devices.tsx
│   │   ├── NLP.tsx
│   │   ├── Software.tsx
│   │   ├── Threats.tsx
│   │   └── Topology.tsx
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces (mirrors Pydantic models)
│   ├── App.tsx               # Router setup (lazy-loaded pages)
│   ├── index.css             # Dark theme CSS variables
│   └── main.tsx
├── Dockerfile
├── nginx.conf                # Proxies /api/ and /ws to backend
├── package.json
└── vite.config.ts            # Dev server proxy config
```

### Running Locally

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

The Vite dev server proxies `/api/*` → `http://localhost:8000` and `/ws` → `ws://localhost:8000`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_WS_HOST` | `window.location.host` | Override WebSocket host (e.g. `api.myapp.com`) |

### Adding a New Page

1. Create `frontend/src/pages/MyPage.tsx`
2. Add a lazy import and route in `App.tsx`:

```tsx
const MyPage = lazy(() => import('./pages/MyPage'))
// inside <Routes>:
<Route path="/my-page" element={<MyPage />} />
```

3. Add a navigation link in `Sidebar.tsx`.

### API / Type Contract

Frontend types in `src/types/index.ts` mirror backend Pydantic models. When the backend model changes, update the corresponding TypeScript interface.

Key field mappings:

| Backend (Python) | Frontend (TypeScript) | Notes |
|------------------|-----------------------|-------|
| `Device.name` | `Device.hostname` | Mapped in Devices.tsx fetch adapter |
| `Device.ip` | `Device.ip_address` | Mapped in Devices.tsx fetch adapter |
| `Device.type` | `Device.device_type` | Mapped in Devices.tsx fetch adapter |
| `Device.firmware_version` | `Device.os_version` | Mapped in Devices.tsx fetch adapter |
| `Alert.device_name` | `Alert.device_hostname` | Mapped in Alerts.tsx fetch adapter |
| `ThreatAlert.target_ip` | `Threat.destination_ip` | Mapped in Threats.tsx fetch adapter |
| `ThreatAlert.timestamp` | `Threat.detected_at` | Mapped in Threats.tsx fetch adapter |
| `NLPResponse.response` | `NLPResponse.response` | Both match after fix |
| `Topology.devices` | `Topology.nodes` | Normalised in Topology.tsx fetch |
| `Topology.timestamp` | `Topology.last_updated` | Normalised in Topology.tsx fetch |

---

## Multi-Vendor Adapter System

### Overview

The vendor layer (`backend/app/core/vendors.py`) provides:
- A `VendorProfile` dataclass describing each vendor's OS family, SNMP OID prefix, CLI commands, and supported protocols.
- A `VENDOR_PROFILES` dictionary keyed by vendor slug (e.g., `"cisco"`, `"mikrotik"`).
- `identify_vendor(sys_descr: str) -> str` — matches SNMP sysDescr strings against keyword lists.
- `get_vendor_profile(vendor_key: str) -> VendorProfile` — look up by slug.

### Supported Vendors

| Slug | Vendor | OS Family | Protocols |
|------|--------|-----------|-----------|
| `cisco` | Cisco | IOS / IOS-XE / IOS-XR | SNMP, SSH, NETCONF, RESTCONF, CLI |
| `mikrotik` | MikroTik | RouterOS | API, SSH, SNMP, Winbox |
| `juniper` | Juniper | JunOS | NETCONF, RESTCONF, SSH, SNMP, CLI |
| `nokia` | Nokia | SR OS | NETCONF, gRPC, SNMP, SSH, CLI |
| `linux` | Ubuntu/Linux | Linux | SNMP, SSH, Prometheus, REST |
| `bdcom` | BDcom | BDcom OS | SNMP, SSH, CLI, Telnet |
| `vsol` | VSOL | VSOL OS | SNMP, SSH, CLI, TR-069 |
| `dbc` | DBC | DBC OS (Huawei VRP) | NETCONF, SNMP, SSH, CLI |

### Adding a New Vendor

1. Add an entry to `VENDOR_PROFILES` in `vendors.py`:

```python
VENDOR_PROFILES["aruba"] = VendorProfile(
    name="Aruba",
    os_family="ArubaOS",
    snmp_oid_prefix="1.3.6.1.4.1.14823",
    identify_keywords=["aruba", "arubaos", "mobility master"],
    cli_command_map={
        "show_interfaces": "show interface",
        "show_version": "show version",
        "show_config": "show running-config",
        "show_routes": "show ip route",
        "show_health": "show process",
    },
    supported_protocols=["SNMP", "SSH", "REST", "CLI"],
)
```

2. Add capabilities to `CAPABILITY_REGISTRY` in `device_registry.py`.

3. Seed a test device in `database.py`.

### Vendor Discovery Flow

```
1. Scan subnet for SNMP, SSH, or HTTP endpoints
2. Query SNMP sysDescr (OID 1.3.6.1.2.1.1.1.0)
3. Call identify_vendor(sysDescr) → vendor slug
4. Load VendorProfile = get_vendor_profile(slug)
5. Use CLI command map to pull config & health
6. Normalise into unified Device schema
7. Store in in-memory datastore
8. Add device + links to topology graph
```

---

## Device Capability Registry

`backend/app/core/device_registry.py` stores a per-vendor capability matrix covering:

| Category | Description |
|----------|-------------|
| `topology_discovery` | LLDP/CDP neighbor discovery |
| `health_monitoring` | CPU, memory, interface stats |
| `config_backup` | Export running config |
| `config_push` | Push config changes |
| `firmware_upgrade` | Remote firmware upgrade |
| `snmp_polling` | SNMP v2c/v3 polling |
| `log_streaming` | Syslog / streaming telemetry |
| `flow_export` | NetFlow / IPFIX flow export |

Query capabilities via API:

```bash
# List all capabilities for MikroTik
GET /api/vendors/mikrotik/capabilities

# Check if a vendor supports config push
GET /api/vendors/juniper/capabilities
```

---

## API Reference

Full interactive docs: **http://localhost:8000/docs** (Swagger UI)

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with counts |
| GET | `/api/dashboard/kpi` | Dashboard KPI summary |
| GET | `/api/topology` | Full topology (devices + links) |
| POST | `/api/topology/discover` | Trigger discovery scan |
| GET | `/api/devices` | All devices |
| GET | `/api/devices/{id}/health` | Device health metrics |
| GET | `/api/devices/predictions` | Failure predictions |
| GET | `/api/threats` | All threat alerts |
| GET | `/api/threats/active` | Active threats only |
| POST | `/api/threats/{id}/mitigate` | Mitigate a threat |
| GET | `/api/config/{device_id}` | Device running config |
| POST | `/api/config/{device_id}/audit` | Compliance audit |
| POST | `/api/config/{device_id}/apply` | Apply config change |
| POST | `/api/config/{device_id}/rollback` | Rollback config |
| GET | `/api/config/history` | Config change history |
| GET | `/api/software/inventory` | Software inventory |
| GET | `/api/software/updates` | Pending updates |
| POST | `/api/software/upgrade` | Schedule upgrade |
| POST | `/api/software/{id}/execute` | Execute update |
| GET | `/api/alerts` | All alerts |
| POST | `/api/alerts/{id}/acknowledge` | Acknowledge alert |
| POST | `/api/nlp/query` | NLP ChatOps query |
| GET | `/api/vendors` | All vendor profiles |
| GET | `/api/vendors/{key}` | Vendor profile detail |
| GET | `/api/vendors/{key}/capabilities` | Vendor capabilities |
| GET | `/api/devices/{id}/vendor` | Device vendor info |
| WS | `/ws` | Real-time telemetry stream |

---

## WebSocket Protocol

Connect to `ws://<host>/ws`. The backend broadcasts a telemetry snapshot every 5 seconds:

```json
{
  "event": "telemetry",
  "timestamp": "2026-04-06T00:00:00Z",
  "active_threats": 4,
  "devices": [
    { "id": "dev-001", "name": "core-router-01", "cpu": 72.4, "memory": 61.8, "status": "online" }
  ]
}
```

Send a ping:
```json
{"type": "ping"}
```

Receive a pong:
```json
{"event": "pong", "echo": "ping", "timestamp": "..."}
```

---

## ML / Anomaly Detection

Located in `backend/app/core/ml/anomaly_detector.py`.

Three detection algorithms:

| Algorithm | Use Case | Sensitivity |
|-----------|----------|-------------|
| Z-Score | CPU/memory spikes | Configurable threshold (default: 3σ) |
| IQR (Interquartile Range) | Traffic outliers | Resistant to extremes |
| EWMA (Exponential Weighted Moving Average) | Trend-based drift | Good for gradual changes |

### Usage

```python
from app.core.ml.anomaly_detector import AnomalyDetector

detector = AnomalyDetector()
result = detector.detect_cpu_anomaly([72.4, 71.2, 73.1, 94.7])  # Returns AnomalyResult
print(result.is_anomaly, result.score)
```

---

## CI/CD Pipeline

File: `.github/workflows/ci.yml`

### Jobs

| Job | Trigger | Steps |
|-----|---------|-------|
| `backend-lint-test` | push/PR | Install Python deps → verify import → start server → health check |
| `frontend-lint-build` | push/PR | Install Node deps → TypeScript compile → Vite production build |
| `docker-compose-validate` | push/PR | Validate `docker-compose.yml` config |

All jobs run with `permissions: contents: read` (minimal GitHub token scope).

### Deployment with Docker Compose

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## Testing

Currently the project uses integration-style tests (server start + curl). To add unit tests:

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/
```

Example test:

```python
# tests/test_alerts.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_alerts():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert all("id" in a for a in data)
```

---

## Extending the System

### Add a Data Source (e.g., real SNMP polling)

1. Add a polling service in `backend/app/services/polling_service.py`
2. Schedule it in the `lifespan` context manager in `main.py` using `asyncio.create_task()`
3. Update `database.py` devices with polled values

### Add Redis for Persistent State

Replace `database.py` in-memory lists with Redis sorted sets / hashes. Use `aioredis` for async access.

### Add Authentication

1. Install `python-jose[cryptography]` and `passlib[bcrypt]`
2. Add `POST /api/auth/login` → returns JWT
3. Add `Depends(get_current_user)` to protected routes
4. Configure CORS to allow specific origins (update `allow_origins` in `main.py`)

### Scale with Kubernetes

Each service in `docker-compose.yml` maps to a Kubernetes Deployment. Expose the backend via an Ingress with WebSocket support (`nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"`).
