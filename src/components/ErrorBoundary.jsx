import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error safely without sensitive data
    console.error('ErrorBoundary caught rendering exception:', {
      timestamp: new Date().toISOString(),
      message: error?.message || 'Unknown error',
      componentStack: errorInfo?.componentStack || ''
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '32px 20px',
          margin: '16px auto',
          maxWidth: '500px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--border-color, #f1f5f9)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertTriangle size={28} />
          </div>

          <div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-main, #0f172a)'
            }}>
              {this.props.title || 'Something went wrong'}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-muted, #64748b)',
              lineHeight: '1.5'
            }}>
              {this.props.message || 'An unexpected error occurred in this section. Tap below to retry or reload.'}
            </p>
          </div>

          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              backgroundColor: 'var(--primary-color, #0d9488)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              minHeight: '48px',
              minWidth: '140px',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={16} />
            <span>Tap to retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
