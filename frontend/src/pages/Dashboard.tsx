import React, { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Server, ShieldAlert, Settings, Package, AlertTriangle, Activity } from 'lucide-react'
import Header from '../components/Header'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { Alert, DashboardKPI, SeverityLevel } from '../types'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#9ca3af',
}

// Fallback mock data when API is unavailable
const MOCK_KPI: DashboardKPI = {
  total_devices: 42,
  active_devices: 38,
  active_threats: 7,
  config_issues: 4,
  pending_updates: 12,
  critical_alerts: 3,
  network_health_score: 87,
}

const MOCK_ALERTS: Alert[] = [
  { id: '1', type: 'threat', severity: 'critical', title: 'Port Scan Detected', message: 'SYN scan from 10.0.0.99', device_hostname: 'core-sw-01', timestamp: new Date(Date.now() - 120000).toISOString(), acknowledged: false, resolved: false },
  { id: '2', type: 'device', severity: 'high', title: 'CPU Spike', message: 'CPU usage at 94% for 5 min', device_hostname: 'edge-router-01', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: false, resolved: false },
  { id: '3', type: 'config', severity: 'medium', title: 'Config Drift', message: 'Unauthorized ACL change', device_hostname: 'dist-sw-02', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: true, resolved: false },
  { id: '4', type: 'software', severity: 'medium', title: 'CVE Detected', message: 'CVE-2024-1234 in IOS 15.2', device_hostname: 'access-sw-05', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false, resolved: false },
  { id: '5', type: 'traffic', severity: 'low', title: 'Bandwidth Threshold', message: 'WAN link at 82% utilization', device_hostname: 'wan-router-01', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true, resolved: false },
]

const MOCK_HEALTH_DATA = [
  { name: 'Core', healthy: 4, warning: 1, critical: 0 },
  { name: 'Distrib', healthy: 6, warning: 2, critical: 1 },
  { name: 'Access', healthy: 18, warning: 3, critical: 1 },
  { name: 'Edge', healthy: 3, warning: 1, critical: 0 },
  { name: 'WAN', healthy: 2, warning: 0, critical: 0 },
]

const Dashboard: React.FC = () => {
  const [kpi, setKpi] = useState<DashboardKPI>(MOCK_KPI)
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, alertRes] = await Promise.allSettled([
        client.get<DashboardKPI>('/api/dashboard/kpi'),
        client.get<Alert[]>('/api/alerts'),
      ])
      if (kpiRes.status === 'fulfilled') setKpi(kpiRes.value.data)
      if (alertRes.status === 'fulfilled') {
        const raw = alertRes.value.data
        // Normalise: map device_name → device_hostname for display
        const mapped = raw.map((a) => ({ ...a, device_hostname: a.device_name ?? a.device_hostname }))
        setAlerts(mapped)
      }
    } catch {
      // retain mock data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title="Dashboard" subtitle="Network overview" alertCount={kpi.critical_alerts} />
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner size={40} />
        </div>
      </div>
    )
  }

  const healthScore = kpi.network_health_score
  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Dashboard" subtitle="Network overview" alertCount={kpi.critical_alerts} />
      <div className="page-content">
        {/* KPI Cards */}
        <div className="grid-4 mb-6">
          <MetricCard
            title="Total Devices"
            value={kpi.total_devices}
            subtitle={`${kpi.active_devices} active`}
            icon={<Server size={18} />}
            color="blue"
            trend={{ value: 2, label: 'vs last week' }}
          />
          <MetricCard
            title="Active Threats"
            value={kpi.active_threats}
            subtitle="Require attention"
            icon={<ShieldAlert size={18} />}
            color="red"
            trend={{ value: -1, label: 'vs yesterday' }}
          />
          <MetricCard
            title="Config Issues"
            value={kpi.config_issues}
            subtitle="Policy violations"
            icon={<Settings size={18} />}
            color="yellow"
            trend={{ value: 0, label: 'no change' }}
          />
          <MetricCard
            title="Pending Updates"
            value={kpi.pending_updates}
            subtitle="Software upgrades"
            icon={<Package size={18} />}
            color="purple"
            trend={{ value: 3, label: 'new this week' }}
          />
        </div>

        {/* Network Health Score + Recent Alerts */}
        <div className="grid-3 mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Health Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <p className="card-title" style={{ textAlign: 'center' }}>Network Health</p>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-color)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={healthColor}
                  strokeWidth="10"
                  strokeDasharray={`${(healthScore / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: healthColor }}>{healthScore}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              {[
                { label: 'Devices Online', val: `${kpi.active_devices}/${kpi.total_devices}`, color: 'var(--accent-green)' },
                { label: 'Critical Alerts', val: String(kpi.critical_alerts), color: 'var(--accent-red)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Recent Alerts</p>
              <AlertTriangle size={16} style={{ color: 'var(--accent-yellow)' }} />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Title</th>
                    <th>Device</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.slice(0, 5).map((alert) => (
                    <tr key={alert.id}>
                      <td><StatusBadge status={alert.severity} /></td>
                      <td style={{ color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</td>
                      <td><code style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{alert.device_hostname ?? '—'}</code></td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </td>
                      <td>
                        <StatusBadge status={alert.acknowledged ? 'info' : 'active'} label={alert.acknowledged ? 'ack' : 'new'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Device Health by Layer */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p className="card-title" style={{ marginBottom: 0 }}>Device Health by Layer</p>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              {[
                { label: 'Healthy', color: '#10b981' },
                { label: 'Warning', color: '#f59e0b' },
                { label: 'Critical', color: '#ef4444' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_HEALTH_DATA} barSize={16}>
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="healthy" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="warning" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="grid-4 mt-4">
          {(['critical', 'high', 'medium', 'low'] as SeverityLevel[]).map((sev) => {
            const count = alerts.filter((a) => a.severity === sev).length
            return (
              <div
                key={sev}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <Activity size={20} style={{ color: SEVERITY_COLORS[sev], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: SEVERITY_COLORS[sev] }}>{count}</div>
                  <div style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-muted)' }}>{sev} alerts</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
