# netAI — AI Network Management System

> Enterprise-grade AI system for monitoring, analyzing, and managing complex network infrastructures.

[![CI](https://github.com/lupael/netAI/actions/workflows/ci.yml/badge.svg)](https://github.com/lupael/netAI/actions/workflows/ci.yml)

---

## Overview

**netAI** is a full-stack AI-driven network management platform that acts as a senior network administrator. It continuously monitors your network infrastructure, detects threats and misconfigurations, predicts device failures, and provides a natural language interface for administrative tasks.

---

## Architecture

```
netAI/
├── backend/          # Python / FastAPI REST API + WebSocket
│   └── app/
│       ├── api/routes/   # Endpoint modules (topology, threats, config, devices, software, alerts, nlp)
│       ├── core/         # Pydantic models, in-memory datastore, ML anomaly detector
│       └── services/     # Business logic services
├── frontend/         # React 18 / TypeScript / Vite dashboard
│   └── src/
│       ├── pages/        # Dashboard, Topology, Threats, Config, Devices, Software, Alerts, NLP
│       ├── components/   # Sidebar, Header, MetricCard, StatusBadge, LoadingSpinner
│       ├── api/          # Axios client
│       └── types/        # TypeScript interfaces
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

- CORS configured for trusted origins
- RBAC-ready API structure
- Immutable audit log for all configuration changes
- TLS-ready (configure in nginx.conf for production)
- No hardcoded secrets — environment variable driven

---

## License

MIT
