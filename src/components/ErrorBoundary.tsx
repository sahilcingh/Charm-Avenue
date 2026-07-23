'use client';
import React from 'react';
import { reportClientError } from '@/lib/report-client-error';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Generic error boundary for wrapping key page sections — if a descendant
 * throws during render, this shows a friendly fallback instead of taking the
 * whole page down, and reports the error so it's visible somewhere other than
 * a user's own screenshot.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportClientError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />;
    }
    return this.props.children;
  }
}

function DefaultFallback() {
  return (
    <div className="w-full py-12 px-6 text-center" style={{ background: 'var(--blush-bg)' }}>
      <span className="text-2xl block mb-2">💔</span>
      <p className="font-bold mb-1" style={{ color: 'var(--blush-text)' }}>
        Something went wrong.
      </p>
      <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
        Please refresh the page — we&apos;ve been notified.
      </p>
    </div>
  );
}
