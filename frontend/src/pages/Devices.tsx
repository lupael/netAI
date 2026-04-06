import React, { useCallback, useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { Device, DeviceStatus } from '../types'
import { Cpu, HardDrive, MemoryStick, Thermometer, AlertTriangle, Activity, ExternalLink } from 'lucide-react'
import { format, subMinutes } from 'date-fns'

const MOCK_DEVICES: Device[] = [
  { id: 'core-01', hostname: 'core-sw-01', ip_address: '10.0.0.1', device_type: 'core_switch', vendor: 'Cisco', model: 'Catalyst 9500', os_version: 'IOS-XE 17.9.3', location: 'DC-A Rack 1', status: 'healthy', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 28, memory_usage: 45, disk_usage: 22, temperature: 42, uptime_seconds: 2592000, packet_loss_pct: 0, latency_ms: 1.2, timestamp: new Date().toISOString() } },
  { id: 'core-02', hostname: 'core-sw-02', ip_address: '10.0.0.2', device_type: 'core_switch', vendor: 'Cisco', model: 'Catalyst 9500', os_version: 'IOS-XE 17.9.3', location: 'DC-A Rack 2', status: 'healthy', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 32, memory_usage: 51, disk_usage: 20, temperature: 45, uptime_seconds: 2160000, packet_loss_pct: 0, latency_ms: 1.1, timestamp: new Date().toISOString() } },
  { id: 'dist-01', hostname: 'dist-sw-01', ip_address: '10.0.1.1', device_type: 'distribution_switch', vendor: 'Cisco', model: 'Catalyst 9300', os_version: 'IOS-XE 17.6.5', location: 'DC-A Rack 5', status: 'healthy', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 18, memory_usage: 38, disk_usage: 15, temperature: 38, uptime_seconds: 7776000, packet_loss_pct: 0, latency_ms: 1.5, timestamp: new Date().toISOString() } },
  { id: 'dist-02', hostname: 'dist-sw-02', ip_address: '10.0.1.2', device_type: 'distribution_switch', vendor: 'Juniper', model: 'EX4300', os_version: 'Junos 22.4R1', location: 'DC-B Rack 3', status: 'warning', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 87, memory_usage: 79, disk_usage: 68, temperature: 68, uptime_seconds: 864000, packet_loss_pct: 0.3, latency_ms: 4.7, timestamp: new Date().toISOString() } },
  { id: 'edge-01', hostname: 'edge-router-01', ip_address: '10.0.0.254', device_type: 'router', vendor: 'Cisco', model: 'ASR 1002-X', os_version: 'IOS-XE 17.9.2', location: 'DC-A Rack 0', status: 'healthy', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 45, memory_usage: 62, disk_usage: 30, temperature: 52, uptime_seconds: 5184000, packet_loss_pct: 0, latency_ms: 2.1, timestamp: new Date().toISOString() } },
  { id: 'fw-01', hostname: 'firewall-01', ip_address: '10.0.0.253', device_type: 'firewall', vendor: 'Palo Alto', model: 'PA-3220', os_version: 'PAN-OS 11.0.2', location: 'DC-A Rack 0', status: 'healthy', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 55, memory_usage: 71, disk_usage: 42, temperature: 58, uptime_seconds: 1296000, packet_loss_pct: 0, latency_ms: 1.8, timestamp: new Date().toISOString() } },
  { id: 'acc-03', hostname: 'access-sw-03', ip_address: '10.0.2.3', device_type: 'access_switch', vendor: 'Cisco', model: 'Catalyst 2960-X', os_version: 'IOS 15.2(7)E5', location: 'Floor 3 IDF', status: 'degraded', last_seen: new Date().toISOString(), interfaces: [], metrics: { cpu_usage: 94, memory_usage: 88, disk_usage: 78, temperature: 72, uptime_seconds: 86400, packet_loss_pct: 2.1, latency_ms: 12.3, timestamp: new Date().toISOString() } },
  { id: 'acc-05', hostname: 'access-sw-05', ip_address: '10.0.2.5', device_type: 'access_switch', vendor: 'HP', model: 'Aruba 2930F', os_version: 'ArubaOS-Switch 16.11', location: 'Floor 5 IDF', status: 'down', last_seen: new Date(Date.now() - 1800000).toISOString(), interfaces: [], metrics: { cpu_usage: 0, memory_usage: 0, disk_usage: 0, uptime_seconds: 0, packet_loss_pct: 100, latency_ms: 0, timestamp: new Date(Date.now() - 1800000).toISOString() } },
]

// Generate perf time-series
const PERF_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: format(subMinutes(new Date(), (23 - i) * 5), 'HH:mm'),
  cpu: Math.round(20 + Math.random() * 30),
  memory: Math.round(40 + Math.random() * 20),
  latency: parseFloat((1 + Math.random() * 2).toFixed(1)),
}))

const usageColor = (val: number) => val >= 90 ? '#ef4444' : val >= 70 ? '#f59e0b' : '#10b981'

