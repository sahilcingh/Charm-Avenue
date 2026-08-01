'use client';
import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent, CSSProperties } from 'react';

// Clicking the status <select> (or any control inside it) must not also
// navigate the row, so its wrapper stops the click from bubbling up.
export function StopPropagation({ children }: { children: ReactNode }) {
  return <div onClick={(e: MouseEvent) => e.stopPropagation()}>{children}</div>;
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
  return (
    <tr
      onClick={() => router.push(`/admin/orders/${orderId}`)}
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
  return (
    <div
      onClick={() => router.push(`/admin/orders/${orderId}`)}
      className={`${className ?? ''} cursor-pointer`}
      style={style}
    >
      {children}
    </div>
  );
}
