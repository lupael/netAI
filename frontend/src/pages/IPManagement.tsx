import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'

interface Subnet {
  id: string
  cidr: string
  description: string
  vlan: number
  total_ips: number
  assigned: number
  free: number
  utilization_pct: number
  gateway: string
  status: string
}

interface IPAssignment {
  id: string
  ip: string
  hostname: string
  device_id: string
  vlan: number
  mac: string
  status: string
}

const MOCK_SUBNETS: Subnet[] = [
  { id: 'subnet-001', cidr: '10.0.0.0/24', description: 'DC1 Core Infrastructure', vlan: 10, total_ips: 254, assigned: 48, free: 206, utilization_pct: 18.9, gateway: '10.0.0.1', status: 'active' },
  { id: 'subnet-002', cidr: '10.0.1.0/24', description: 'DC1 Server Farm', vlan: 20, total_ips: 254, assigned: 192, free: 62, utilization_pct: 75.6, gateway: '10.0.1.1', status: 'active' },
  { id: 'subnet-003', cidr: '10.0.2.0/24', description: 'DC1 Workstations', vlan: 30, total_ips: 254, assigned: 210, free: 44, utilization_pct: 82.7, gateway: '10.0.2.1', status: 'active' },
  { id: 'subnet-004', cidr: '192.168.1.0/24', description: 'Edge Network / DMZ', vlan: 100, total_ips: 254, assigned: 12, free: 242, utilization_pct: 4.7, gateway: '192.168.1.1', status: 'active' },
  { id: 'subnet-005', cidr: '172.16.0.0/24', description: 'Management Network', vlan: 999, total_ips: 254, assigned: 25, free: 229, utilization_pct: 9.8, gateway: '172.16.0.1', status: 'active' },
]

const MOCK_ASSIGNMENTS: IPAssignment[] = [
  { id: 'ip-001', ip: '10.0.0.1', hostname: 'core-router-01', device_id: 'dev-001', vlan: 10, mac: '00:1A:2B:3C:4D:01', status: 'active' },
  { id: 'ip-002', ip: '10.0.0.2', hostname: 'core-router-02', device_id: 'dev-002', vlan: 10, mac: '00:1A:2B:3C:4D:02', status: 'active' },
  { id: 'ip-003', ip: '192.168.1.1', hostname: 'edge-router-01', device_id: 'dev-003', vlan: 100, mac: '00:1A:2B:3C:4D:03', status: 'active' },
  { id: 'ip-004', ip: '192.168.1.2', hostname: 'edge-router-02', device_id: 'dev-004', vlan: 100, mac: '00:1A:2B:3C:4D:04', status: 'degraded' },
  { id: 'ip-005', ip: '10.0.0.10', hostname: 'dist-sw-01', device_id: 'dev-005', vlan: 10, mac: '00:1A:2B:3C:4D:05', status: 'active' },
  { id: 'ip-006', ip: '10.0.0.11', hostname: 'dist-sw-02', device_id: 'dev-006', vlan: 10, mac: '00:1A:2B:3C:4D:06', status: 'active' },
  { id: 'ip-007', ip: '10.0.0.12', hostname: 'access-sw-01', device_id: 'dev-007', vlan: 10, mac: '00:1A:2B:3C:4D:07', status: 'active' },
  { id: 'ip-008', ip: '10.0.0.13', hostname: 'access-sw-02', device_id: 'dev-008', vlan: 10, mac: '00:1A:2B:3C:4D:08', status: 'active' },
  { id: 'ip-009', ip: '10.0.0.14', hostname: 'access-sw-03', device_id: 'dev-009', vlan: 10, mac: '00:1A:2B:3C:4D:09', status: 'offline' },
  { id: 'ip-010', ip: '10.0.0.15', hostname: 'access-sw-04', device_id: 'dev-010', vlan: 10, mac: '00:1A:2B:3C:4D:10', status: 'active' },
  { id: 'ip-011', ip: '10.0.0.20', hostname: 'firewall-01', device_id: 'dev-011', vlan: 10, mac: '00:1A:2B:3C:4D:11', status: 'active' },
  { id: 'ip-012', ip: '172.16.0.50', hostname: 'mgmt-server', device_id: 'dev-012', vlan: 999, mac: '00:1A:2B:3C:4D:12', status: 'active' },
  { id: 'ip-013', ip: '172.16.0.51', hostname: 'nms-server', device_id: 'dev-013', vlan: 999, mac: '00:1A:2B:3C:4D:13', status: 'active' },
  { id: 'ip-014', ip: '172.16.0.52', hostname: 'siem-server', device_id: 'dev-014', vlan: 999, mac: '00:1A:2B:3C:4D:14', status: 'active' },
  { id: 'ip-015', ip: '10.0.0.30', hostname: 'wan-router-01', device_id: 'dev-015', vlan: 10, mac: '00:1A:2B:3C:4D:15', status: 'active' },
]

const utilizationColor = (pct: number): string => {
  if (pct >= 85) return 'var(--accent-red)'
  if (pct >= 70) return 'var(--accent-yellow)'
  return 'var(--accent-green)'
}

const IPManagement: React.FC = () => {
  const [subnets, setSubnets] = useState<Subnet[]>(MOCK_SUBNETS)
  const [assignments, setAssignments] = useState<IPAssignment[]>(MOCK_ASSIGNMENTS)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, assignRes] = await Promise.all([
        client.get<Subnet[]>('/api/ip/subnets'),
        client.get<IPAssignment[]>('/api/ip/assignments'),
      ])
      setSubnets(subRes.data)
      setAssignments(assignRes.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const totalAssigned = subnets.reduce((s, n) => s + n.assigned, 0)
  const totalFree = subnets.reduce((s, n) => s + n.free, 0)
  const totalIPs = subnets.reduce((s, n) => s + n.total_ips, 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="IP Management" subtitle="IP address & VLAN assignments" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Subnets', val: subnets.length, color: 'var(--accent-blue)' },
                { label: 'Total IPs', val: totalIPs.toLocaleString(), color: 'var(--text-primary)' },
                { label: 'Assigned', val: totalAssigned.toLocaleString(), color: 'var(--accent-yellow)' },
                { label: 'Free', val: totalFree.toLocaleString(), color: 'var(--accent-green)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="card mb-6">
              <p className="card-title">Subnet Utilization</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>CIDR</th>
                      <th>Description</th>
                      <th>VLAN</th>
                      <th>Gateway</th>
                      <th>Total IPs</th>
                      <th>Assigned</th>
                      <th>Free</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subnets.map((subnet) => (
                      <tr key={subnet.id}>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{subnet.cidr}</code></td>
                        <td style={{ color: 'var(--text-primary)' }}>{subnet.description}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>VLAN {subnet.vlan}</td>
                        <td><code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{subnet.gateway}</code></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{subnet.total_ips}</td>
                        <td style={{ color: 'var(--accent-yellow)' }}>{subnet.assigned}</td>
                        <td style={{ color: 'var(--accent-green)' }}>{subnet.free}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${subnet.utilization_pct}%`, background: utilizationColor(subnet.utilization_pct) }}
                              />
                            </div>
                            <span style={{ fontSize: 12, color: utilizationColor(subnet.utilization_pct), fontWeight: 600 }}>
                              {subnet.utilization_pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <p className="card-title">IP Assignments</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Hostname</th>
                      <th>Device ID</th>
                      <th>VLAN</th>
                      <th>MAC Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td><code style={{ fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{a.ip}</code></td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.hostname}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.device_id}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>VLAN {a.vlan}</td>
                        <td><code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.mac}</code></td>
                        <td><StatusBadge status={a.status} /></td>
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

export default IPManagement
