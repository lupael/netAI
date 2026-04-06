import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import { Cpu, HardDrive, MemoryStick, Thermometer, Terminal, RefreshCw, Archive, ClipboardCheck, Calendar } from 'lucide-react'

interface BackendDevice {
  id: string
  name: string
  type: string
  ip: string
  status: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  uptime: number
  firmware_version: string
  location: string
  interfaces: number
  model: string
  vendor: string
  last_seen: string
}

interface HealthMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  temperature?: number
  uptime: number
  packet_loss?: number
  latency?: number
}

interface DeviceInterface {
  name: string
  ip: string
  status: string
  speed_mbps: number
  utilization_pct: number
}

interface BandwidthPoint {
  time: string
  inbound: number
  outbound: number
}

const MOCK_DEVICE: BackendDevice = {
  id: 'dev-001',
  name: 'core-router-01',
  type: 'router',
  ip: '10.0.0.1',
  status: 'online',
  cpu_usage: 72.4,
  memory_usage: 61.8,
  disk_usage: 34.2,
  uptime: 2592000,
  firmware_version: 'IOS-XE 17.9.3',
  location: 'DC1-Core',
  interfaces: 48,
  model: 'Cisco ASR 1002-X',
  vendor: 'Cisco',
  last_seen: new Date().toISOString(),
}

const MOCK_INTERFACES: DeviceInterface[] = [
  { name: 'GigabitEthernet0/0/0', ip: '10.0.0.1', status: 'up', speed_mbps: 1000, utilization_pct: 42.3 },
  { name: 'GigabitEthernet0/0/1', ip: '10.0.1.1', status: 'up', speed_mbps: 1000, utilization_pct: 67.8 },
  { name: 'TenGigabitEthernet0/1/0', ip: '10.0.100.1', status: 'up', speed_mbps: 10000, utilization_pct: 28.1 },
  { name: 'TenGigabitEthernet0/1/1', ip: '', status: 'down', speed_mbps: 10000, utilization_pct: 0 },
  { name: 'Loopback0', ip: '192.168.255.1', status: 'up', speed_mbps: 0, utilization_pct: 0 },
]

const generateBandwidth = (): BandwidthPoint[] =>
  Array.from({ length: 20 }, (_, i) => ({
    time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    inbound: Math.round(80 + Math.random() * 120),
    outbound: Math.round(40 + Math.random() * 80),
  }))

