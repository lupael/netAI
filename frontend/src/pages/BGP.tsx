import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import { ShieldCheck } from 'lucide-react'

interface BGPSession {
  id: string
  peer_ip: string
  remote_as: number
  local_as: number
  state: string
  prefixes_received: number
  prefixes_sent: number
  uptime_seconds: number
  uptime_human: string
  description: string
  router: string
}

interface BGPHijack {
  id: string
  prefix: string
  expected_origin_as: number
  actual_origin_as: number
  detected_at: string
  severity: string
  description: string
  status: string
  affected_routes: number
}

const MOCK_SESSIONS: BGPSession[] = [
  { id: 'bgp-001', peer_ip: '203.0.113.1', remote_as: 64512, local_as: 65001, state: 'established', prefixes_received: 142, prefixes_sent: 8, uptime_seconds: 864000, uptime_human: '10d 0h', description: 'Transit Provider A', router: 'edge-router-01' },
  { id: 'bgp-002', peer_ip: '198.51.100.1', remote_as: 64513, local_as: 65001, state: 'established', prefixes_received: 98, prefixes_sent: 8, uptime_seconds: 432000, uptime_human: '5d 0h', description: 'Transit Provider B', router: 'edge-router-01' },
  { id: 'bgp-003', peer_ip: '192.0.2.50', remote_as: 64514, local_as: 65001, state: 'idle', prefixes_received: 0, prefixes_sent: 0, uptime_seconds: 0, uptime_human: '—', description: 'Backup ISP', router: 'edge-router-02' },
  { id: 'bgp-004', peer_ip: '10.10.10.2', remote_as: 65002, local_as: 65001, state: 'established', prefixes_received: 24, prefixes_sent: 16, uptime_seconds: 1296000, uptime_human: '15d 0h', description: 'iBGP Peer — Core Router 02', router: 'core-router-01' },
  { id: 'bgp-005', peer_ip: '172.16.0.1', remote_as: 64520, local_as: 65001, state: 'active', prefixes_received: 0, prefixes_sent: 0, uptime_seconds: 0, uptime_human: '—', description: 'IXP Peer', router: 'edge-router-02' },
]

const MOCK_HIJACKS: BGPHijack[] = [
  { id: 'hijack-001', prefix: '192.0.2.0/24', expected_origin_as: 65001, actual_origin_as: 64999, detected_at: new Date(Date.now() - 7200000).toISOString(), severity: 'critical', description: 'Unauthorized prefix announcement from AS64999', status: 'active', affected_routes: 12 },
  { id: 'hijack-002', prefix: '203.0.113.0/25', expected_origin_as: 65001, actual_origin_as: 64888, detected_at: new Date(Date.now() - 28800000).toISOString(), severity: 'high', description: 'More-specific hijack of /25 subnet from AS64888', status: 'active', affected_routes: 5 },
  { id: 'hijack-003', prefix: '10.0.0.0/8', expected_origin_as: 65001, actual_origin_as: 64777, detected_at: new Date(Date.now() - 172800000).toISOString(), severity: 'medium', description: 'Private IP range announced externally by AS64777', status: 'resolved', affected_routes: 0 },
]

const sessionStateColor = (state: string): string => {
  switch (state) {
    case 'established': return 'var(--accent-green)'
    case 'idle': return 'var(--text-muted)'
    case 'active': return 'var(--accent-yellow)'
    default: return 'var(--accent-red)'
  }
}

const BGP: React.FC = () => {
  const [sessions, setSessions] = useState<BGPSession[]>(MOCK_SESSIONS)
  const [hijacks, setHijacks] = useState<BGPHijack[]>(MOCK_HIJACKS)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sessRes, hijackRes] = await Promise.all([
        client.get<BGPSession[]>('/api/bgp/sessions'),
        client.get<BGPHijack[]>('/api/bgp/hijacks'),
      ])
      setSessions(sessRes.data)
      setHijacks(hijackRes.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await client.post(`/api/bgp/hijacks/${id}/resolve`)
    } catch {
      // optimistic update
    } finally {
      setHijacks((prev) => prev.map((h) => h.id === id ? { ...h, status: 'resolved' } : h))
      setResolving(null)
    }
  }

  const established = sessions.filter((s) => s.state === 'established').length
  const activeHijacks = hijacks.filter((h) => h.status === 'active').length
  const resolvedHijacks = hijacks.filter((h) => h.status === 'resolved').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="BGP Monitoring" subtitle="Route hijack detection & BGP session management" alertCount={activeHijacks} />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Sessions', val: sessions.length, color: 'var(--accent-blue)' },
                { label: 'Established', val: established, color: 'var(--accent-green)' },
                { label: 'Active Hijacks', val: activeHijacks, color: 'var(--accent-red)' },
                { label: 'Resolved Hijacks', val: resolvedHijacks, color: 'var(--text-muted)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="card mb-6">
              <p className="card-title">BGP Sessions</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Peer IP</th>
                      <th>Remote AS</th>
                      <th>Local AS</th>
                      <th>State</th>
                      <th>Prefixes Rx</th>
                      <th>Prefixes Tx</th>
                      <th>Uptime</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((sess) => (
                      <tr key={sess.id}>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{sess.peer_ip}</code></td>
                        <td style={{ color: 'var(--text-secondary)' }}>AS{sess.remote_as}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>AS{sess.local_as}</td>
                        <td>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: sessionStateColor(sess.state),
                            textTransform: 'capitalize',
                          }}>
                            ● {sess.state}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{sess.prefixes_received.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{sess.prefixes_sent.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{sess.uptime_human}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{sess.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <p className="card-title">BGP Hijack Events</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Prefix</th>
                      <th>Expected AS</th>
                      <th>Actual AS</th>
                      <th>Severity</th>
                      <th>Detected</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hijacks.map((hijack) => (
                      <tr key={hijack.id}>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-purple)', fontFamily: 'monospace' }}>{hijack.prefix}</code></td>
                        <td style={{ color: 'var(--accent-green)' }}>AS{hijack.expected_origin_as}</td>
                        <td style={{ color: 'var(--accent-red)' }}>AS{hijack.actual_origin_as}</td>
                        <td><StatusBadge status={hijack.severity} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {new Date(hijack.detected_at).toLocaleString()}
                        </td>
                        <td><StatusBadge status={hijack.status} /></td>
                        <td>
                          {hijack.status === 'active' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => void handleResolve(hijack.id)}
                              disabled={resolving === hijack.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <ShieldCheck size={12} />
                              {resolving === hijack.id ? 'Resolving…' : 'Resolve'}
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

export default BGP
