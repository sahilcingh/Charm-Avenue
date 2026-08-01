'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent, KeyboardEvent, CSSProperties } from 'react';

// Clicking the status <select> (or any control inside it) must not also
// navigate the row, so its wrapper stops the click from bubbling up.
export function StopPropagation({ children }: { children: ReactNode }) {
  return <div onClick={(e: MouseEvent) => e.stopPropagation()}>{children}</div>;
}

// Enter and Space both activate a native link/button — matched here since
// the row/card stands in for one, and a keyboard-only or screen-reader admin
// otherwise has no way to open an order at all (there's no <a>/<Link>
// anywhere inside; the status <select> is the only other focusable control,
// and it deliberately stops this element's own click from firing).
function handleActivationKey(e: KeyboardEvent, activate: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    activate();
  }
}

export function OrderRow({
  orderId,
  className,
  style,
  children,
}: {
  orderId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const navigate = () => router.push(`/admin/orders/${orderId}`);
  return (
    <tr
      onClick={navigate}
      onKeyDown={(e) => handleActivationKey(e, navigate)}
      role="link"
      tabIndex={0}
      aria-label={`View order #${orderId.slice(0, 8)}`}
      className={`${className ?? ''} cursor-pointer`}
      style={style}
    >
      {children}
    </tr>
  );
}

export function OrderCard({
  orderId,
  className,
  style,
  children,
}: {
  orderId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const navigate = () => router.push(`/admin/orders/${orderId}`);
  return (
    <div
      onClick={navigate}
      onKeyDown={(e) => handleActivationKey(e, navigate)}
      role="link"
      tabIndex={0}
      aria-label={`View order #${orderId.slice(0, 8)}`}
      className={`${className ?? ''} cursor-pointer`}
      style={style}
    >
      {children}
    </div>
  );
}
