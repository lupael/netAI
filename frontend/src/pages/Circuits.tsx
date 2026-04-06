import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'

interface Circuit {
  id: string
  name: string
  type: string
  provider: string
  bandwidth_mbps: number
  utilization_pct: number
  status: string
  latency_ms: number
  sla_uptime_pct: number
  actual_uptime_pct: number
  circuit_id_provider: string
  location: string
}

const MOCK_CIRCUITS: Circuit[] = [
  { id: 'ckt-001', name: 'NTTN-Primary-Dhaka', type: 'NTTN', provider: 'NTTN Bangladesh', bandwidth_mbps: 1000, utilization_pct: 67.4, status: 'active', latency_ms: 3.2, sla_uptime_pct: 99.9, actual_uptime_pct: 99.95, circuit_id_provider: 'NTTN-BD-DK-00142', location: 'DC1 — Dhaka' },
  { id: 'ckt-002', name: 'ISP-Fiber-Primary', type: 'ISP', provider: 'Grameenphone Enterprise', bandwidth_mbps: 500, utilization_pct: 82.1, status: 'degraded', latency_ms: 8.7, sla_uptime_pct: 99.5, actual_uptime_pct: 98.9, circuit_id_provider: 'GP-ENT-20234', location: 'DC1 — Dhaka' },
  { id: 'ckt-003', name: 'MPLS-Chittagong-Link', type: 'MPLS', provider: 'Robi Business', bandwidth_mbps: 200, utilization_pct: 45.0, status: 'active', latency_ms: 22.5, sla_uptime_pct: 99.7, actual_uptime_pct: 99.8, circuit_id_provider: 'ROBI-MPLS-CTG-0089', location: 'Chittagong Branch' },
  { id: 'ckt-004', name: 'Internet-Broadband-Backup', type: 'Internet', provider: 'Banglalink Business', bandwidth_mbps: 100, utilization_pct: 12.3, status: 'active', latency_ms: 18.0, sla_uptime_pct: 99.0, actual_uptime_pct: 99.2, circuit_id_provider: 'BL-BIZ-2024-5511', location: 'DC1 — Dhaka' },
  { id: 'ckt-005', name: 'P2P-Sylhet-HQ', type: 'P2P', provider: 'BTTB', bandwidth_mbps: 50, utilization_pct: 0.0, status: 'down', latency_ms: 0.0, sla_uptime_pct: 99.5, actual_uptime_pct: 97.1, circuit_id_provider: 'BTTB-P2P-SYL-0017', location: 'Sylhet Office' },
  { id: 'ckt-006', name: 'NTTN-Secondary-Dhaka', type: 'NTTN', provider: 'NTTN Bangladesh', bandwidth_mbps: 500, utilization_pct: 34.8, status: 'active', latency_ms: 3.5, sla_uptime_pct: 99.9, actual_uptime_pct: 99.99, circuit_id_provider: 'NTTN-BD-DK-00198', location: 'DC2 — Dhaka' },
]

const typeColor = (type: string): string => {
  switch (type) {
    case 'NTTN': return 'var(--accent-blue)'
    case 'ISP': return 'var(--accent-green)'
    case 'MPLS': return 'var(--accent-purple)'
    case 'Internet': return 'var(--accent-yellow)'
    case 'P2P': return 'var(--accent-orange)'
    default: return 'var(--text-secondary)'
  }
}

const utilizationColor = (pct: number): string => {
  if (pct >= 85) return 'var(--accent-red)'
  if (pct >= 70) return 'var(--accent-yellow)'
  return 'var(--accent-green)'
}

const Circuits: React.FC = () => {
  const [circuits, setCircuits] = useState<Circuit[]>(MOCK_CIRCUITS)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<Circuit[]>('/api/circuits')
      setCircuits(res.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const active = circuits.filter((c) => c.status === 'active').length
  const degraded = circuits.filter((c) => c.status === 'degraded').length
  const slaCompliant = circuits.filter((c) => c.actual_uptime_pct >= c.sla_uptime_pct).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Circuit Status" subtitle="WAN, NTTN & ISP circuit monitoring" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Circuits', val: circuits.length, color: 'var(--accent-blue)' },
                { label: 'Active', val: active, color: 'var(--accent-green)' },
                { label: 'Degraded / Down', val: degraded + circuits.filter((c) => c.status === 'down').length, color: 'var(--accent-yellow)' },
                { label: 'SLA Compliant', val: `${slaCompliant}/${circuits.length}`, color: slaCompliant === circuits.length ? 'var(--accent-green)' : 'var(--accent-red)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <p className="card-title">Circuit Overview</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Circuit Name</th>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Bandwidth</th>
                      <th>Utilization</th>
                      <th>Status</th>
                      <th>Latency</th>
                      <th>SLA Uptime</th>
                      <th>Actual Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circuits.map((ckt) => {
                      const slaOk = ckt.actual_uptime_pct >= ckt.sla_uptime_pct
                      return (
                        <tr key={ckt.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ckt.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ckt.circuit_id_provider}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{ckt.provider}</td>
                          <td>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: typeColor(ckt.type),
                              background: 'var(--bg-secondary)',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}>
                              {ckt.type}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {ckt.bandwidth_mbps >= 1000 ? `${ckt.bandwidth_mbps / 1000} Gbps` : `${ckt.bandwidth_mbps} Mbps`}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div
                                  className="progress-fill"
                                  style={{ width: `${ckt.utilization_pct}%`, background: utilizationColor(ckt.utilization_pct) }}
                                />
                              </div>
                              <span style={{ fontSize: 12, color: utilizationColor(ckt.utilization_pct), fontWeight: 600 }}>
                                {ckt.utilization_pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td><StatusBadge status={ckt.status} /></td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {ckt.status === 'down' ? '—' : `${ckt.latency_ms} ms`}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{ckt.sla_uptime_pct}%</td>
                          <td style={{ color: slaOk ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                            {ckt.actual_uptime_pct}%
                            <span style={{ fontSize: 11, marginLeft: 4 }}>{slaOk ? '✓' : '✗'}</span>
                          </td>
                        </tr>
                      )
                    })}
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

export default Circuits
