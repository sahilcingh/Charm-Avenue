'use client';
import React, { useTransition } from 'react';
import type { OrderStatus } from '@/lib/supabase/types';
import { ORDER_STATUS_LABELS } from '@/lib/order-status';
import Icon from '@/components/ui/AppIcon';
import { updateOrderStatus } from './actions';

const STATUS_OPTIONS: OrderStatus[] = ['pending_whatsapp', 'pending_payment', 'paid', 'cancelled'];

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const current = ORDER_STATUS_LABELS[status];

  return (
    <div className="relative inline-flex items-center">
      <span
        className="absolute left-3 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: current.color }}
      />
      <select
        value={status}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => updateOrderStatus(orderId, e.target.value as OrderStatus))
        }
        className="appearance-none text-xs font-semibold rounded-full pl-6 pr-7 py-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        style={{
          background: current.bg,
          color: current.color,
          border: `1px solid ${current.border}`,
        }}
        aria-label={`Change status for order ${orderId.slice(0, 8)}`}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {ORDER_STATUS_LABELS[option].label}
          </option>
        ))}
      </select>
      <Icon
        name="ChevronDownIcon"
        size={11}
        className="absolute right-2.5 pointer-events-none"
        style={{ color: current.color }}
      />
    </div>
  );
}
