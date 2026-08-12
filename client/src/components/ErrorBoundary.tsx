import React, { type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '16px',
            }}
          >
            🚨
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px', color: 'var(--color-danger)' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '500px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
