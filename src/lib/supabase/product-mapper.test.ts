import { describe, it, expect } from 'vitest';
import { mapCategoryRow, mapProductRow } from './product-mapper';
import type { DbCategory, DbProduct } from './types';

const dbCategory: DbCategory = {
  slug: 'jewellery',
  title: 'Anti-Tarnish Jewellery',
  subtitle: 'Rings · Bracelets',
  emoji: '💍',
  tag: 'Best Seller',
  image: '/img.jpg',
  image_alt: 'alt text',
  tag_bg: '#E8828F',
  tag_text: '#FFFFFF',
  description: 'desc',
  sort_order: 1,
};

const dbProduct: DbProduct = {
  id: 'uuid-1',
  slug: 'dainty-star-ring',
  name: 'Dainty Star Ring',
  category_slug: 'jewellery',
  price: 299,
  original_price: 499,
  image: '/product.jpg',
  image_alt: 'product alt',
  tag: 'Hot',
  tag_bg: '#E8828F',
  tag_text: '#FFFFFF',
  emoji: '⭐',
  description: 'A dainty ring.',
  rating: 4.8,
  review_count: 214,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  sale_starts_at: null,
  sale_ends_at: null,
  dimensions: null,
  material: null,
  care_instructions: null,
  stock_status: null,
  made_to_order_lead_time: null,
  low_stock_threshold: null,
  stock_count: null,
  personalization_enabled: false,
  personalization_label: null,
  personalization_required: false,
  personalization_max_length: null,
};

describe('mapCategoryRow', () => {
  it('maps a full db category row to the app-facing Category shape', () => {
    expect(mapCategoryRow(dbCategory)).toEqual({
      slug: 'jewellery',
      title: 'Anti-Tarnish Jewellery',
      subtitle: 'Rings · Bracelets',
      emoji: '💍',
      tag: 'Best Seller',
      image: '/img.jpg',
      imageAlt: 'alt text',
      tagBg: '#E8828F',
      tagText: '#FFFFFF',
      description: 'desc',
    });
  });
});

describe('mapProductRow', () => {
  it('maps a full db product row, using the provided category title', () => {
    expect(mapProductRow(dbProduct, 'Anti-Tarnish Jewellery')).toEqual({
      id: 'uuid-1',
      slug: 'dainty-star-ring',
      name: 'Dainty Star Ring',
      categorySlug: 'jewellery',
      category: 'Anti-Tarnish Jewellery',
      price: 299,
      originalPrice: 499,
      image: '/product.jpg',
      imageAlt: 'product alt',
      tag: 'Hot',
      tagBg: '#E8828F',
      tagText: '#FFFFFF',
      emoji: '⭐',
      description: 'A dainty ring.',
      rating: 4.8,
      reviewCount: 214,
      personalizationEnabled: false,
      personalizationLabel: null,
      personalizationRequired: false,
      personalizationMaxLength: null,
      saleStartsAt: null,
      saleEndsAt: null,
      dimensions: null,
      material: null,
      careInstructions: null,
      stockStatus: null,
      madeToOrderLeadTime: null,
      lowStockThreshold: null,
      stockCount: null,
    });
  });

  it('omits originalPrice when the row has none (not shown as a fake discount)', () => {
    const row = { ...dbProduct, original_price: null };
    expect(mapProductRow(row, 'Anti-Tarnish Jewellery').originalPrice).toBeUndefined();
  });

  it('omits tag/tagBg/tagText when the row has no badge set', () => {
    const row = { ...dbProduct, tag: null, tag_bg: null, tag_text: null };
    const mapped = mapProductRow(row, 'Anti-Tarnish Jewellery');
    expect(mapped.tag).toBeUndefined();
    expect(mapped.tagBg).toBeUndefined();
    expect(mapped.tagText).toBeUndefined();
  });

  it('falls back to the category slug as the display category when no title is available (failure case)', () => {
    const mapped = mapProductRow(dbProduct, undefined);
    expect(mapped.category).toBe('jewellery');
  });

  it('surfaces sale window, stock, and dimensions/material/care fields (Phase 6 — storefront now consumes these)', () => {
    const withPhase1Data = {
      ...dbProduct,
      sale_starts_at: '2024-06-01T00:00:00Z',
      sale_ends_at: '2024-06-30T00:00:00Z',
      dimensions: '5cm x 3cm',
      material: 'Sterling silver',
      care_instructions: 'Keep dry',
      stock_status: 'made_to_order' as const,
      made_to_order_lead_time: 'Ships in 5-7 days',
      low_stock_threshold: 2,
      stock_count: 5,
    };

    const mapped = mapProductRow(withPhase1Data, 'Anti-Tarnish Jewellery');
    expect(mapped.saleStartsAt).toBe('2024-06-01T00:00:00Z');
    expect(mapped.saleEndsAt).toBe('2024-06-30T00:00:00Z');
    expect(mapped.dimensions).toBe('5cm x 3cm');
    expect(mapped.material).toBe('Sterling silver');
    expect(mapped.careInstructions).toBe('Keep dry');
    expect(mapped.stockStatus).toBe('made_to_order');
    expect(mapped.madeToOrderLeadTime).toBe('Ships in 5-7 days');
    expect(mapped.lowStockThreshold).toBe(2);
    expect(mapped.stockCount).toBe(5);
  });

  it('surfaces personalization fields (Phase 5 — checkout needs these to know whether to show the field)', () => {
    const withPersonalization = {
      ...dbProduct,
      personalization_enabled: true,
      personalization_label: 'Add your initials',
      personalization_required: true,
      personalization_max_length: 20,
    };

    const mapped = mapProductRow(withPersonalization, 'Anti-Tarnish Jewellery');
    expect(mapped.personalizationEnabled).toBe(true);
    expect(mapped.personalizationLabel).toBe('Add your initials');
    expect(mapped.personalizationRequired).toBe(true);
    expect(mapped.personalizationMaxLength).toBe(20);
  });
});
