import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { DeviceConfig, ConfigChange } from '../types'
import { Play, RefreshCw, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

const MOCK_CONFIGS: Record<string, DeviceConfig> = {
  'core-router-01': {
    device_id: 'dev-001',
    hostname: 'core-router-01',
    config_text: `hostname core-router-01
!
ip routing
spanning-tree mode rapid-pvst
!
interface GigabitEthernet0/1
 description uplink-to-edge
 no shutdown
 ip address 10.0.0.1 255.255.255.252
!
interface Vlan10
 ip address 10.0.10.1 255.255.255.0
!
ip access-list extended DENY_TELNET
 deny tcp any any eq 23
 permit ip any any
!`,
    captured_at: new Date(Date.now() - 3600000).toISOString(),
    checksum: 'a1b2c3d4e5f6',
    compliance_status: 'compliant',
    violations: [],
  },
  'dist-switch-02': {
    device_id: 'dev-006',
    hostname: 'dist-switch-02',
    config_text: `hostname dist-switch-02
!
interface GigabitEthernet0/1
 description uplink-core-01
 no shutdown
!
line vty 0 4
 transport input telnet
 no password
!
snmp-server community public RO
!`,
    captured_at: new Date(Date.now() - 7200000).toISOString(),
    checksum: 'x9y8z7w6v5u4',
    compliance_status: 'non_compliant',
    violations: [
      { rule_id: 'NO-TELNET', severity: 'critical', description: 'Telnet enabled on VTY lines — must use SSH only', line: 9 },
      { rule_id: 'SNMP-COMM', severity: 'high', description: 'Default SNMP community "public" is insecure', line: 12 },
      { rule_id: 'VTY-AUTH', severity: 'critical', description: 'No password configured on VTY lines', line: 10 },
    ],
  },
}

const MOCK_HISTORY: ConfigChange[] = [
  { id: 'c1', device_id: 'dev-001', hostname: 'core-router-01', changed_by: 'admin', timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'Added DENY_TELNET ACL', diff: '+ip access-list extended DENY_TELNET\n+ deny tcp any any eq 23\n+ permit ip any any' },
  { id: 'c2', device_id: 'dev-006', hostname: 'dist-switch-02', changed_by: 'netops@domain.com', timestamp: new Date(Date.now() - 172800000).toISOString(), description: 'Changed spanning-tree mode', diff: '-spanning-tree mode pvst\n+spanning-tree mode rapid-pvst' },
  { id: 'c3', device_id: 'dev-002', hostname: 'core-router-02', changed_by: 'automation', timestamp: new Date(Date.now() - 259200000).toISOString(), description: 'NTP server updated', diff: '-ntp server 10.0.0.200\n+ntp server 10.0.0.201' },
  { id: 'c4', device_id: 'dev-007', hostname: 'fw-primary', changed_by: 'admin', timestamp: new Date(Date.now() - 432000000).toISOString(), description: 'New ingress ACL rule added', diff: '+ip access-list extended INBOUND\n+ permit tcp 10.0.0.0 0.0.255.255 any eq 443' },
]

const Config: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState('core-router-01')
  const [config, setConfig] = useState<DeviceConfig | null>(MOCK_CONFIGS['core-router-01'])
  const [history] = useState<ConfigChange[]>(MOCK_HISTORY)
  const [loading, setLoading] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [applying, setApplying] = useState(false)

  // Device list and id-map fetched from the backend
  const [deviceNames, setDeviceNames] = useState<string[]>(Object.keys(MOCK_CONFIGS))
  const [deviceIdMap, setDeviceIdMap] = useState<Record<string, string>>({})
  // Track whether the device map has finished loading so we don't fire premature API calls
  const [mapReady, setMapReady] = useState(false)

  // Fetch device list and build hostname → id map
  useEffect(() => {
    client
      .get<{ id: string; name: string; ip: string; type: string; status: string }[]>('/api/devices')
      .then((res) => {
        const names = res.data.map((d) => d.name)
        const map: Record<string, string> = {}
        res.data.forEach((d) => { map[d.name] = d.id })
        setDeviceNames(names.length > 0 ? names : Object.keys(MOCK_CONFIGS))
        setDeviceIdMap(map)
        if (names.length > 0) {
          // Use functional update to avoid capturing a stale selectedDevice value
          setSelectedDevice(prev => names.includes(prev) ? prev : names[0])
        }
      })
      .catch(() => {
        // Fall back to static list derived from MOCK_CONFIGS
        setDeviceNames(Object.keys(MOCK_CONFIGS))
      })
      .finally(() => setMapReady(true))
  }, [])

  // fetchConfig receives idMap as an explicit parameter so the callback stays
  // stable across renders (empty deps array). This avoids a stale-closure
  // problem where the callback captured an empty idMap on first render.
  const fetchConfig = useCallback(async (hostname: string, idMap: Record<string, string>) => {
    setLoading(true)
    try {
      // Use dynamic id map from API; fall back to hostname directly
      const deviceId = idMap[hostname] ?? hostname
      const res = await client.get<{ device_id: string; config: string }>(`/api/config/${deviceId}`)
      // Adapt backend { device_id, config } to DeviceConfig shape
      setConfig({
        device_id: res.data.device_id,
        hostname,
        config_text: res.data.config,
        captured_at: new Date().toISOString(),
        checksum: '',
        compliance_status: 'unknown',
        violations: [],
      })
    } catch {
      setConfig(MOCK_CONFIGS[hostname] ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Only trigger config fetch once the device-id map is ready to avoid 404s
  useEffect(() => {
    if (mapReady) {
      void fetchConfig(selectedDevice, deviceIdMap)
    }
  }, [selectedDevice, mapReady, fetchConfig, deviceIdMap])

  const handleAudit = async () => {
    if (!mapReady) return
    setAuditing(true)
    try {
      const deviceId = deviceIdMap[selectedDevice] ?? selectedDevice
      const res = await client.post<{ compliant: boolean; issues: string[]; recommendations: string[]; score: number }>(`/api/config/${deviceId}/audit`)
      // Update config compliance status from audit result
      if (config) {
        setConfig({
          ...config,
          compliance_status: res.data.compliant ? 'compliant' : 'non_compliant',
          violations: res.data.issues.map((issue, i) => ({
            rule_id: `RULE-${i + 1}`,
            severity: (res.data.score < 50 ? 'critical' : res.data.score < 75 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low' | 'info',
            description: issue,
          })),
        })
      }
    } catch {
      // no-op: audit may not be available for all devices
    } finally {
      setAuditing(false)
    }
  }

  const handleApply = async () => {
    if (!mapReady) return
    setApplying(true)
    try {
      if (config?.config_text) {
        const deviceId = deviceIdMap[selectedDevice] ?? selectedDevice
        await client.post(`/api/config/${deviceId}/apply`, {
          change_type: 'interface_change',
          new_config: config.config_text,
          author: 'admin',
          comment: 'Applied via netAI dashboard',
        })
      }
    } catch {
      // no-op: backend may not accept partial configs
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Configuration Management" subtitle="Device config audit & compliance" />
      <div className="page-content">
        <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Config Selector + Viewer */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Device Configuration</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => void handleAudit()} disabled={auditing || !mapReady} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={13} className={auditing ? 'spinning' : ''} />
                  {auditing ? 'Auditing…' : 'Audit'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => void handleApply()} disabled={applying || !mapReady} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Play size={13} />
                  {applying ? 'Applying…' : 'Apply'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Device</label>
              <select
                className="form-select"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
              {deviceNames.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><LoadingSpinner /></div>
            ) : config && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Captured: {format(new Date(config.captured_at), 'MMM d, HH:mm')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={13} style={{ color: 'var(--text-muted)' }} />
                    <code style={{ color: 'var(--text-muted)', fontSize: 11 }}>{config.checksum}</code>
                  </div>
                </div>
                <pre style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 16, fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 320, border: '1px solid var(--border-color)', lineHeight: 1.6 }}>
                  {config.config_text}
                </pre>
              </>
            )}
          </div>

          {/* Compliance Status */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="card-title">Compliance Status</p>

            {/* All devices compliance summary */}
            {deviceNames.map((hostname) => {
              const cfg = MOCK_CONFIGS[hostname]
              const status = cfg?.compliance_status ?? 'unknown'
              const violations = cfg?.violations?.length ?? 0
              return (
                <div
                  key={hostname}
                  onClick={() => setSelectedDevice(hostname)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: hostname === selectedDevice ? 'var(--accent-blue-dim)' : 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: `1px solid ${hostname === selectedDevice ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {status === 'compliant' ? (
                      <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                    ) : status === 'non_compliant' ? (
                      <XCircle size={16} style={{ color: 'var(--accent-red)' }} />
                    ) : (
                      <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <code style={{ fontSize: 12, color: 'var(--text-primary)' }}>{hostname}</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {violations > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--accent-red)', background: 'var(--accent-red-dim)', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>
                        {violations} violations
                      </span>
                    )}
                    <StatusBadge status={status} />
                  </div>
                </div>
              )
            })}

            {/* Violations detail */}
            {config && config.violations.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Policy Violations</p>
                {config.violations.map((v) => (
                  <div key={v.rule_id} style={{ background: 'var(--accent-red-dim)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <code style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600 }}>{v.rule_id}</code>
                      <StatusBadge status={v.severity} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.description}</p>
                    {v.line && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Line {v.line}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Config Change History */}
        <div className="card">
          <p className="card-title">Configuration Change History</p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Changed By</th>
                  <th>Description</th>
                  <th>Diff Preview</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((change) => (
                  <tr key={change.id}>
                    <td><code style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{change.hostname}</code></td>
                    <td style={{ color: 'var(--text-primary)' }}>{change.changed_by}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{change.description}</td>
                    <td>
                      <pre style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 4, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                        {change.diff.slice(0, 80)}{change.diff.length > 80 ? '…' : ''}
                      </pre>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{format(new Date(change.timestamp), 'MMM d, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Config
