/**
 * Reports a client-side error somewhere other than a user's own screen — logs
 * to the console for local/dev visibility, and best-effort POSTs to a small
 * server route so it lands in the deployment's function logs instead of only
 * ever being visible if an affected user happens to send a screenshot.
 *
 * Must never throw itself — a failure in error *reporting* must not become a
 * second, worse error on top of the one it's trying to report.
 */
export function reportClientError(error: unknown, context: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // eslint-disable-next-line no-console
  console.error('[client error]', message, context);

  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  }).catch(() => {
    // reporting failed too — nothing more we can safely do client-side
  });
}
