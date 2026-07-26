import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HomepageSection from './HomepageSection';
import type { Product } from '@/lib/supabase/product-mapper';

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

vi.mock('@/components/ProductCard', () => ({
  default: ({ product }: { product: Product }) => <div>{product.name}</div>,
}));

vi.mock('@/lib/cart-context', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({ showToast: vi.fn() }),
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

const products = [
  makeProduct({ id: '1', name: 'Cute Clip' }),
  makeProduct({ id: '2', name: 'Tiny Bag' }),
];

describe('HomepageSection — grid layout', () => {
  it('renders the admin-set title, eyebrow, and subtitle', () => {
    render(
      <HomepageSection
        title="Impulse Buys You Need"
        eyebrowEmoji="🏷️"
        eyebrowLabel="Budget Friendly"
        subtitle="Because cute shouldn't cost a fortune."
        layout="grid"
        products={products}
      />
    );

    expect(screen.getByText('Impulse Buys You Need')).toBeInTheDocument();
    expect(screen.getByText(/Budget Friendly/)).toBeInTheDocument();
    expect(screen.getByText(/Because cute shouldn't cost a fortune/)).toBeInTheDocument();
    expect(screen.getByText('Cute Clip')).toBeInTheDocument();
    expect(screen.getByText('Tiny Bag')).toBeInTheDocument();
  });

  it('shows an empty-state message instead of an empty grid when the admin has curated no products yet', () => {
    render(
      <HomepageSection
        title="New Section"
        eyebrowEmoji="✨"
        eyebrowLabel="Featured"
        subtitle={null}
        layout="grid"
        products={[]}
      />
    );

    expect(screen.getByText(/No items in this section yet/)).toBeInTheDocument();
  });
});

describe('HomepageSection — carousel layout', () => {
  it('renders the admin-set title and eyebrow, plus every curated product as a link', () => {
    render(
      <HomepageSection
        title="Shop the Aesthetic"
        eyebrowEmoji="📸"
        eyebrowLabel="Charm Feed"
        subtitle={null}
        layout="carousel"
        products={products}
      />
    );

    expect(screen.getByText('Shop the Aesthetic')).toBeInTheDocument();
    expect(screen.getByText(/Charm Feed/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cute Clip/ })).toHaveAttribute(
      'href',
      '/product/slug'
    );
  });

  it('renders nothing at all when the admin has curated no products yet (avoids an empty floating header)', () => {
    const { container } = render(
      <HomepageSection
        title="Empty Carousel"
        eyebrowEmoji="✨"
        eyebrowLabel="Featured"
        subtitle={null}
        layout="carousel"
        products={[]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
