import { describe, it, expect } from 'vitest';
import { filterProductsBySearch } from './product-search';
import type { Product } from './product-mapper';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'panda-lamp',
    name: 'Panda Lamp',
    categorySlug: 'gifts-novelty',
    category: 'Gifts & Novelty',
    price: 130,
    image: '/assets/images/no_image.png',
    imageAlt: 'Panda Lamp',
    emoji: '🐼',
    description: 'A cute panda-shaped lamp.',
    rating: 4.5,
    reviewCount: 0,
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
    ...overrides,
  };
}

describe('filterProductsBySearch', () => {
  it('matches a product whose name contains the query, case-insensitively', () => {
    const products = [makeProduct({ name: 'Panda Lamp' })];
    expect(filterProductsBySearch(products, 'panda')).toEqual(products);
    expect(filterProductsBySearch(products, 'PANDA')).toEqual(products);
  });

  it('matches a product whose category contains the query', () => {
    const products = [makeProduct({ category: 'Gifts & Novelty' })];
    expect(filterProductsBySearch(products, 'novelty')).toEqual(products);
  });

  it('does not match on description text alone', () => {
    const products = [
      makeProduct({ name: 'Panda Lamp', description: 'A cute panda-shaped lamp.' }),
    ];
    expect(filterProductsBySearch(products, 'shaped')).toEqual([]);
  });

  it('excludes a product that matches neither name nor category', () => {
    const products = [makeProduct({ name: 'Panda Lamp', category: 'Gifts & Novelty' })];
    expect(filterProductsBySearch(products, 'keychain')).toEqual([]);
  });

  it('returns an empty array for a blank/whitespace-only query (edge case)', () => {
    const products = [makeProduct()];
    expect(filterProductsBySearch(products, '')).toEqual([]);
    expect(filterProductsBySearch(products, '   ')).toEqual([]);
  });

  it('trims surrounding whitespace from the query before matching', () => {
    const products = [makeProduct({ name: 'Panda Lamp' })];
    expect(filterProductsBySearch(products, '  panda  ')).toEqual(products);
  });

  it('matches multiple products out of a larger list', () => {
    const products = [
      makeProduct({ id: 'p1', name: 'Panda Lamp' }),
      makeProduct({ id: 'p2', name: 'Panda Keychain', slug: 'panda-keychain' }),
      makeProduct({ id: 'p3', name: 'Water Bottle', slug: 'water-bottle' }),
    ];
    const result = filterProductsBySearch(products, 'panda');
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});
