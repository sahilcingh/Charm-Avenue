import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import ProductGallery from './ProductGallery';

describe('ProductGallery', () => {
  it('shows whichever photo activeIndex points at as the hero', () => {
    render(
      <ProductGallery
        images={[
          { url: '/photo-1.jpg', alt: 'Photo 1' },
          { url: '/photo-2.jpg', alt: 'Photo 2' },
        ]}
        activeIndex={1}
      />
    );
    const hero = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
    expect(hero.src).toContain('photo-2.jpg');
  });

  it('delegates thumbnail clicks through to the caller (thumbnail row itself is covered by GalleryThumbnails.test.tsx)', () => {
    const onSelectIndex = vi.fn();
    render(
      <ProductGallery
        images={[
          { url: '/photo-1.jpg', alt: 'Photo 1' },
          { url: '/photo-2.jpg', alt: 'Photo 2' },
        ]}
        activeIndex={0}
        onSelectIndex={onSelectIndex}
      />
    );
    act(() => screen.getByRole('button', { name: 'Show photo 2' }).click());
    expect(onSelectIndex).toHaveBeenCalledWith(1);
  });

  it(
    'keeps min-w-0 on its own root (a direct CSS Grid item on the product page) and renders the ' +
      'mobile-only copy of the thumbnail row (md:hidden) — the desktop copy lives beside the ' +
      'product title instead, rendered separately by ProductDetailInteractive',
    () => {
      const { container } = render(
        <ProductGallery
          images={[
            { url: '/photo-1.jpg', alt: 'Photo 1' },
            { url: '/photo-2.jpg', alt: 'Photo 2' },
          ]}
          activeIndex={0}
        />
      );
      expect(container.firstElementChild?.className).toContain('min-w-0');
      const row = container.querySelector('.overflow-x-auto');
      expect(row?.className).toContain('md:hidden');
    }
  );

  it('shows no thumbnail row at all when the product has only one photo', () => {
    const { container } = render(
      <ProductGallery images={[{ url: '/only.jpg', alt: 'Only' }]} activeIndex={0} />
    );
    expect(container.querySelector('.overflow-x-auto')).not.toBeInTheDocument();
  });
});
