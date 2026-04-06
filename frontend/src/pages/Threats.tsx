import React, { useCallback, useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { Threat, SeverityLevel } from '../types'
import { ShieldOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { format, subMinutes } from 'date-fns'

const MOCK_THREATS: Threat[] = [
  { id: 't1', type: 'Port Scan', severity: 'critical', source_ip: '10.0.0.99', destination_ip: '10.0.0.1', description: 'SYN scan targeting core switch — 4,200 ports/sec', detected_at: new Date(Date.now() - 120000).toISOString(), status: 'active', affected_devices: ['core-sw-01'], confidence: 98, mitre_technique: 'T1046' },
  { id: 't2', type: 'Brute Force', severity: 'high', source_ip: '192.168.10.50', destination_ip: '10.0.0.254', description: 'SSH brute force attempt — 320 failed logins', detected_at: new Date(Date.now() - 600000).toISOString(), status: 'active', affected_devices: ['edge-router-01'], confidence: 94, mitre_technique: 'T1110' },
  { id: 't3', type: 'Data Exfil', severity: 'high', source_ip: '10.0.2.45', destination_ip: '203.0.113.50', description: 'Unusual outbound data transfer — 2.4 GB in 10 min', detected_at: new Date(Date.now() - 1200000).toISOString(), status: 'investigating', affected_devices: ['access-sw-03'], confidence: 87, mitre_technique: 'T1041' },
  { id: 't4', type: 'DDoS', severity: 'critical', source_ip: '0.0.0.0/0', destination_ip: '203.0.113.1', description: 'Volumetric DDoS — 14 Gbps inbound', detected_at: new Date(Date.now() - 300000).toISOString(), status: 'active', affected_devices: ['wan-router-01', 'firewall-01'], confidence: 99 },
  { id: 't5', type: 'Lateral Movement', severity: 'medium', source_ip: '10.0.2.101', destination_ip: '10.0.1.0/24', description: 'Anomalous lateral scan across distribution segment', detected_at: new Date(Date.now() - 3600000).toISOString(), status: 'mitigated', affected_devices: ['dist-sw-02'], confidence: 76, mitre_technique: 'T1021' },
  { id: 't6', type: 'Malware C2', severity: 'high', source_ip: '10.0.2.88', destination_ip: '198.51.100.10', description: 'Beaconing to known C2 server every 60 sec', detected_at: new Date(Date.now() - 7200000).toISOString(), status: 'mitigated', affected_devices: ['access-sw-05'], confidence: 91, mitre_technique: 'T1071' },
]

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#f97316']

// Generate traffic anomaly timeline
const TIMELINE = Array.from({ length: 20 }, (_, i) => ({
  time: format(subMinutes(new Date(), (19 - i) * 5), 'HH:mm'),
  normal: Math.round(1200 + Math.random() * 400),
  anomalous: i > 14 ? Math.round(1800 + Math.random() * 1200) : Math.round(Math.random() * 100),
}))

const Threats: React.FC = () => {
  const [threats, setThreats] = useState<Threat[]>(MOCK_THREATS)
  const [loading, setLoading] = useState(true)
  const [mitigating, setMitigating] = useState<string | null>(null)

  const fetchThreats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<Threat[]>('/api/threats')
      // Backend ThreatAlert uses target_ip / timestamp / status enum values
      const mapped = res.data.map((t) => ({
        ...t,
        destination_ip: (t as unknown as Record<string, string>).target_ip ?? t.destination_ip,
        detected_at: (t as unknown as Record<string, string>).timestamp ?? t.detected_at,
      }))
      setThreats(mapped)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchThreats() }, [fetchThreats])

  const handleMitigate = async (id: string) => {
    setMitigating(id)
    try {
      await client.post(`/api/threats/${id}/mitigate`)
      setThreats((prev) => prev.map((t) => t.id === id ? { ...t, status: 'mitigated' } : t))
    } catch {
      setThreats((prev) => prev.map((t) => t.id === id ? { ...t, status: 'mitigated' } : t))
    } finally {
      setMitigating(null)
    }
  }

  const typeCounts = threats.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] ?? 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
  const active = threats.filter((t) => t.status === 'active').length
  const mitigated = threats.filter((t) => t.status === 'mitigated').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Threat Detection" subtitle="AI-powered threat analysis" alertCount={active} />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={40} /></div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Active', val: active, color: 'var(--accent-red)' },
                { label: 'Investigating', val: threats.filter((t) => t.status === 'investigating').length, color: 'var(--accent-yellow)' },
                { label: 'Mitigated', val: mitigated, color: 'var(--accent-green)' },
                { label: 'Total Threats', val: threats.length, color: 'var(--accent-blue)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid-2 mb-6">
              {/* Pie chart */}
              <div className="card">
                <p className="card-title">Threat Type Breakdown</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                    <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Traffic anomaly timeline */}
              <div className="card">
                <p className="card-title">Traffic Anomaly Timeline</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={TIMELINE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="normal" stroke="#3b82f6" dot={false} strokeWidth={2} name="Normal" />
                    <Line type="monotone" dataKey="anomalous" stroke="#ef4444" dot={false} strokeWidth={2} name="Anomalous" />
                    <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Threats list */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="card-title" style={{ marginBottom: 0 }}>Active Threat Intelligence</p>
                <button onClick={() => void fetchThreats()} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Source IP</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>MITRE</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threats.map((threat) => (
                      <tr key={threat.id}>
                        <td><StatusBadge status={threat.severity} /></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={13} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{threat.type}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{threat.description}</td>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{threat.source_ip}</code></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div className="progress-fill" style={{ width: `${threat.confidence}%`, background: threat.confidence > 90 ? '#ef4444' : threat.confidence > 75 ? '#f59e0b' : '#3b82f6' }} />
                            </div>
                            <span style={{ fontSize: 12 }}>{threat.confidence}%</span>
                          </div>
                        </td>
                        <td><StatusBadge status={threat.status} /></td>
                        <td>
                          {threat.mitre_technique && (
                            <code style={{ fontSize: 11, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent-purple)' }}>
                              {threat.mitre_technique}
                            </code>
                          )}
                        </td>
                        <td>
                          {threat.status === 'active' ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => void handleMitigate(threat.id)}
                              disabled={mitigating === threat.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <ShieldOff size={12} />
                              {mitigating === threat.id ? 'Mitigating…' : 'Mitigate'}
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

export default Threats
