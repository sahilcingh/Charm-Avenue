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
});
