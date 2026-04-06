# netAI — AI Network Management System

> Enterprise-grade AI system for monitoring, analyzing, and managing complex network infrastructures.

[![CI](https://github.com/lupael/netAI/actions/workflows/ci.yml/badge.svg)](https://github.com/lupael/netAI/actions/workflows/ci.yml)

---

## Overview

**netAI** is a full-stack AI-driven network management platform that acts as a senior network administrator. It continuously monitors your network infrastructure, detects threats and misconfigurations, predicts device failures, and provides a natural language interface for administrative tasks.

It supports **8 network device vendors** out of the box — from Cisco and Juniper to MikroTik, Nokia, Ubuntu/Linux, BDcom, VSOL, and DBC — with a plugin architecture for adding new vendors.

---

## Screenshots

### Dashboard
![netAI Dashboard](https://github.com/user-attachments/assets/a7a80983-dfa0-4b7d-8f13-cf30dbeb2e56)

---

## Architecture

```
netAI/
├── backend/          # Python / FastAPI REST API + WebSocket
│   └── app/
│       ├── api/routes/   # Endpoints (topology, threats, config, devices, software, alerts, nlp, vendors)
│       ├── core/         # Pydantic models, in-memory datastore, ML anomaly detector, vendor adapters
│       └── services/     # Business logic services
├── frontend/         # React 18 / TypeScript / Vite dashboard
│   └── src/
│       ├── pages/        # Dashboard, Topology, Threats, Config, Devices, Software, Alerts, NLP
│       ├── components/   # Sidebar, Header, MetricCard, StatusBadge, LoadingSpinner
│       ├── api/          # Axios client
│       └── types/        # TypeScript interfaces
├── docs/
│   ├── developer-guide.md   # Developer documentation
│   └── user-guide.md        # End-user documentation
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Core Modules

| Module | Description | Endpoints |
|--------|-------------|-----------|
| **Network Topology** | Discover devices, map connections, visualize traffic flows | `GET /api/topology`, `POST /api/topology/discover` |
| **Threat Detection** | Detect DDoS, anomalies, intrusions with ML | `GET /api/threats`, `POST /api/threats/{id}/mitigate` |
| **Config Management** | Audit configs, detect misconfigurations, rollback | `GET /api/config/{device_id}`, `POST /api/config/{device_id}/audit` |
| **Device Health** | CPU, memory, disk monitoring + failure prediction | `GET /api/devices/{id}/health`, `GET /api/devices/predictions` |
| **Software Lifecycle** | Firmware inventory, upgrade scheduling | `GET /api/software/inventory`, `POST /api/software/upgrade` |
| **Alerts Center** | Unified alert management with severity levels | `GET /api/alerts`, `POST /api/alerts/{id}/acknowledge` |
| **AI Assistant** | Natural language interface for admin commands | `POST /api/nlp/query` |
| **Vendor Management** | Multi-vendor profiles & capability registry | `GET /api/vendors`, `GET /api/vendors/{key}/capabilities` |
| **Dashboard KPI** | Aggregated health summary for dashboard | `GET /api/dashboard/kpi` |
| **WebSocket** | Real-time telemetry streaming | `ws://host/ws` |

---

## Quick Start

### Docker Compose (recommended)

```bash
docker compose up --build
```

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Local Development

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## Features

### 🗺️ Network Topology & Discovery
- Visualizes device interconnections with an SVG-based network map
- Color-coded health status (green/yellow/red)
- Clickable device detail panel
- Supports on-demand topology discovery

### 🛡️ Threat Detection & Security
- Real-time detection of DDoS attacks, port scans, and unauthorized access attempts
- ML-based anomaly detection using z-score, IQR, and EWMA
- One-click mitigation with audit trail
- Traffic anomaly timeline visualization

### ⚙️ Configuration Management
- GitOps-style config history with full audit trail
- Compliance checking against enterprise policies
- Apply and rollback configuration changes
- Per-device config viewer

### 💻 Device Health & Performance
- Real-time CPU, memory, disk, and interface utilization
- Time-series performance charts
- Predictive failure analysis using trend data
- Proactive health alerts

### 🔄 Software Lifecycle Management
- Firmware inventory across all devices
- CVE vulnerability tracking
- Staged upgrade scheduling with rollback support
- Compatibility validation

### 🤖 AI Assistant (ChatOps / NLP)
- Natural language command interface
- Example queries: *"show device health"*, *"check router configs"*, *"list active threats"*
- Returns structured data and suggested remediation actions

---

## Supported Vendors

netAI supports **8 network device vendors** out of the box:

| Vendor | OS Family | Device Examples | Protocols |
|--------|-----------|----------------|-----------|
| **Cisco** | IOS / IOS-XE / IOS-XR | ASR, ISR, Catalyst, Nexus | SNMP, SSH, NETCONF, RESTCONF |
| **MikroTik** | RouterOS | CCR2004, CRS, RB series | RouterOS API, SSH, SNMP, Winbox |
| **Juniper** | JunOS | MX, EX, QFX, SRX | NETCONF, RESTCONF, SSH, SNMP |
| **Nokia** | SR OS | 7750 SR-1, 7210 SAS | NETCONF, gRPC/gNMI, SNMP, SSH |
| **Ubuntu / Linux** | Linux | Servers, VMs, virtual appliances | SNMP, SSH, Prometheus, REST |
| **BDcom** | BDcom OS | S3900, GP series, OLTs | SNMP, SSH, CLI, Telnet |
| **VSOL** | VSOL OS | V1600, V2800, OLTs/ONUs | SNMP, SSH, CLI, TR-069 |
| **DBC** | DBC OS (Huawei VRP) | Switches, routers | NETCONF, SNMP, SSH, CLI |

### Vendor Discovery Flow

```
1. Scan subnet for SNMP / SSH / HTTP endpoints
2. Query SNMP sysDescr (OID 1.3.6.1.2.1.1.1.0)
3. Identify vendor via keyword fingerprinting
4. Load VendorProfile (CLI commands, protocols)
5. Pull config & health using vendor-specific commands
6. Normalise into unified Device schema
7. Store in datastore + add to topology graph
8. Begin monitoring and threat detection
```

See `GET /api/vendors` for the full list and `GET /api/vendors/{vendor_key}/capabilities` for per-vendor capability matrix.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11, FastAPI, Uvicorn |
| ML / Anomaly Detection | NumPy, SciPy (z-score, IQR, EWMA) |
| Frontend | React 18, TypeScript, Vite |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Real-time | WebSocket |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## API Reference

Full interactive API documentation is available at **http://localhost:8000/docs** (Swagger UI) and **http://localhost:8000/redoc** (ReDoc) when the backend is running.

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Backend**: Installs Python dependencies, validates imports, starts the server, and checks the health endpoint
2. **Frontend**: Installs Node.js dependencies and runs a production build
3. **Docker**: Validates the `docker-compose.yml` configuration

---

## Security

- CORS configured with `allow_credentials=False` (wildcard origins safe without credentials)
- RBAC-ready API structure
- Immutable audit log for all configuration changes
- TLS-ready (configure in nginx.conf for production)
- No hardcoded secrets — environment variable driven

---

## Documentation

| Document | Description |
|----------|-------------|
| [Developer Guide](docs/developer-guide.md) | Architecture, API reference, extending the system, adding vendors |
| [User Guide](docs/user-guide.md) | Feature walkthrough, vendor-specific notes, troubleshooting |
| [API Docs](http://localhost:8000/docs) | Interactive Swagger UI (when backend is running) |

---

## License

MIT
