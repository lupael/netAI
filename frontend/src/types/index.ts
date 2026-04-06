// ===== Device & Network Types =====

export type DeviceStatus = 'healthy' | 'warning' | 'degraded' | 'down' | 'unknown'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertType = 'threat' | 'config' | 'device' | 'traffic' | 'software' | 'system'

export interface Device {
  id: string
  hostname: string
  ip_address: string
  device_type: string
  vendor: string
  model: string
  os_version: string
  location: string
  status: DeviceStatus
  last_seen: string
  interfaces: Interface[]
  metrics?: DeviceMetrics
}

export interface Interface {
  name: string
  ip_address: string
  status: 'up' | 'down'
  speed_mbps: number
  utilization_pct: number
}

export interface DeviceMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  temperature?: number
  uptime_seconds: number
  packet_loss_pct: number
  latency_ms: number
  timestamp: string
}

// ===== Topology Types =====

export interface TopologyNode {
  id: string
  hostname: string
  ip_address: string
  device_type: string
  status: DeviceStatus
  x?: number
  y?: number
  layer?: number
}

export interface TopologyLink {
  source: string
  target: string
  bandwidth_mbps: number
  utilization_pct: number
  status: 'active' | 'degraded' | 'down'
}

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

export interface Threat {
  id: string
  type: string
  severity: SeverityLevel
  source_ip: string
  destination_ip: string
  description: string
  detected_at: string
  status: 'active' | 'mitigated' | 'investigating' | 'false_positive'
  affected_devices: string[]
  confidence: number
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

export interface Alert {
  id: string
  type: AlertType
  severity: SeverityLevel
  title: string
  message: string
  device_id?: string
  /** Backend field (`device_name`); populated from database */
  device_name?: string
  /** Frontend display field — set to `device_name` value after fetch normalisation */
  device_hostname?: string
  timestamp: string
  acknowledged: boolean
  resolved: boolean
  source?: string
}

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

export interface DashboardKPI {
  total_devices: number
  active_devices: number
  active_threats: number
  config_issues: number
  pending_updates: number
  critical_alerts: number
  network_health_score: number
}
