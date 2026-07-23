'use client';
import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client-error';
import './../styles/tailwind.css';

/**
 * Catches errors thrown by the root layout itself (e.g. a context provider
 * mounted in app/layout.tsx) — a plain error boundary placed inside the
 * layout's own JSX can't catch errors in the layout's ancestors, so this
 * special Next.js file is the only thing that can. Renders its own <html>/
 * <body> since it replaces the entire root layout when it activates, and
 * deliberately avoids depending on the same providers/fonts that may have
 * been part of what broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: 'app/global-error.tsx' });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--blush-bg, #FBF1EF)',
          }}
        >
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>💔</span>
          <h1
            style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              color: 'var(--blush-text, #1E1712)',
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              color: 'var(--blush-muted, #9C6D74)',
            }}
          >
            We&apos;ve been notified and we&apos;re on it. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#FFFFFF',
              background: 'var(--blush-rose, #E8828F)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}
