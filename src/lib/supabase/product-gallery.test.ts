import { describe, it, expect } from 'vitest';
import { resolveGalleryImages } from './product-gallery';

const mainImage = { url: 'https://example.com/main.jpg', alt: 'Main photo' };

describe('resolveGalleryImages', () => {
    it('returns just the main image when there are no additional photos (today\'s behavior, unchanged)', () => {
        expect(resolveGalleryImages(mainImage, [])).toEqual([{ url: 'https://example.com/main.jpg', alt: 'Main photo' }]);
    });

    it('puts the main image first, followed by additional photos ordered by sort_order', () => {
        const additional = [
            { url: 'https://example.com/b.jpg', alt: 'Angle B', sort_order: 2 },
            { url: 'https://example.com/a.jpg', alt: 'Angle A', sort_order: 1 },
        ];
        expect(resolveGalleryImages(mainImage, additional)).toEqual([
            { url: 'https://example.com/main.jpg', alt: 'Main photo' },
            { url: 'https://example.com/a.jpg', alt: 'Angle A' },
            { url: 'https://example.com/b.jpg', alt: 'Angle B' },
        ]);
    });

    it('falls back to the main image\'s alt text when an additional photo has no alt of its own', () => {
        const additional = [{ url: 'https://example.com/a.jpg', alt: '', sort_order: 0 }];
        expect(resolveGalleryImages(mainImage, additional)[1].alt).toBe('Main photo');
    });

    it('does not mutate the input array (pure function)', () => {
        const additional = [
            { url: 'https://example.com/b.jpg', alt: 'B', sort_order: 2 },
            { url: 'https://example.com/a.jpg', alt: 'A', sort_order: 1 },
        ];
        const original = [...additional];
        resolveGalleryImages(mainImage, additional);
        expect(additional).toEqual(original);
    });
});
