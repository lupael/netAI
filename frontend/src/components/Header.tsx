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
    // Connect to backend WebSocket with JWT token authentication.
    // Retries every 3 s when no token is present yet (e.g. user hasn't logged in)
    // and also reconnects when a token is written from another tab (storage event).
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_HOST ?? window.location.host
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      if (disposed) return
      const token = localStorage.getItem('netai_token')
      if (!token) {
        // No token yet — retry after 3 s (e.g. waiting for user to log in)
        reconnectTimer = setTimeout(connect, 3000)
        return
      }
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
      try {
        ws = new WebSocket(wsUrl)
        ws.onopen = () => { if (!disposed) setWsConnected(true) }
        ws.onerror = () => { if (!disposed) setWsConnected(false) }
        ws.onclose = () => {
          if (disposed) return
          setWsConnected(false)
          // Reconnect after 5 s only if still mounted
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch {
        if (!disposed) setWsConnected(false)
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    // Listen for token written from another tab (cross-tab storage event)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'netai_token' && e.newValue && (!ws || ws.readyState === WebSocket.CLOSED)) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        connect()
      }
    }

    window.addEventListener('storage', handleStorage)
    connect()
    return () => {
      disposed = true
      window.removeEventListener('storage', handleStorage)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws) {
        // Remove handlers before closing to prevent onclose from scheduling a reconnect
        ws.onopen = null
        ws.onerror = null
        ws.onclose = null
        ws.close()
      }
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
