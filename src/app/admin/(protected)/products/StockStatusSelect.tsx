'use client';
import { useState, useTransition } from 'react';
import type { ProductStockStatus } from '@/lib/supabase/types';
import { STOCK_STATUS_LABELS } from '@/lib/supabase/product-variants';
import { updateProductStockStatus } from './actions';

const OPTIONS: ProductStockStatus[] = ['in_stock', 'out_of_stock', 'made_to_order', 'discontinued'];

export default function StockStatusSelect({
  productId,
  initialStatus,
}: {
  productId: string;
  initialStatus: ProductStockStatus | null;
}) {
  const [status, setStatus] = useState<ProductStockStatus>(initialStatus ?? 'in_stock');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { color, bg } = STOCK_STATUS_LABELS[status];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ProductStockStatus;
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateProductStockStatus(productId, next);
      } catch (err) {
        setStatus(previous);
        setError(err instanceof Error ? err.message : 'Could not update stock status.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Stock status"
        className="rounded-full pl-2.5 pr-6 py-1 text-xs font-semibold border-0 cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-wait"
        style={{
          backgroundColor: bg,
          color,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%238A7A75'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          backgroundSize: '0.9em',
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {STOCK_STATUS_LABELS[opt].label}
          </option>
        ))}
      </select>
      {error && (
        <p
          className="text-[11px] font-medium max-w-[8rem]"
          style={{ color: 'var(--blush-rose-dark)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
