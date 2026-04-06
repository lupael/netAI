import React from 'react'
import { Link } from 'react-router-dom'

/**
 * 404 Not Found page — displayed when a user navigates to an unknown route.
 */
const NotFound: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 16,
      }}
    >
      <span style={{ fontSize: 72, lineHeight: 1 }}>🔍</span>
      <h1 style={{ fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        404
      </h1>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)', margin: 0 }}>
        Page not found
      </p>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: 380,
        }}
      >
        The page you're looking for doesn't exist or has been moved. Check the
        URL or navigate back to the dashboard.
      </p>
      <Link
        to="/"
        className="btn btn-primary"
        style={{ marginTop: 8, textDecoration: 'none' }}
      >
        Back to Dashboard
      </Link>
    </div>
  )
}

export default NotFound
