import React from 'react'
import type { SeverityLevel, DeviceStatus } from '../types'

type BadgeVariant = SeverityLevel | DeviceStatus | string

interface StatusBadgeProps {
  status: BadgeVariant
  label?: string
}

const variantMap: Record<string, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
  info: 'badge-info',
  healthy: 'badge-healthy',
  warning: 'badge-warning',
  degraded: 'badge-degraded',
  down: 'badge-down',
  unknown: 'badge-info',
  active: 'badge-critical',
  mitigated: 'badge-healthy',
  investigating: 'badge-medium',
  false_positive: 'badge-info',
  compliant: 'badge-healthy',
  non_compliant: 'badge-critical',
  current: 'badge-healthy',
  update_available: 'badge-medium',
  critical_update: 'badge-critical',
  end_of_life: 'badge-high',
  up: 'badge-healthy',
  pending: 'badge-info',
  in_progress: 'badge-medium',
  completed: 'badge-healthy',
  failed: 'badge-critical',
  cancelled: 'badge-info',
}

const dotColors: Record<string, string> = {
  'badge-critical': '#ef4444',
  'badge-high': '#f97316',
  'badge-medium': '#f59e0b',
  'badge-low': '#3b82f6',
  'badge-info': '#9ca3af',
  'badge-healthy': '#10b981',
  'badge-warning': '#f59e0b',
  'badge-degraded': '#f97316',
  'badge-down': '#ef4444',
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const cls = variantMap[status] ?? 'badge-info'
  const dot = dotColors[cls] ?? '#9ca3af'

  return (
    <span className={`badge ${cls}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}

export default StatusBadge