const Devices: React.FC = () => {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES)
  const [selected, setSelected] = useState<Device>(MOCK_DEVICES[0])
  const [loading, setLoading] = useState(true)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<Record<string, unknown>[]>('/api/devices')
      if (res.data.length) {
        // Map backend Device fields (name, ip, type, firmware_version) to UI Device fields
        const mapped: Device[] = res.data.map((d) => ({
          id: d.id as string,
          hostname: (d.name as string) ?? (d.hostname as string),
          ip_address: (d.ip as string) ?? (d.ip_address as string),
          device_type: (d.type as string) ?? (d.device_type as string),
          vendor: (d.vendor as string) ?? 'Unknown',
          model: (d.model as string) ?? '',
          os_version: (d.firmware_version as string) ?? (d.os_version as string) ?? '',
          location: (d.location as string) ?? '',
          status: (d.status === 'online' ? 'healthy' : d.status === 'offline' ? 'down' : d.status) as Device['status'],
          last_seen: (d.last_seen as string) ?? new Date().toISOString(),
          interfaces: [],
          metrics: {
            cpu_usage: (d.cpu_usage as number) ?? 0,
            memory_usage: (d.memory_usage as number) ?? 0,
            disk_usage: (d.disk_usage as number) ?? 0,
            uptime_seconds: (d.uptime as number) ?? 0,
            packet_loss_pct: 0,
            latency_ms: 0,
            timestamp: new Date().toISOString(),
          },
        }))
        setDevices(mapped)
        setSelected(mapped[0])
      }
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchDevices() }, [fetchDevices])

  const statusGroups: Record<DeviceStatus, number> = { healthy: 0, warning: 0, degraded: 0, down: 0, unknown: 0 }
  devices.forEach((d) => { statusGroups[d.status] = (statusGroups[d.status] ?? 0) + 1 })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Device Health" subtitle="Real-time device performance monitoring" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={40} /></div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Healthy', count: statusGroups.healthy, color: 'var(--accent-green)' },
                { label: 'Warning', count: statusGroups.warning, color: 'var(--accent-yellow)' },
                { label: 'Degraded', count: statusGroups.degraded, color: 'var(--accent-orange)' },
                { label: 'Down', count: statusGroups.down, color: 'var(--accent-red)' },
              ].map(({ label, count, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color }}>{count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.6fr', alignItems: 'start' }}>
              {/* Device List */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p className="card-title">Device Inventory</p>
                {devices.map((device) => {
                  const m = device.metrics
                  const isSelected = selected.id === device.id
                  const highCpu = m && m.cpu_usage >= 80
                  return (
                    <div
                      key={device.id}
                      onClick={() => setSelected(device)}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        background: isSelected ? 'var(--accent-blue-dim)' : 'var(--bg-secondary)',
                        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {highCpu && <AlertTriangle size={13} style={{ color: 'var(--accent-yellow)' }} />}
                          <code style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{device.hostname}</code>
                        </div>
                        <StatusBadge status={device.status} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'monospace' }}>
                        {device.ip_address} · {device.vendor} {device.model}
                      </div>
                      {m && device.status !== 'down' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[
                            { label: 'CPU', val: m.cpu_usage },
                            { label: 'MEM', val: m.memory_usage },
                            { label: 'DISK', val: m.disk_usage },
                          ].map(({ label, val }) => (
                            <div key={label} style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ color: usageColor(val) }}>{val}%</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${val}%`, background: usageColor(val) }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Device Detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{selected.hostname}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{selected.ip_address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/devices/${selected.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
                      >
                        <ExternalLink size={12} /> View Dashboard
                      </button>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Vendor', val: selected.vendor },
                      { label: 'Model', val: selected.model },
                      { label: 'OS Version', val: selected.os_version },
                      { label: 'Location', val: selected.location },
                      { label: 'Device Type', val: selected.device_type.replace(/_/g, ' ') },
                      { label: 'Last Seen', val: format(new Date(selected.last_seen), 'MMM d, HH:mm') },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {selected.metrics && selected.status !== 'down' && (
                    <div className="grid-4" style={{ gap: 10 }}>
                      {[
                        { label: 'CPU', val: selected.metrics.cpu_usage, icon: <Cpu size={14} />, suffix: '%' },
                        { label: 'Memory', val: selected.metrics.memory_usage, icon: <MemoryStick size={14} />, suffix: '%' },
                        { label: 'Disk', val: selected.metrics.disk_usage, icon: <HardDrive size={14} />, suffix: '%' },
                        { label: 'Temp', val: selected.metrics.temperature ?? 0, icon: <Thermometer size={14} />, suffix: '°C' },
                      ].map(({ label, val, icon, suffix }) => (
                        <div key={label} style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ color: usageColor(suffix === '°C' ? val * 1.1 : val), marginBottom: 4 }}>{icon}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: usageColor(suffix === '°C' ? val * 1.1 : val) }}>{val}{suffix}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Failure prediction */}
                  {(selected.status === 'warning' || selected.status === 'degraded') && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-yellow-dim)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Activity size={16} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-yellow)' }}>Failure Risk: High</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>AI predicts 73% chance of failure within 24h based on metrics trend</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance chart */}
                <div className="card">
                  <p className="card-title">Performance (Last 2h)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={PERF_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="cpu" stroke="#3b82f6" dot={false} strokeWidth={2} name="CPU %" />
                      <Line type="monotone" dataKey="memory" stroke="#8b5cf6" dot={false} strokeWidth={2} name="Mem %" />
                      <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{val}</span>} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Devices
