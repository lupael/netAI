// ===== Device & Network Types =====

/** Operational status of a network device. */
export type DeviceStatus = 'healthy' | 'warning' | 'degraded' | 'down' | 'unknown'
/** Severity classification shared across alerts, threats, and violations. */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'
/**
 * AlertType values match the backend AlertType enum.
 * Legacy frontend-only values (threat, config, device, traffic, software, system) are also
 * kept for mock data compatibility.
 */
export type AlertType =
  | 'cpu_high' | 'memory_high' | 'disk_high' | 'link_down' | 'device_offline'
  | 'threat_detected' | 'config_drift' | 'latency_high' | 'packet_loss' | 'firmware_outdated'
  // legacy frontend categories (mock data compatibility)
  | 'threat' | 'config' | 'device' | 'traffic' | 'software' | 'system'

export interface Device {
  /** Unique device identifier (e.g. `dev-001`). */
  id: string
  /** Human-readable hostname. */
  hostname: string
  /** Primary management IP address. */
  ip_address: string
  /** Hardware category (router, switch, firewall, etc.). */
  device_type: string
  /** Hardware manufacturer. */
  vendor: string
  /** Hardware model string. */
  model: string
  /** Operating system version string. */
  os_version: string
  /** Physical or logical location. */
  location: string
  /** Current operational status. */
  status: DeviceStatus
  /** ISO 8601 timestamp of the last heartbeat. */
  last_seen: string
  /** List of network interfaces on this device. */
  interfaces: Interface[]
  /** Optional real-time performance metrics. */
  metrics?: DeviceMetrics
}

/** A single network interface on a device. */
export interface Interface {
  /** Interface name (e.g. `GigabitEthernet0/1`). */
  name: string
  /** Configured IP address. */
  ip_address: string
  /** Administrative/operational status. */
  status: 'up' | 'down'
  /** Rated speed in Mbps. */
  speed_mbps: number
  /** Current utilisation as a percentage (0–100). */
  utilization_pct: number
}

/** Real-time performance snapshot for a device. */
export interface DeviceMetrics {
  /** CPU utilisation percentage. */
  cpu_usage: number
  /** Memory utilisation percentage. */
  memory_usage: number
  /** Disk utilisation percentage. */
  disk_usage: number
  /** CPU temperature in °C (if available). */
  temperature?: number
  /** Uptime in seconds since last reboot. */
  uptime_seconds: number
  /** Packet loss percentage on the management interface. */
  packet_loss_pct: number
  /** Round-trip latency in milliseconds to the gateway. */
  latency_ms: number
  /** ISO 8601 timestamp when this snapshot was taken. */
  timestamp: string
}

// ===== Topology Types =====

/** A node in the network topology graph. */
export interface TopologyNode {
  /** Unique node identifier. */
  id: string
  /** Hostname of the device. */
  hostname: string
  /** Primary IP address. */
  ip_address: string
  /** Device category. */
  device_type: string
  /** Current operational status. */
  status: DeviceStatus
  /** SVG x-coordinate (optional; computed by layout engine). */
  x?: number
  /** SVG y-coordinate (optional; computed by layout engine). */
  y?: number
  /** Topology layer (0 = core, 1 = distribution, 2 = access). */
  layer?: number
}

/** A directional link between two topology nodes. */
export interface TopologyLink {
  /** Source node ID. */
  source: string
  /** Target node ID. */
  target: string
  /** Rated bandwidth in Mbps. */
  bandwidth_mbps: number
  /** Current utilisation as a percentage (0–100). */
  utilization_pct: number
  /** Link operational status. */
  status: 'active' | 'degraded' | 'down'
}

/** Full topology snapshot returned by `GET /api/topology`. */
export interface Topology {
  /** Backend returns `devices`; normalised to `nodes` for the SVG map. */
  devices?: TopologyNode[]
  /** Frontend field — always populated after fetch normalisation. */
  nodes?: TopologyNode[]
  links: TopologyLink[]
  /** Backend field name */
  timestamp?: string
  last_updated?: string
}

// ===== Threat Types =====

