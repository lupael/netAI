# netAI User Guide

> Step-by-step guide for network administrators using the netAI platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Network Topology](#network-topology)
4. [Threat Detection](#threat-detection)
5. [Configuration Management](#configuration-management)
6. [Device Health](#device-health)
7. [Software Lifecycle](#software-lifecycle)
8. [Alerts Center](#alerts-center)
9. [AI Assistant (ChatOps)](#ai-assistant-chatops)
10. [Supported Vendors](#supported-vendors)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Starting the Platform

**Option 1 — Docker Compose (recommended)**

```bash
git clone https://github.com/lupael/netAI.git
cd netAI
docker compose up --build
```

Wait ~30 seconds for both services to start, then open:
- **Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

**Option 2 — Local development**

```bash
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm install
npm run dev
```

### Navigation

The left sidebar provides access to all modules:

| Icon | Page | Purpose |
|------|------|---------|
| 📊 | **Dashboard** | Overall network health at a glance |
| 🗺️ | **Topology** | Interactive network map |
| 🛡️ | **Threats** | Active threat intelligence |
| ⚙️ | **Configuration** | Config audit and management |
| 💻 | **Device Health** | Per-device performance monitoring |
| 📦 | **Software** | Firmware inventory and upgrades |
| 🔔 | **Alerts** | Unified alert center |
| 🤖 | **AI Assistant** | Natural language network operations |

The **connectivity indicator** in the top-right header shows whether the real-time WebSocket feed is active (🟢 Live) or offline (⚫ Offline).

---

## Dashboard

The Dashboard provides a single-pane-of-glass view of your entire network.

### KPI Cards

| Card | What it shows |
|------|---------------|
| **Total Devices** | Count of all managed devices (active/total) |
| **Active Threats** | Number of unresolved threat alerts |
| **Config Issues** | Policy violations detected |
| **Pending Updates** | Firmware upgrades waiting to be applied |

### Network Health Score

A circular gauge showing overall network health (0–100):
- **80–100** 🟢 Healthy
- **60–79** 🟡 Warning — attention required
- **0–59** 🔴 Critical — immediate action needed

The score is computed from: online device ratio, active threat count, and config violation count.

### Recent Alerts

The 5 most recent unresolved alerts are shown. Click a device name to navigate to that device's detail view. Use the **Alerts Center** for full alert management.

### Device Health by Layer

A bar chart showing healthy/warning/critical device counts across network layers (Core, Distribution, Access, Edge, WAN).

---

## Network Topology

The Topology page shows a live visual map of your network infrastructure.

### Reading the Map

- **Nodes** — Each circle represents a device. The icon inside indicates device type.
- **Status dot** — The small coloured circle on each node indicates device status:
  - 🟢 **Green** — Healthy / Online
  - 🟡 **Yellow** — Warning (high utilisation)
  - 🟠 **Orange** — Degraded (performance issues)
  - 🔴 **Red** — Down / Offline
- **Links** — Lines between nodes represent network connections. Colour indicates link health; percentages show utilisation.
- **Dashed lines** — indicate a link that is down.

### Interacting with the Map

- **Click a node** — Opens the device detail panel on the right showing hostname, IP, status, and connection list.
- **Click again / press X** — Closes the detail panel.
- **Refresh button** — Triggers a topology re-discovery.

### Legend

The legend in the bottom-left corner explains the status colour scheme.

---

## Threat Detection

The Threats page provides real-time security intelligence.

### Summary Counters

Four counters show:
- **Active** — Threats that are currently ongoing
- **Investigating** — Threats under analysis
- **Mitigated** — Threats that have been contained
- **Total** — All threats ever detected

### Threat Type Breakdown (Pie Chart)

Shows the distribution of threat types: Port Scan, Brute Force, DDoS, Data Exfiltration, Lateral Movement, Malware C2.

### Traffic Anomaly Timeline

A line chart comparing normal vs. anomalous traffic volumes over the last 100 minutes. Spikes in the red line indicate active anomaly detection events.

### Threat Intelligence Table

| Column | Description |
|--------|-------------|
| Severity | Critical / High / Medium / Low |
| Type | Attack classification |
| Description | Human-readable description |
| Source IP | Origin of the attack |
| Confidence | ML model confidence (0–100%) |
| Status | Current status |
| MITRE | ATT&CK technique ID (if applicable) |
| Action | **Mitigate** button for active threats |

### Mitigating a Threat

Click the **Mitigate** button on any active threat. The platform will:
1. Send a mitigation command to the backend
2. Update the threat status to **Mitigated**
3. Log the action in the audit trail

---

## Configuration Management

### Viewing Device Configurations

1. Select a device from the **Select Device** dropdown.
2. The running configuration is displayed in the code viewer.
3. The **Captured** timestamp and checksum are shown above the config.

### Compliance Status Panel

The right panel shows compliance status for all devices:
- ✅ **Green checkmark** — Compliant with all policies
- ❌ **Red X** — Policy violations detected
- 🕐 **Clock** — Status unknown (never audited)

Devices with violations show a count badge (e.g., "3 violations").

### Policy Violations

When a non-compliant device is selected, violations are listed below the compliance panel:

| Field | Description |
|-------|-------------|
| Rule ID | Policy rule identifier (e.g., `NO-TELNET`) |
| Severity | Critical / High / Medium / Low |
| Description | What is wrong and why it matters |
| Line | Config line number where the issue was found |

### Running a Compliance Audit

Click **Audit** to run an immediate compliance check against the selected device. Results are returned within seconds.

### Applying a Configuration Change

Click **Apply** to push a configuration change to the selected device. All changes are:
- Logged in the **Configuration Change History**
- Attributed to the currently logged-in user
- Reversible via the Rollback feature

### Configuration Change History

The bottom table shows all past configuration changes with:
- Device name
- Who made the change
- Human-readable description
- Diff preview (first 80 characters)
- Timestamp

---

## Device Health

### Device List

The left panel lists all managed devices with:
- Device name (click to select)
- Status badge (Healthy / Warning / Degraded / Down)
- CPU utilisation bar
- Memory utilisation bar
- Disk utilisation bar

**Colour coding:**
- **Green** — < 70%
- **Yellow** — 70–89%
- **Red** — ≥ 90%

### Device Detail Panel

Click any device to see:
- Full device info (vendor, model, OS version, location)
- Uptime
- Performance time-series chart (last 24h CPU and memory)
- Failure prediction badge

### Failure Prediction

The AI analyses performance trends and predicts device failure probability:
- **< 30%** 🟢 Low risk
- **30–60%** 🟡 Moderate risk — monitor closely
- **> 60%** 🔴 High risk — consider proactive replacement or reload

### Performance Chart

The line chart shows CPU and memory utilisation over the past 24 hours with 15-minute granularity. Use this to identify recurring performance spikes.

---

## Software Lifecycle

### Software Inventory

The inventory table shows all managed devices with:

| Column | Description |
|--------|-------------|
| Device | Hostname |
| Vendor | Device manufacturer |
| Platform | OS family |
| Current Version | Installed firmware/software version |
| Available | Newer version available (if any) |
| Status | Current / Update Available / Critical Update / End of Life |
| CVEs | Number of known vulnerabilities in current version |

### Status Badges

| Status | Meaning | Action Required |
|--------|---------|----------------|
| 🟢 Current | Up to date | None |
| 🟡 Update Available | Newer version exists | Plan upgrade |
| 🔴 Critical Update | Security vulnerabilities | Upgrade immediately |
| ⚫ End of Life | No vendor support | Replace or upgrade |

### Scheduling an Upgrade

1. Enter the **device name** in the Schedule field.
2. Enter the **target version** (e.g., `IOS-XE 17.12.1`).
3. Optionally set a **maintenance window** date/time.
4. Click **Schedule Upgrade**.

The upgrade job is queued and will appear in the **Upgrade Jobs** section.

### Upgrade Jobs

The job tracker shows:
- Job ID and device
- Target version
- Scheduled time
- Status: Pending → In Progress → Completed / Failed
- Progress bar (for in-progress jobs)

### Rollback

If an upgrade fails, the platform automatically retains the previous firmware version as the rollback target. Click **Rollback** to revert to the previous version.

---

## Alerts Center

### Alert Log

The full alert list shows all system alerts with severity, type, title, message, device, timestamp, and status.

### Filtering Alerts

Use the severity filter pills to show only alerts of a specific severity level:
**All** | **Critical** | **High** | **Medium** | **Low** | **Info**

### Alert Statuses

| Status | Badge | Meaning |
|--------|-------|---------|
| New | 🔴 NEW | Unacknowledged, unresolved |
| Ack | ⚫ ACK | Acknowledged by an operator |
| Resolved | 🟢 RES | Issue resolved |

### Acknowledging an Alert

Click the **Ack** button on any unacknowledged alert. This:
1. Marks the alert as acknowledged
2. Records who acknowledged it and when
3. Removes the alert from the unread count in the header

### Alert Statistics

The **Alert Summary** card shows total, unacknowledged, active, and resolved counts. The bar chart shows distribution by severity.

---

## AI Assistant (ChatOps)

The AI Assistant provides a natural language interface to your network operations.

### Starting a Conversation

Type your query in the input box and press **Enter** or click the send button.

### Example Queries

| Query | What it does |
|-------|-------------|
| `Show me all critical threats right now` | Lists active critical threats |
| `Which devices have high CPU usage?` | Identifies devices with CPU > 80% |
| `List devices with pending software updates` | Shows update inventory |
| `Are there any configuration violations?` | Runs compliance summary |
| `What is the health score of the network?` | Returns overall health metrics |
| `Show me the traffic anomalies in the last hour` | Pulls anomaly detection results |
| `Which devices are down?` | Lists offline devices |
| `Summarize all unacknowledged alerts` | Alert summary |

### Suggested Queries

The right sidebar shows 8 clickable suggested queries. Click any suggestion to send it immediately.

### Understanding Responses

The assistant returns structured responses with:
- **Bold text** — key findings
- **Tables** — device lists, metrics
- **Bullet points** — recommended actions
- **Action buttons** — direct links to perform suggested actions

### Capabilities

| Category | Examples |
|----------|---------|
| Network queries | Device status, uptime, topology |
| Threat analysis | Active threats, MITRE techniques |
| Config auditing | Policy violations, drift detection |
| Software lifecycle | CVEs, pending updates, EOL |
| Performance insights | CPU spikes, traffic anomalies |
| Predictive analytics | Failure predictions |

---

## Supported Vendors

netAI natively supports the following network device vendors:

| Vendor | OS Family | Device Types | Protocols |
|--------|-----------|-------------|-----------|
| **Cisco** | IOS / IOS-XE / IOS-XR | Routers, switches, firewalls | SNMP, SSH, NETCONF, RESTCONF |
| **MikroTik** | RouterOS | Routers, switches (CCR, CRS, RB) | API, SSH, SNMP, Winbox |
| **Juniper** | JunOS | Routers, switches (MX, EX, QFX, SRX) | NETCONF, RESTCONF, SSH, SNMP |
| **Nokia** | SR OS | Service routers (7750 SR, 7210) | NETCONF, gRPC, SNMP, SSH |
| **Ubuntu / Linux** | Linux | Servers, virtual appliances | SNMP, SSH, Prometheus, REST |
| **BDcom** | BDcom OS | Switches, OLTs (S3900, GP series) | SNMP, SSH, CLI |
| **VSOL** | VSOL OS | OLTs, ONUs (V1600, V2800) | SNMP, SSH, CLI, TR-069 |
| **DBC** | DBC OS (Huawei VRP) | Switches, routers | NETCONF, SNMP, SSH |

### Vendor-Specific Notes

**MikroTik / RouterOS**
- Use the RouterOS API (`/rest` endpoint on port 8728/8729) for fastest integration
- SNMP community string must match the configured value in RouterOS `/snmp`
- `show_config` maps to `/export` which exports the complete config in RouterOS syntax

**Juniper / JunOS**
- NETCONF over SSH (port 830) is the preferred management protocol
- `show_config` maps to `show configuration` which returns XML by default
- JunOS operational commands use `show` prefix

**Nokia / SR OS**
- NETCONF and gRPC (gNMI) are the preferred protocols for Nokia SR OS
- `admin display-config` returns the full chassis configuration

**Ubuntu / Linux servers**
- Deploy Prometheus Node Exporter (port 9100) for rich metrics
- `net-snmp` package must be installed for SNMP polling
- SSH key authentication is recommended over password

---

## Troubleshooting

### Dashboard shows "Offline" status

The WebSocket connection to the backend is not established. Check:
1. Backend is running: `curl http://localhost:8000/health`
2. nginx is proxying `/ws` correctly (see `frontend/nginx.conf`)
3. No firewall blocking port 8000 or 3000

### All pages show mock data

The frontend cannot reach the backend API. Check:
1. Backend is running on port 8000
2. Vite dev server proxy is configured (see `vite.config.ts`)
3. In Docker, nginx proxy is routing `/api/` to `http://backend:8000`

### Docker Compose fails to start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Rebuild images
docker compose down && docker compose up --build
```

### Backend server won't start

```bash
cd backend
pip install -r requirements.txt
python -c "from app.main import app; print('OK')"
```

### Software upgrade returns 404

Ensure the `device_id` in the upgrade request matches a device in the datastore. Use `GET /api/devices` to list valid device IDs.

### Config page shows only mock data

The Config page maps device hostnames to backend device IDs using an internal map. If you added new devices, update `DEVICE_ID_MAP` in `frontend/src/pages/Config.tsx`.

### WebSocket shows "Live" but data doesn't update

The telemetry broadcaster updates every 5 seconds. If metrics appear frozen, check:
1. The WebSocket ping/pong is working (open browser DevTools → Network → WS)
2. The backend telemetry task is running (check server logs)

---

*For developer documentation, see [docs/developer-guide.md](developer-guide.md).*
