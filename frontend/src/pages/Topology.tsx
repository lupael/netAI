import React, { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { Topology, TopologyNode, TopologyLink, DeviceStatus } from '../types'
import { RefreshCw, X } from 'lucide-react'

// ---- Mock data ----
const MOCK_TOPOLOGY: Topology = {
  last_updated: new Date().toISOString(),
  nodes: [
    { id: 'core-01', hostname: 'core-sw-01', ip_address: '10.0.0.1', device_type: 'core_switch', status: 'healthy' },
    { id: 'core-02', hostname: 'core-sw-02', ip_address: '10.0.0.2', device_type: 'core_switch', status: 'healthy' },
    { id: 'dist-01', hostname: 'dist-sw-01', ip_address: '10.0.1.1', device_type: 'distribution_switch', status: 'healthy' },
    { id: 'dist-02', hostname: 'dist-sw-02', ip_address: '10.0.1.2', device_type: 'distribution_switch', status: 'warning' },
    { id: 'dist-03', hostname: 'dist-sw-03', ip_address: '10.0.1.3', device_type: 'distribution_switch', status: 'healthy' },
    { id: 'acc-01', hostname: 'access-sw-01', ip_address: '10.0.2.1', device_type: 'access_switch', status: 'healthy' },
    { id: 'acc-02', hostname: 'access-sw-02', ip_address: '10.0.2.2', device_type: 'access_switch', status: 'healthy' },
    { id: 'acc-03', hostname: 'access-sw-03', ip_address: '10.0.2.3', device_type: 'access_switch', status: 'degraded' },
    { id: 'acc-04', hostname: 'access-sw-04', ip_address: '10.0.2.4', device_type: 'access_switch', status: 'healthy' },
    { id: 'acc-05', hostname: 'access-sw-05', ip_address: '10.0.2.5', device_type: 'access_switch', status: 'down' },
    { id: 'edge-01', hostname: 'edge-router-01', ip_address: '10.0.0.254', device_type: 'router', status: 'healthy' },
    { id: 'wan-01', hostname: 'wan-router-01', ip_address: '203.0.113.1', device_type: 'router', status: 'healthy' },
    { id: 'fw-01', hostname: 'firewall-01', ip_address: '10.0.0.253', device_type: 'firewall', status: 'healthy' },
  ],
  links: [
    { source: 'wan-01', target: 'fw-01', bandwidth_mbps: 1000, utilization_pct: 45, status: 'active' },
    { source: 'fw-01', target: 'edge-01', bandwidth_mbps: 10000, utilization_pct: 30, status: 'active' },
    { source: 'edge-01', target: 'core-01', bandwidth_mbps: 10000, utilization_pct: 35, status: 'active' },
    { source: 'edge-01', target: 'core-02', bandwidth_mbps: 10000, utilization_pct: 28, status: 'active' },
    { source: 'core-01', target: 'core-02', bandwidth_mbps: 40000, utilization_pct: 15, status: 'active' },
    { source: 'core-01', target: 'dist-01', bandwidth_mbps: 10000, utilization_pct: 42, status: 'active' },
    { source: 'core-01', target: 'dist-02', bandwidth_mbps: 10000, utilization_pct: 68, status: 'degraded' },
    { source: 'core-02', target: 'dist-02', bandwidth_mbps: 10000, utilization_pct: 55, status: 'active' },
    { source: 'core-02', target: 'dist-03', bandwidth_mbps: 10000, utilization_pct: 33, status: 'active' },
    { source: 'dist-01', target: 'acc-01', bandwidth_mbps: 1000, utilization_pct: 22, status: 'active' },
    { source: 'dist-01', target: 'acc-02', bandwidth_mbps: 1000, utilization_pct: 38, status: 'active' },
    { source: 'dist-02', target: 'acc-03', bandwidth_mbps: 1000, utilization_pct: 77, status: 'degraded' },
    { source: 'dist-02', target: 'acc-04', bandwidth_mbps: 1000, utilization_pct: 19, status: 'active' },
    { source: 'dist-03', target: 'acc-05', bandwidth_mbps: 1000, utilization_pct: 0, status: 'down' },
  ],
}

// ---- Layout positions (percentage-based) ----
type NodePositions = Record<string, { x: number; y: number }>
const NODE_POSITIONS: NodePositions = {
  'wan-01':  { x: 50, y: 5 },
  'fw-01':   { x: 50, y: 16 },
  'edge-01': { x: 50, y: 27 },
  'core-01': { x: 35, y: 40 },
  'core-02': { x: 65, y: 40 },
  'dist-01': { x: 20, y: 57 },
  'dist-02': { x: 50, y: 57 },
  'dist-03': { x: 80, y: 57 },
  'acc-01':  { x: 10, y: 74 },
  'acc-02':  { x: 28, y: 74 },
  'acc-03':  { x: 43, y: 74 },
  'acc-04':  { x: 58, y: 74 },
  'acc-05':  { x: 80, y: 74 },
}

const STATUS_COLOR: Record<DeviceStatus, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  degraded: '#f97316',
  down: '#ef4444',
  unknown: '#9ca3af',
}

