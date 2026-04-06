import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  /** Child components to render. */
  children: ReactNode
  /** Optional custom fallback UI. Defaults to a generic error message. */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React class-based error boundary.
 * Catches unhandled errors thrown during rendering of any child component
 * and displays a friendly fallback UI instead of an unresponsive blank page.
 *
 * @example
 * <ErrorBoundary>
 *   <SomePage />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

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
          <h2 style={{ color: 'var(--accent-red, #ef4444)', fontSize: 22, margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', textAlign: 'center', maxWidth: 420 }}>
            An unexpected error occurred while rendering this page. You can try
            refreshing or navigating back to the dashboard.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 11,
                background: 'var(--bg-secondary, #1e293b)',
                color: 'var(--text-muted, #64748b)',
                padding: '10px 16px',
                borderRadius: 8,
                maxWidth: 600,
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={this.handleReset}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
