import React from 'react';
import i18n from '../../i18n';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Itt lehet logolni vagy hibát jelenteni
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            role="alert"
            aria-live="polite"
            style={{ padding: 16, background: '#f8d7da', color: '#721c24', borderRadius: 8 }}
          >
            <strong>
              {i18n.t('errorBoundary.message', 'An error occurred while rendering content.')}
            </strong>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
