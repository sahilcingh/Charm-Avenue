import type { Product } from './product-mapper';

/** Matches on name and category only — description text is excluded to avoid noisy/incidental matches. */
export function filterProductsBySearch(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}
