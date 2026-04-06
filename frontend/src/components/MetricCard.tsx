import React from 'react'
import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'
}

const colorMap = {
  blue: { bg: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: 'rgba(59,130,246,0.2)' },
  green: { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)', border: 'rgba(16,185,129,0.2)' },
  red: { bg: 'var(--accent-red-dim)', color: 'var(--accent-red)', border: 'rgba(239,68,68,0.2)' },
  yellow: { bg: 'var(--accent-yellow-dim)', color: 'var(--accent-yellow)', border: 'rgba(245,158,11,0.2)' },
  purple: { bg: 'var(--accent-purple-dim)', color: 'var(--accent-purple)', border: 'rgba(139,92,246,0.2)' },
  orange: { bg: 'var(--accent-orange-dim)', color: 'var(--accent-orange)', border: 'rgba(249,115,22,0.2)' },
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}) => {
  const c = colorMap[color]
  const trendPositive = trend && trend.value > 0
  const trendNeutral = trend && trend.value === 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          {title}
        </p>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: c.color,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <span
            style={{
              color: trendNeutral ? 'var(--text-muted)' : trendPositive ? 'var(--accent-green)' : 'var(--accent-red)',
              fontWeight: 600,
            }}
          >
            {trendPositive ? '▲' : trendNeutral ? '—' : '▼'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard
