import React, { useCallback, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { Alert, SeverityLevel } from '../types'
import { CheckCircle, RefreshCw, Filter } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'threat', severity: 'critical', title: 'Port Scan Detected', message: 'SYN scan from 10.0.0.99 targeting core switch — 4,200 ports/sec', device_hostname: 'core-sw-01', timestamp: new Date(Date.now() - 120000).toISOString(), acknowledged: false, resolved: false },
  { id: 'a2', type: 'threat', severity: 'critical', title: 'DDoS Attack', message: 'Volumetric DDoS — 14 Gbps inbound on WAN link', device_hostname: 'wan-router-01', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: false, resolved: false },
  { id: 'a3', type: 'device', severity: 'high', title: 'CPU Spike — 94%', message: 'CPU usage sustained at 94% for over 5 minutes', device_hostname: 'access-sw-03', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: false, resolved: false },
  { id: 'a4', type: 'threat', severity: 'high', title: 'SSH Brute Force', message: '320 failed SSH login attempts in 10 minutes', device_hostname: 'edge-router-01', timestamp: new Date(Date.now() - 900000).toISOString(), acknowledged: true, resolved: false },
  { id: 'a5', type: 'config', severity: 'medium', title: 'Config Drift', message: 'Unauthorized change to ACL on dist-sw-02 — telnet re-enabled', device_hostname: 'dist-sw-02', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: true, resolved: false },
  { id: 'a6', type: 'software', severity: 'medium', title: 'Critical CVE', message: 'CVE-2024-1234 affects IOS 15.0(2)SE — CVSS 9.1', device_hostname: 'access-sw-03', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false, resolved: false },
  { id: 'a7', type: 'traffic', severity: 'medium', title: 'Bandwidth Threshold', message: 'WAN link at 82% utilization for 15+ minutes', device_hostname: 'wan-router-01', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true, resolved: false },
  { id: 'a8', type: 'device', severity: 'low', title: 'Interface Flap', message: 'GigabitEthernet0/3 flapping (3 transitions in 5 min)', device_hostname: 'dist-sw-01', timestamp: new Date(Date.now() - 10800000).toISOString(), acknowledged: true, resolved: false },
  { id: 'a9', type: 'system', severity: 'low', title: 'NTP Sync Lost', message: 'Unable to reach primary NTP server 10.0.0.201', device_hostname: 'core-sw-02', timestamp: new Date(Date.now() - 14400000).toISOString(), acknowledged: false, resolved: false },
  { id: 'a10', type: 'config', severity: 'info', title: 'Config Backup', message: 'Scheduled config backup completed for all devices', timestamp: new Date(Date.now() - 21600000).toISOString(), acknowledged: true, resolved: true },
]

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#9ca3af',
}

type FilterLevel = SeverityLevel | 'all'
const FILTER_OPTIONS: FilterLevel[] = ['all', 'critical', 'high', 'medium', 'low', 'info']

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [ackingId, setAckingId] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<Alert[]>('/api/alerts')
      if (res.data.length) {
        // Map backend device_name → device_hostname for display
        const mapped = res.data.map((a) => ({
          ...a,
          device_hostname: a.device_name ?? a.device_hostname,
        }))
        setAlerts(mapped)
      }
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchAlerts() }, [fetchAlerts])

  const handleAck = async (id: string) => {
    setAckingId(id)
    try {
      await client.post(`/api/alerts/${id}/acknowledge`)
    } catch {
      // optimistic update
    } finally {
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a))
      setAckingId(null)
    }
  }

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)

  const statsData = (['critical', 'high', 'medium', 'low', 'info'] as SeverityLevel[]).map((sev) => ({
    name: sev,
    count: alerts.filter((a) => a.severity === sev).length,
    color: SEVERITY_COLORS[sev],
  }))

  const unacked = alerts.filter((a) => !a.acknowledged && !a.resolved).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Alerts Center" subtitle="All network alerts and notifications" alertCount={unacked} />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={40} /></div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
              {/* Numbers */}
              <div className="card">
                <p className="card-title">Alert Summary</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Total', val: alerts.length, color: 'var(--text-primary)' },
                    { label: 'Unacknowledged', val: unacked, color: 'var(--accent-red)' },
                    { label: 'Active', val: alerts.filter((a) => !a.resolved).length, color: 'var(--accent-yellow)' },
                    { label: 'Resolved', val: alerts.filter((a) => a.resolved).length, color: 'var(--accent-green)' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: 700, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div className="card">
                <p className="card-title">By Severity</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={statsData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statsData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alert List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p className="card-title" style={{ marginBottom: 0 }}>Alert Log</p>
                  <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFilter(opt)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          background: filter === opt
                            ? (opt === 'all' ? 'var(--accent-blue)' : SEVERITY_COLORS[opt as SeverityLevel])
                            : 'var(--bg-secondary)',
                          color: filter === opt ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s',
                          textTransform: 'capitalize',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => void fetchAlerts()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Device</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((alert) => (
                      <tr key={alert.id} style={{ opacity: alert.resolved ? 0.55 : 1 }}>
                        <td><StatusBadge status={alert.severity} /></td>
                        <td>
                          <span style={{ fontSize: 11, background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: 4, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {alert.type}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</td>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{alert.message}</td>
                        <td>
                          {alert.device_hostname
                            ? <code style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{alert.device_hostname}</code>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                          <span title={format(new Date(alert.timestamp), 'MMM d, HH:mm:ss')}>
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            status={alert.resolved ? 'completed' : alert.acknowledged ? 'investigating' : 'active'}
                            label={alert.resolved ? 'resolved' : alert.acknowledged ? 'ack' : 'new'}
                          />
                        </td>
                        <td>
                          {!alert.acknowledged && !alert.resolved ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => void handleAck(alert.id)}
                              disabled={ackingId === alert.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <CheckCircle size={12} />
                              {ackingId === alert.id ? '…' : 'Ack'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Alerts