/** A detected security threat event. */
export interface Threat {
  /** Unique threat identifier. */
  id: string
  /** Threat category (ddos, port_scan, malware, etc.). */
  type: string
  /** Threat severity. */
  severity: SeverityLevel
  /** Source IP address of the attack. */
  source_ip: string
  /** Target IP address. */
  destination_ip: string
  /** Human-readable description of the threat. */
  description: string
  /** ISO 8601 timestamp when the threat was first detected. */
  detected_at: string
  /** Current resolution status. */
  status: 'active' | 'mitigated' | 'investigating' | 'false_positive'
  /** IDs of devices affected by this threat. */
  affected_devices: string[]
  /** ML model confidence score (0–1). */
  confidence: number
  /** MITRE ATT&CK technique ID (optional). */
  mitre_technique?: string
}

export interface ThreatSummary {
  total: number
  by_severity: Record<SeverityLevel, number>
  by_type: Record<string, number>
  active: number
  mitigated: number
}

// ===== Alert Types =====

/** An operational or security alert raised by the monitoring system. */
export interface Alert {
  /** Unique alert identifier. */
  id: string
  /** Alert category. */
  type: AlertType
  /** Alert severity. */
  severity: SeverityLevel
  /** Short title suitable for list views. */
  title: string
  /** Full alert message with context. */
  message: string
  /** ID of the associated device (if applicable). */
  device_id?: string
  /** Backend field (`device_name`); populated from database */
  device_name?: string
  /** Frontend display field — set to `device_name` value after fetch normalisation */
  device_hostname?: string
  /** ISO 8601 timestamp when the alert was generated. */
  timestamp: string
  /** Whether a NOC operator has acknowledged this alert. */
  acknowledged: boolean
  /** Whether the underlying issue has been resolved. */
  resolved: boolean
  /** Event source identifier (sensor, agent, etc.). */
  source?: string
}

/** Aggregate counts for the alert statistics panel. */
export interface AlertStats {
  total: number
  unacknowledged: number
  by_severity: Record<SeverityLevel, number>
  by_type: Record<AlertType, number>
}

// ===== Config Types =====

export interface DeviceConfig {
  device_id: string
  hostname: string
  config_text: string
  captured_at: string
  checksum: string
  compliance_status: 'compliant' | 'non_compliant' | 'unknown'
  violations: ConfigViolation[]
}

export interface ConfigViolation {
  rule_id: string
  severity: SeverityLevel
  description: string
  line?: number
}

export interface ConfigChange {
  id: string
  device_id: string
  hostname: string
  changed_by: string
  timestamp: string
  description: string
  diff: string
}

// ===== Software Types =====

export interface SoftwareInfo {
  device_id: string
  hostname: string
  current_version: string
  available_version: string | null
  vendor: string
  platform: string
  update_status: 'current' | 'update_available' | 'critical_update' | 'end_of_life'
  last_checked: string
  cve_count?: number
}

export interface UpgradeJob {
  id: string
  device_id: string
  hostname: string
  target_version: string
  scheduled_at: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress_pct: number
  started_at?: string
  completed_at?: string
  error_message?: string
}

// ===== NLP / ChatOps Types =====

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  data?: Record<string, unknown>
  actions?: ChatAction[]
}

export interface ChatAction {
  label: string
  type: 'command' | 'navigate' | 'confirm'
  value: string
}

export interface NLPResponse {
  response: string
  intent?: string
  entities?: Record<string, string>
  data?: Record<string, unknown>
  actions?: ChatAction[]
  confidence?: number
}

// ===== Dashboard KPI Types =====

/** Top-level KPI summary returned by `GET /api/dashboard/kpi`. */
export interface DashboardKPI {
  /** Total number of managed devices. */
  total_devices: number
  /** Devices in online or degraded status. */
  active_devices: number
  /** Threats currently in active or investigating status. */
  active_threats: number
  /** Devices with configuration compliance failures. */
  config_issues: number
  /** Pending or scheduled software updates. */
  pending_updates: number
  /** Unacknowledged critical-severity alerts. */
  critical_alerts: number
  /** Composite network health score (0–100). */
  network_health_score: number
}
