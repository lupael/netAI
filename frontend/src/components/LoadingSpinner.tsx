import React from 'react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  fullPage?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 32,
  color = 'var(--accent-blue)',
  fullPage = false,
}) => {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(59,130,246,0.15)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10,14,26,0.8)',
          zIndex: 9999,
        }}
      >
        {spinner}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      {spinner}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

export default LoadingSpinner