const formatUptime = (seconds: number): string => {
  if (seconds === 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${mins}m`
}

const usageColor = (val: number): string => {
  if (val >= 90) return 'var(--accent-red)'
  if (val >= 70) return 'var(--accent-yellow)'
  return 'var(--accent-green)'
}

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [device, setDevice] = useState<BackendDevice>(MOCK_DEVICE)
  const [health, setHealth] = useState<HealthMetrics>({
    cpu_usage: MOCK_DEVICE.cpu_usage,
    memory_usage: MOCK_DEVICE.memory_usage,
    disk_usage: MOCK_DEVICE.disk_usage,
    temperature: 48,
    uptime: MOCK_DEVICE.uptime,
  })
  const [bandwidth, setBandwidth] = useState<BandwidthPoint[]>(generateBandwidth)
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const fetchDevice = useCallback(async () => {
    setLoading(true)
    try {
      const [devRes, healthRes] = await Promise.all([
        client.get<BackendDevice>(`/api/devices/${id ?? 'dev-001'}`),
        client.get<BackendDevice>(`/api/devices/${id ?? 'dev-001'}/health`),
      ])
      setDevice(devRes.data)
      const h = healthRes.data
      setHealth({
        cpu_usage: h.cpu_usage ?? devRes.data.cpu_usage,
        memory_usage: h.memory_usage ?? devRes.data.memory_usage,
        disk_usage: h.disk_usage ?? devRes.data.disk_usage,
        temperature: 48,
        uptime: h.uptime ?? devRes.data.uptime,
      })
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void fetchDevice() }, [fetchDevice])

  // Simulate live bandwidth updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBandwidth((prev) => [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inbound: Math.round(80 + Math.random() * 120),
          outbound: Math.round(40 + Math.random() * 80),
        },
      ])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = (action: string) => {
    setActionMsg(`${action} action dispatched for ${device.name}`)
    setTimeout(() => setActionMsg(null), 3000)
  }

  const metricCards = [
    { label: 'CPU Usage', value: health.cpu_usage, unit: '%', icon: <Cpu size={18} />, color: usageColor(health.cpu_usage) },
    { label: 'Memory', value: health.memory_usage, unit: '%', icon: <MemoryStick size={18} />, color: usageColor(health.memory_usage) },
    { label: 'Disk', value: health.disk_usage, unit: '%', icon: <HardDrive size={18} />, color: usageColor(health.disk_usage) },
    { label: 'Temperature', value: health.temperature ?? 0, unit: '°C', icon: <Thermometer size={18} />, color: (health.temperature ?? 0) > 70 ? 'var(--accent-red)' : 'var(--accent-green)' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Device Dashboard" subtitle={device.name} />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            {/* Device info header */}
            <div className="card mb-6">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 20 }}>{device.name}</h2>
                    <StatusBadge status={device.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'IP Address', val: device.ip },
                      { label: 'Vendor', val: device.vendor },
                      { label: 'Model', val: device.model },
                      { label: 'OS / Firmware', val: device.firmware_version },
                      { label: 'Location', val: device.location },
                      { label: 'Uptime', val: formatUptime(health.uptime) },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Ping', icon: <RefreshCw size={13} />, action: 'Ping' },
                    { label: 'SSH', icon: <Terminal size={13} />, action: 'SSH' },
                    { label: 'Config Backup', icon: <Archive size={13} />, action: 'Config Backup' },
                    { label: 'Audit Config', icon: <ClipboardCheck size={13} />, action: 'Audit Config' },
                    { label: 'Schedule Upgrade', icon: <Calendar size={13} />, action: 'Schedule Upgrade' },
                  ].map(({ label, icon, action }) => (
                    <button
                      key={label}
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleAction(action)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              {actionMsg && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12, color: 'var(--accent-blue)' }}>
                  {actionMsg}
                </div>
              )}
            </div>

            {/* Metric cards */}
            <div className="grid-4 mb-6">
              {metricCards.map(({ label, value, unit, icon, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>
                    {value.toFixed(0)}{unit}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(value, 100)}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bandwidth chart */}
            <div className="card mb-6">
              <p className="card-title">Real-time Bandwidth (Mbps)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bandwidth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>} />
                  <Line type="monotone" dataKey="inbound" stroke="var(--accent-blue)" dot={false} strokeWidth={2} name="Inbound" />
                  <Line type="monotone" dataKey="outbound" stroke="var(--accent-green)" dot={false} strokeWidth={2} name="Outbound" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Interfaces table */}
            <div className="card">
              <p className="card-title">Interfaces</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>IP Address</th>
                      <th>Status</th>
                      <th>Speed</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INTERFACES.map((iface) => (
                      <tr key={iface.name}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{iface.name}</td>
                        <td>
                          {iface.ip
                            ? <code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{iface.ip}</code>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td><StatusBadge status={iface.status} /></td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {iface.speed_mbps === 0 ? '—' : iface.speed_mbps >= 1000 ? `${iface.speed_mbps / 1000} Gbps` : `${iface.speed_mbps} Mbps`}
                        </td>
                        <td>
                          {iface.status === 'up' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div
                                  className="progress-fill"
                                  style={{ width: `${iface.utilization_pct}%`, background: usageColor(iface.utilization_pct) }}
                                />
                              </div>
                              <span style={{ fontSize: 12, color: usageColor(iface.utilization_pct) }}>
                                {iface.utilization_pct.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
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

export default DeviceDetail
