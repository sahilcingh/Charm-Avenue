import { describe, it, expect } from 'vitest';
import { resolveVariantDisplay, formatVariantLabel } from './product-variants';

const base = { price: 300, originalPrice: 400, image: 'https://example.com/base.jpg' };

describe('resolveVariantDisplay', () => {
  it('returns the base product values when no variant is selected', () => {
    expect(resolveVariantDisplay(base, null)).toEqual({
      price: 300,
      originalPrice: 400,
      image: 'https://example.com/base.jpg',
      stockStatus: null,
      stockCount: null,
    });
  });

  it('falls back to the base price/image when the variant has no overrides of its own', () => {
    const variant = {
      price_override: null,
      original_price_override: null,
      image: null,
      stock_status: 'in_stock' as const,
      stock_count: 5,
    };
    const result = resolveVariantDisplay(base, variant);
    expect(result.price).toBe(300);
    expect(result.originalPrice).toBe(400);
    expect(result.image).toBe('https://example.com/base.jpg');
    expect(result.stockStatus).toBe('in_stock');
    expect(result.stockCount).toBe(5);
  });

  it("uses the variant's own price/image overrides when present", () => {
    const variant = {
      price_override: 350,
      original_price_override: 450,
      image: 'https://example.com/red.jpg',
      stock_status: 'out_of_stock' as const,
      stock_count: 0,
    };
    expect(resolveVariantDisplay(base, variant)).toEqual({
      price: 350,
      originalPrice: 450,
      image: 'https://example.com/red.jpg',
      stockStatus: 'out_of_stock',
      stockCount: 0,
    });
  });
});

describe('formatVariantLabel', () => {
  it('joins color and size with a slash when both are set', () => {
    expect(formatVariantLabel({ color: 'Red', size: 'M' })).toBe('Red / M');
  });

  it('returns just the color when size is not set', () => {
    expect(formatVariantLabel({ color: 'Red', size: null })).toBe('Red');
  });

  it('returns just the size when color is not set', () => {
    expect(formatVariantLabel({ color: null, size: 'M' })).toBe('M');
  });

  it('returns null when neither is set (edge case — a variant with no distinguishing option)', () => {
    expect(formatVariantLabel({ color: null, size: null })).toBeNull();
  });
});
