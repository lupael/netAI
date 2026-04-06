import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'

interface NetworkLink {
  id: string
  source_id: string
  target_id: string
  bandwidth: number
  latency: number
  packet_loss: number
  status: string
  utilization: number
}

interface LinkStats {
  total_links: number
  active_links: number
  degraded_links: number
  down_links: number
  avg_utilization_pct: number
  avg_latency_ms: number
}

const MOCK_LINKS: NetworkLink[] = [
  { id: 'lnk-001', source_id: 'core-router-01', target_id: 'dist-sw-01', bandwidth: 10000, latency: 0.3, packet_loss: 0.0, status: 'up', utilization: 62.1 },
  { id: 'lnk-002', source_id: 'core-router-01', target_id: 'dist-sw-02', bandwidth: 10000, latency: 0.4, packet_loss: 0.0, status: 'up', utilization: 54.8 },
  { id: 'lnk-003', source_id: 'core-router-02', target_id: 'dist-sw-01', bandwidth: 10000, latency: 0.3, packet_loss: 0.0, status: 'up', utilization: 71.2 },
  { id: 'lnk-004', source_id: 'core-router-02', target_id: 'dist-sw-02', bandwidth: 10000, latency: 0.5, packet_loss: 0.0, status: 'up', utilization: 48.5 },
  { id: 'lnk-005', source_id: 'dist-sw-01', target_id: 'access-sw-01', bandwidth: 1000, latency: 0.8, packet_loss: 0.1, status: 'up', utilization: 38.4 },
  { id: 'lnk-006', source_id: 'dist-sw-01', target_id: 'access-sw-02', bandwidth: 1000, latency: 0.9, packet_loss: 0.0, status: 'degraded', utilization: 88.7 },
  { id: 'lnk-007', source_id: 'dist-sw-02', target_id: 'access-sw-03', bandwidth: 1000, latency: 1.2, packet_loss: 2.3, status: 'degraded', utilization: 91.3 },
  { id: 'lnk-008', source_id: 'dist-sw-02', target_id: 'access-sw-04', bandwidth: 1000, latency: 0.7, packet_loss: 0.0, status: 'up', utilization: 22.1 },
  { id: 'lnk-009', source_id: 'edge-router-01', target_id: 'core-router-01', bandwidth: 10000, latency: 1.1, packet_loss: 0.5, status: 'up', utilization: 43.9 },
  { id: 'lnk-010', source_id: 'edge-router-02', target_id: 'core-router-02', bandwidth: 10000, latency: 0.0, packet_loss: 0.0, status: 'down', utilization: 0.0 },
  { id: 'lnk-011', source_id: 'firewall-01', target_id: 'core-router-01', bandwidth: 10000, latency: 0.6, packet_loss: 0.0, status: 'up', utilization: 29.7 },
]

const MOCK_STATS: LinkStats = {
  total_links: 11,
  active_links: 8,
  degraded_links: 2,
  down_links: 1,
  avg_utilization_pct: 49.7,
  avg_latency_ms: 0.62,
}

const utilizationColor = (pct: number): string => {
  if (pct >= 85) return 'var(--accent-red)'
  if (pct >= 70) return 'var(--accent-yellow)'
  return 'var(--accent-green)'
}

const LinkMonitor: React.FC = () => {
  const [links, setLinks] = useState<NetworkLink[]>(MOCK_LINKS)
  const [stats, setStats] = useState<LinkStats>(MOCK_STATS)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [linksRes, statsRes] = await Promise.all([
        client.get<NetworkLink[]>('/api/links'),
        client.get<LinkStats>('/api/links/stats'),
      ])
      setLinks(linksRes.data)
      setStats(statsRes.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Link Monitoring" subtitle="Real-time link health & utilization" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Links', val: stats.total_links, color: 'var(--accent-blue)' },
                { label: 'Active', val: stats.active_links, color: 'var(--accent-green)' },
                { label: 'Degraded', val: stats.degraded_links, color: 'var(--accent-yellow)' },
                { label: 'Down', val: stats.down_links, color: 'var(--accent-red)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2 mb-6">
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>{stats.avg_utilization_pct}%</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Avg Utilization</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-purple)' }}>{stats.avg_latency_ms} ms</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Avg Latency</div>
              </div>
            </div>

            <div className="card">
              <p className="card-title">Network Links</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Link ID</th>
                      <th>Source → Target</th>
                      <th>Bandwidth</th>
                      <th>Utilization</th>
                      <th>Latency</th>
                      <th>Packet Loss</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.id}>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{link.id}</code></td>
                        <td>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {link.source_id}
                          </span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {link.target_id}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {link.bandwidth >= 1000 ? `${link.bandwidth / 1000} Gbps` : `${link.bandwidth} Mbps`}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${link.utilization}%`, background: utilizationColor(link.utilization) }}
                              />
                            </div>
                            <span style={{ fontSize: 12, color: utilizationColor(link.utilization), fontWeight: 600 }}>
                              {link.utilization.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{link.latency.toFixed(1)} ms</td>
                        <td style={{ color: link.packet_loss > 1 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                          {link.packet_loss.toFixed(1)}%
                        </td>
                        <td><StatusBadge status={link.status} /></td>
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

export default LinkMonitor
