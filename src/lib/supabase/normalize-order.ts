import type { DbOrder, DbOrderItem } from './types';

/**
 * PostgREST serializes Postgres `numeric` columns (subtotal, discount_total,
 * unit_price) as JSON strings, not numbers, to avoid float precision loss —
 * even though DbOrder/DbOrderItem type them as `number`. Coercing right after
 * a fetch is what makes that typing actually true for every caller, instead
 * of leaving a landmine where `+` silently string-concatenates instead of
 * adding (see the orders list Revenue stat, which hit exactly this).
 */
export function normalizeOrder<T extends Pick<DbOrder, 'subtotal' | 'discount_total'>>(
  order: T
): T {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
  };
}

export function normalizeOrderItem<T extends Pick<DbOrderItem, 'unit_price'>>(item: T): T {
  return { ...item, unit_price: Number(item.unit_price) };
}
