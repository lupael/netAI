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
│       ├── api/routes/   # 14 route modules (topology, threats, config, devices, software,
│       │                 #   alerts, nlp, vendors, links, bgp, circuits, workflows,
│       │                 #   ip_management, reports)
│       ├── core/         # Pydantic models, in-memory datastore, ML anomaly detector,
│       │                 #   vendor profiles, device capability registry
│       └── services/     # Business logic services
├── frontend/         # React 18 / TypeScript / Vite dashboard
│   └── src/
│       ├── pages/        # 15 pages (see table below)
│       ├── components/   # Sidebar, Header, MetricCard, StatusBadge, LoadingSpinner
│       ├── api/          # Axios client (same-origin base URL for nginx proxy)
│       └── types/        # TypeScript interfaces
├── docs/
│   ├── developer-guide.md   # Developer documentation
│   └── user-guide.md        # End-user documentation
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | KPI summary cards, network health donut, recent alerts, device health chart |
| **Topology** | `/topology` | SVG network map — color-coded nodes, click-to-inspect panel; auto-layout by device type |
| **Threats** | `/threats` | Active threat list, severity PieChart, anomaly timeline, mitigate action |
| **Configuration** | `/config` | Per-device config viewer, compliance violations, change history, audit & apply |
| **Device Health** | `/devices` | CPU/mem/disk bars, time-series charts, failure prediction badges, link to per-device dashboard |
| **Software** | `/software` | Firmware inventory, CVE tracking, upgrade scheduling (wired to backend) |
| **Alerts** | `/alerts` | Unified alert center with severity filters and acknowledgment |
| **AI Assistant** | `/nlp` | ChatOps interface — natural language queries, suggested actions |
| **Link Monitor** | `/links` | Per-link utilization bars, latency, packet loss, status badges |
| **BGP Monitor** | `/bgp` | BGP session management, route hijack detection, resolve action |
| **Circuit Status** | `/circuits` | WAN/NTTN/ISP circuit monitoring with SLA compliance coloring |
| **Workflows** | `/workflows` | Automation templates with run buttons and execution history |
| **IP Management** | `/ip-management` | Subnet utilization table, IP/VLAN assignments, switch port tracking |
| **Reports** | `/reports` | Historical stats with Recharts bar/line charts and incident report |
| **Device Detail** | `/devices/:id` | Per-device dashboard — real-time CPU/RAM/bandwidth, interface table, action buttons (Ping, SSH, Reboot, Config Backup, Audit, Upgrade) |

---

## Backend API Modules (57 endpoints)

| Module | Description | Key Endpoints |
|--------|-------------|---------------|
| **Topology** | Device discovery, network map | `GET /api/topology`, `POST /api/topology/discover` |
| **Threats** | ML-based threat detection | `GET /api/threats`, `POST /api/threats/{id}/mitigate` |
| **Config** | Audit, apply, rollback | `GET /api/config/{id}`, `POST /api/config/{id}/audit`, `/apply` |
| **Devices** | Health, metrics, predictions | `GET /api/devices`, `GET /api/devices/{id}/health`, `/predictions` |
| **Software** | Firmware inventory, upgrades | `GET /api/software/inventory`, `POST /api/software/upgrade` |
| **Alerts** | Alert management | `GET /api/alerts`, `POST /api/alerts/{id}/acknowledge` |
| **NLP** | ChatOps interface | `POST /api/nlp/query` |
| **Vendors** | Vendor profiles & capabilities | `GET /api/vendors`, `GET /api/vendors/{key}/capabilities` |
| **Dashboard** | Aggregated KPIs | `GET /api/dashboard/kpi` |
| **Links** | Link health & utilization | `GET /api/links`, `GET /api/links/stats` |
| **BGP** | BGP sessions & hijack detection | `GET /api/bgp/sessions`, `GET /api/bgp/hijacks`, `POST /api/bgp/hijacks/{id}/resolve` |
| **Circuits** | WAN/NTTN/ISP circuits | `GET /api/circuits`, `GET /api/circuits/{id}` |
| **Workflows** | Automation templates | `GET /api/workflows`, `POST /api/workflows/{id}/run`, `GET /api/workflows/runs` |
| **IP Management** | Subnets, assignments, ports | `GET /api/ip/subnets`, `/assignments`, `/ports` |
| **Reports** | Historical analytics | `GET /api/reports/summary`, `/uptime`, `/bandwidth`, `/incidents` |
| **WebSocket** | Real-time telemetry | `ws://host/ws` |

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
- Hierarchical auto-layout computed from device types (router → firewall → core → distribution → access → server)
- Color-coded health status (green/yellow/red)
- Clickable device detail panel
- Supports on-demand topology discovery

### 🔗 Link & Circuit Monitoring
- Per-link utilization bars, latency, and packet loss in **Link Monitor**
- WAN/NTTN/ISP circuit status with SLA compliance coloring in **Circuit Status**
- Real-time bandwidth charts per device in **Device Detail**

### 🛡️ Threat Detection & Security
- Real-time detection of DDoS attacks, port scans, and unauthorized access attempts
- ML-based anomaly detection using z-score, IQR, and EWMA
- One-click mitigation with audit trail
- BGP route hijack detection with automatic alerting

### ⚙️ Configuration Management
- GitOps-style config history with full audit trail
- Compliance checking against enterprise policies
- Apply and rollback configuration changes (wired to `POST /api/config/{id}/apply`)
- Per-device config viewer with DEVICE_ID_MAP

### 💻 Device Health & Performance
- Real-time CPU, memory, disk, and interface utilization
- Time-series performance charts
- Predictive failure analysis using trend data
- **Per-Device Dashboard** at `/devices/:id` with action buttons (Ping, SSH, Reboot, Backup, Audit, Upgrade)

### 🔄 Software Lifecycle Management
- Firmware inventory across all devices
- CVE vulnerability tracking
- Upgrade scheduling form wired to `POST /api/software/upgrade`
- Compatibility validation

### 🤖 AI Assistant (ChatOps / NLP)
- Natural language command interface
- Example queries: *"show device health"*, *"check router configs"*, *"list active threats"*
- Returns structured data and suggested remediation actions (navigate actions with `label` + `value`)

### 📊 Reports & Analytics
- Historical bandwidth utilization charts (24h)
- Per-device uptime statistics (30 days)
- Incident rollup report combining threats and alerts

### 🔧 Workflow Automation
- Built-in templates: backup configs, firmware audit, threat scan, compliance check, topology discovery
- Run history with status tracking

### 🌐 IP & Switch Port Management
- Subnet utilization table with free/assigned counts
- IP assignment tracking with VLAN and device info
- Switch port inventory

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
3. Identify vendor via keyword fingerprinting (falls back to "unknown")
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
| HTTP Client | Axios (same-origin base URL) |
| Real-time | WebSocket (auto-reconnect, unmount-safe) |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | nginx (proxies `/api` and `/ws`) |
| CI/CD | GitHub Actions |

---

## API Reference

Full interactive API documentation is available at **http://localhost:8000/docs** (Swagger UI) and **http://localhost:8000/redoc** (ReDoc) when the backend is running.

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. **Backend — Import & Health Check**: Installs Python dependencies, validates imports, starts the server, and checks the health endpoint
2. **Frontend — Build**: Installs Node.js dependencies and runs a production build
3. **Docker — Validate**: Validates the `docker-compose.yml` configuration

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
