'use client';
import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client-error';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { digest: error.digest, boundary: 'app/error.tsx' });
  }, [error]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: 'var(--blush-bg)' }}
    >
      <span className="text-4xl block mb-4">💔</span>
      <h1 className="font-elegant-serif text-2xl mb-2" style={{ color: 'var(--blush-text)' }}>
        Something went wrong.
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--blush-muted)' }}>
        We&apos;ve been notified and we&apos;re on it. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-transform hover:scale-105"
        style={{ background: 'var(--blush-rose)' }}
      >
        Try Again
      </button>
    </main>
  );
}
