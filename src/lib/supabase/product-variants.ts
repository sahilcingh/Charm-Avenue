import type { ProductStockStatus } from './types';

// Mirrors the amber/green/grey semantic scheme already established for
// order statuses (src/lib/order-status.ts) and the admin product table.
export const STOCK_STATUS_LABELS: Record<
  ProductStockStatus,
  { label: string; color: string; bg: string }
> = {
  in_stock: { label: 'In Stock', color: '#2E7D32', bg: '#E8F5E9' },
  out_of_stock: { label: 'Out of Stock', color: '#A6740A', bg: '#FBEBCF' },
  made_to_order: { label: 'Made to Order', color: '#A6740A', bg: '#FBEBCF' },
  discontinued: { label: 'Discontinued', color: '#8A7A75', bg: '#EFE6E2' },
};

export interface ResolvedVariantDisplay {
  price: number;
  originalPrice: number | null;
  image: string;
  stockStatus: ProductStockStatus | null;
  stockCount: number | null;
}

interface VariantOverrides {
  price_override: number | null;
  original_price_override: number | null;
  image: string | null;
  stock_status: ProductStockStatus | null;
  stock_count: number | null;
}

/**
 * Once a product has variants, stock is fully authoritative per-variant —
 * there's deliberately no fallback to the product's own stock fields here
 * (a variant with stock_status null just means "not tracking stock for
 * this specific variant," not "check the product instead").
 */
/** e.g. "Red / M", or just "Red" / just "M" if only one axis is used. */
export function formatVariantLabel(variant: {
  color: string | null;
  size: string | null;
}): string | null {
  const parts = [variant.color, variant.size].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' / ') : null;
}

export function resolveVariantDisplay(
  base: { price: number; originalPrice: number | null; image: string },
  variant: VariantOverrides | null
): ResolvedVariantDisplay {
  if (!variant) {
    return {
      price: base.price,
      originalPrice: base.originalPrice,
      image: base.image,
      stockStatus: null,
      stockCount: null,
    };
  }
  return {
    price: variant.price_override ?? base.price,
    originalPrice: variant.original_price_override ?? base.originalPrice,
    image: variant.image ?? base.image,
    stockStatus: variant.stock_status,
    stockCount: variant.stock_count,
  };
}
