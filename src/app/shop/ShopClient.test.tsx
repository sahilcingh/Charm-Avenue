import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ShopClient from './ShopClient';
import type { Product } from '@/lib/supabase/product-mapper';

vi.mock('@/components/ProductCard', () => ({
  default: ({ product }: { product: Product }) => <div>{product.name}</div>,
}));

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: overrides.name ?? 'p1',
    slug: 'slug',
    name: 'Product',
    categorySlug: 'cat',
    category: 'Category',
    price: 100,
    image: '/img.jpg',
    imageAlt: 'alt',
    emoji: '✨',
    description: 'desc',
    rating: 5,
    reviewCount: 1,
    personalizationEnabled: false,
    personalizationLabel: null,
    personalizationRequired: false,
    personalizationMaxLength: null,
    saleStartsAt: null,
    saleEndsAt: null,
    stockStatus: null,
    madeToOrderLeadTime: null,
    lowStockThreshold: null,
    stockCount: null,
    dimensions: null,
    material: null,
    careInstructions: null,
    colorVariants: [],
    isNewArrival: false,
    isBestSeller: false,
    ...overrides,
  };
}

const products: Product[] = [
  makeProduct({ id: '1', name: 'Classic Clip' }),
  makeProduct({ id: '2', name: 'Fresh Drop', isNewArrival: true }),
  makeProduct({ id: '3', name: 'Top Seller Bag', isBestSeller: true }),
];

describe('ShopClient — filter routing', () => {
  it('shows every product for the default "all" filter', () => {
    render(<ShopClient initialFilter="all" products={products} categories={[]} />);
    expect(screen.getByText('Classic Clip')).toBeInTheDocument();
    expect(screen.getByText('Fresh Drop')).toBeInTheDocument();
    expect(screen.getByText('Top Seller Bag')).toBeInTheDocument();
  });

  it('shows only products with isNewArrival for the "new" filter, regardless of badge text', () => {
    render(<ShopClient initialFilter="new" products={products} categories={[]} />);
    expect(screen.getByText('Fresh Drop')).toBeInTheDocument();
    expect(screen.queryByText('Classic Clip')).not.toBeInTheDocument();
    expect(screen.queryByText('Top Seller Bag')).not.toBeInTheDocument();
  });

  it('shows only products with isBestSeller for the "bestseller" filter (Best Sellers nav link)', () => {
    render(<ShopClient initialFilter="bestseller" products={products} categories={[]} />);
    expect(screen.getByText('Top Seller Bag')).toBeInTheDocument();
    expect(screen.queryByText('Classic Clip')).not.toBeInTheDocument();
    expect(screen.queryByText('Fresh Drop')).not.toBeInTheDocument();
  });
});
