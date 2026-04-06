import React, { useEffect, useState } from 'react'
import { Bell, Wifi, WifiOff } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  alertCount?: number
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, alertCount = 0 }) => {
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    // Attempt WS ping to check connectivity
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/status`)
      ws.onopen = () => setWsConnected(true)
      ws.onerror = () => setWsConnected(false)
      ws.onclose = () => setWsConnected(false)
      return () => ws.close()
    } catch {
      setWsConnected(false)
    }
  }, [])

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* WS status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: wsConnected ? 'var(--accent-green-dim)' : 'rgba(156,163,175,0.1)',
            border: `1px solid ${wsConnected ? 'rgba(16,185,129,0.25)' : 'rgba(156,163,175,0.2)'}`,
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            color: wsConnected ? 'var(--accent-green)' : 'var(--text-muted)',
          }}
        >
          {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {wsConnected ? 'Live' : 'Offline'}
        </div>

        {/* Alert bell */}
        <button
          style={{
            position: 'relative',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Notifications"
        >
          <Bell size={16} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: 'var(--accent-red)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