const LINK_STATUS_COLOR: Record<string, string> = {
  active: '#3b82f6',
  degraded: '#f59e0b',
  down: '#ef4444',
}

const DEVICE_ICON: Record<string, string> = {
  core_switch: '⬡',
  distribution_switch: '◈',
  access_switch: '⬡',
  router: '⬣',
  firewall: '⬟',
}

const Topology: React.FC = () => {
  const [topology, setTopology] = useState<Topology>(MOCK_TOPOLOGY)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TopologyNode | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 })

  const fetchTopology = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<Topology>('/api/topology')
      // Backend returns { devices, links, timestamp } — normalise to { nodes, links, last_updated }
      const raw = res.data
      const normalized: Topology = {
        nodes: raw.devices ?? raw.nodes ?? [],
        links: raw.links,
        last_updated: raw.timestamp ?? raw.last_updated ?? new Date().toISOString(),
      }
      setTopology(normalized)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchTopology() }, [fetchTopology])

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement)
    return () => obs.disconnect()
  }, [])

  const nodePos = (id: string) => {
    const p = NODE_POSITIONS[id] ?? { x: 50, y: 50 }
    return { x: (p.x / 100) * svgSize.w, y: (p.y / 100) * svgSize.h }
  }

  const getLink = (l: TopologyLink) => {
    const src = nodePos(l.source)
    const tgt = nodePos(l.target)
    return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Network Topology" subtitle="Live network map" />
      <div className="page-content">
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 180px)', minHeight: 500 }}>
          {/* SVG Map */}
          <div style={{ flex: 1, position: 'relative', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, zIndex: 2 }}>
              <button onClick={() => void fetchTopology()} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingSpinner size={36} />
              </div>
            ) : (
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ display: 'block' }}
                viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
                onMouseMove={() => {}}
              >
                {/* Defs */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Links */}
                {(topology.nodes ?? []).length > 0 && topology.links.map((link, i) => {
                  const pos = getLink(link)
                  const color = LINK_STATUS_COLOR[link.status] ?? '#3b82f6'
                  const isDegraded = link.status !== 'active'
                  return (
                    <g key={i}>
                      <line
                        x1={pos.x1} y1={pos.y1} x2={pos.x2} y2={pos.y2}
                        stroke={color}
                        strokeWidth={isDegraded ? 2 : 1.5}
                        strokeOpacity={isDegraded ? 0.9 : 0.4}
                        strokeDasharray={link.status === 'down' ? '6,4' : undefined}
                      />
                      {/* Utilization label */}
                      <text
                        x={(pos.x1 + pos.x2) / 2}
                        y={(pos.y1 + pos.y2) / 2 - 4}
                        fill={color}
                        fontSize={9}
                        textAnchor="middle"
                        fillOpacity={0.7}
                      >
                        {link.utilization_pct}%
                      </text>
                    </g>
                  )
                })}

                {/* Nodes */}
                {(topology.nodes ?? []).map((node) => {
                  const p = nodePos(node.id)
                  const color = STATUS_COLOR[node.status] ?? '#9ca3af'
                  const isSelected = selected?.id === node.id
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${p.x},${p.y})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected((s) => (s?.id === node.id ? null : node))}
                    >
                      {/* Glow ring for selected */}
                      {isSelected && (
                        <circle r={26} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.5} filter="url(#glow)" />
                      )}
                      {/* Node background */}
                      <circle
                        r={20}
                        fill="var(--bg-card)"
                        stroke={color}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeOpacity={isSelected ? 1 : 0.8}
                      />
                      {/* Device type icon */}
                      <text textAnchor="middle" dy="0.35em" fontSize={14} fill={color}>
                        {DEVICE_ICON[node.device_type] ?? '●'}
                      </text>
                      {/* Status dot */}
                      <circle cx={14} cy={-14} r={5} fill={color} stroke="var(--bg-secondary)" strokeWidth={1.5} />
                      {/* Hostname label */}
                      <text textAnchor="middle" dy={34} fontSize={10} fill="#9ca3af" fontFamily="monospace">
                        {node.hostname.length > 14 ? node.hostname.slice(0, 13) + '…' : node.hostname}
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Legend */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 12, background: 'rgba(10,14,26,0.85)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              {Object.entries(STATUS_COLOR).filter(([s]) => s !== 'unknown').map(([status, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card" style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{selected.hostname}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{selected.ip_address}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="divider" />

              {[
                { label: 'Status', val: <StatusBadge status={selected.status} /> },
                { label: 'Device Type', val: selected.device_type.replace(/_/g, ' ') },
                { label: 'Node ID', val: selected.id },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
                </div>
              ))}

              <div className="divider" />

              {/* Connections */}
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connections</p>
              {topology.links
                .filter((l) => l.source === selected.id || l.target === selected.id)
                .map((l, i) => {
                  const peer = l.source === selected.id ? l.target : l.source
                  const peerNode = (topology.nodes ?? []).find((n) => n.id === peer)
                  return (
                    <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{peerNode?.hostname ?? peer}</span>
                        <StatusBadge status={l.status} />
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        {l.bandwidth_mbps >= 1000 ? `${l.bandwidth_mbps / 1000}G` : `${l.bandwidth_mbps}M`} · {l.utilization_pct}% util
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Topology
