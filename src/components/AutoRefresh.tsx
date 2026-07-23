'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Periodically re-fetches the enclosing Server Component's data via
 * router.refresh() — for pages where the underlying data can change from
 * elsewhere (a customer's order status changing, a new WhatsApp enquiry
 * coming in) and the page should catch up without a manual reload.
 *
 * Skips ticks while the tab is hidden/backgrounded (no point re-querying
 * something nobody's looking at), and refreshes immediately the moment the
 * tab becomes visible again, so a stale background tab catches up instantly
 * rather than waiting out the rest of the interval.
 */
export default function AutoRefresh({ intervalMs = 25000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') router.refresh();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
}
