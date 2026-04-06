import React, { useCallback, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'

interface SummaryReport {
  generated_at: string
  devices: { total: number; online: number; online_pct: number }
  network: { total_links: number; active_links: number; avg_utilization_pct: number }
  performance: { avg_cpu_pct: number; avg_memory_pct: number }
  security: { active_threats: number; total_alerts: number }
}

interface UptimeRecord {
  device_id: string
  device_name: string
  uptime_pct_30d: number
  status: string
}

interface BandwidthPoint {
  hour: string
  inbound_mbps: number
  outbound_mbps: number
  utilization_pct: number
}

interface Incident {
  id: string
  type: string
  subtype: string
  severity: string
  description: string
  affected_devices: string[]
  detected_at: string
  status: string
}

const MOCK_SUMMARY: SummaryReport = {
  generated_at: new Date().toISOString(),
  devices: { total: 15, online: 13, online_pct: 86.7 },
  network: { total_links: 11, active_links: 8, avg_utilization_pct: 49.7 },
  performance: { avg_cpu_pct: 62.4, avg_memory_pct: 58.1 },
  security: { active_threats: 4, total_alerts: 8 },
}

const MOCK_UPTIME: UptimeRecord[] = [
  { device_id: 'dev-001', device_name: 'core-router-01', uptime_pct_30d: 100, status: 'online' },
  { device_id: 'dev-002', device_name: 'core-router-02', uptime_pct_30d: 99.9, status: 'online' },
  { device_id: 'dev-003', device_name: 'edge-router-01', uptime_pct_30d: 33.3, status: 'online' },
  { device_id: 'dev-004', device_name: 'edge-router-02', uptime_pct_30d: 96.5, status: 'degraded' },
  { device_id: 'dev-005', device_name: 'dist-sw-01', uptime_pct_30d: 100, status: 'online' },
  { device_id: 'dev-006', device_name: 'dist-sw-02', uptime_pct_30d: 98.7, status: 'online' },
  { device_id: 'dev-007', device_name: 'access-sw-01', uptime_pct_30d: 100, status: 'online' },
  { device_id: 'dev-008', device_name: 'access-sw-02', uptime_pct_30d: 0, status: 'offline' },
]

const MOCK_BANDWIDTH: BandwidthPoint[] = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  inbound_mbps: Math.round(300 + 200 * Math.sin(i * Math.PI / 12) + Math.random() * 30),
  outbound_mbps: Math.round(150 + 100 * Math.sin(i * Math.PI / 12 + 1) + Math.random() * 15),
  utilization_pct: Math.round(30 + 20 * Math.sin(i * Math.PI / 12) + Math.random() * 5),
}))

const MOCK_INCIDENTS: Incident[] = [
  { id: 't1', type: 'threat', subtype: 'Port Scan', severity: 'critical', description: 'SYN scan targeting core switch', affected_devices: ['core-sw-01'], detected_at: new Date(Date.now() - 120000).toISOString(), status: 'active' },
  { id: 't4', type: 'threat', subtype: 'DDoS', severity: 'critical', description: 'Volumetric DDoS — 14 Gbps inbound', affected_devices: ['wan-router-01', 'firewall-01'], detected_at: new Date(Date.now() - 300000).toISOString(), status: 'active' },
  { id: 'alt-001', type: 'alert', subtype: 'cpu_high', severity: 'critical', description: 'db-server-01 CPU at 91.7%', affected_devices: ['dev-010'], detected_at: new Date(Date.now() - 1800000).toISOString(), status: 'open' },
]

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<SummaryReport>(MOCK_SUMMARY)
  const [uptime, setUptime] = useState<UptimeRecord[]>(MOCK_UPTIME)
  const [bandwidth, setBandwidth] = useState<BandwidthPoint[]>(MOCK_BANDWIDTH)
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [summRes, uptRes, bwRes, incRes] = await Promise.all([
        client.get<SummaryReport>('/api/reports/summary'),
        client.get<UptimeRecord[]>('/api/reports/uptime'),
        client.get<BandwidthPoint[]>('/api/reports/bandwidth'),
        client.get<Incident[]>('/api/reports/incidents'),
      ])
      setSummary(summRes.data)
      setUptime(uptRes.data)
      setBandwidth(bwRes.data)
      setIncidents(incRes.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Reports & Analytics" subtitle="Historical data analysis" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Devices Online', val: `${summary.devices.online_pct}%`, color: summary.devices.online_pct > 90 ? 'var(--accent-green)' : 'var(--accent-yellow)' },
                { label: 'Avg CPU', val: `${summary.performance.avg_cpu_pct}%`, color: summary.performance.avg_cpu_pct > 80 ? 'var(--accent-red)' : 'var(--accent-blue)' },
                { label: 'Avg Bandwidth Util', val: `${summary.network.avg_utilization_pct}%`, color: 'var(--accent-purple)' },
                { label: 'Active Threats', val: summary.security.active_threats, color: summary.security.active_threats > 0 ? 'var(--accent-red)' : 'var(--accent-green)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid-2 mb-6">
              <div className="card">
                <p className="card-title">Device Uptime — Last 30 Days</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={uptime} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="device_name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: number) => [`${val}%`, 'Uptime']}
                    />
                    <Bar dataKey="uptime_pct_30d" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <p className="card-title">24h Bandwidth Utilization</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={bandwidth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                    <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>} />
                    <Line type="monotone" dataKey="inbound_mbps" stroke="var(--accent-blue)" dot={false} strokeWidth={2} name="Inbound Mbps" />
                    <Line type="monotone" dataKey="outbound_mbps" stroke="var(--accent-green)" dot={false} strokeWidth={2} name="Outbound Mbps" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents table */}
            <div className="card">
              <p className="card-title">Incident Report</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Description</th>
                      <th>Affected Devices</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(inc.detected_at).toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: inc.type === 'threat' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                            textTransform: 'capitalize',
                          }}>
                            {inc.subtype}
                          </span>
                        </td>
                        <td><StatusBadge status={inc.severity} /></td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inc.description}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {inc.affected_devices.join(', ') || '—'}
                        </td>
                        <td><StatusBadge status={inc.status} /></td>
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

export default Reports
