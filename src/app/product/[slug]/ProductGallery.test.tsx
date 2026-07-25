import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import ProductGallery from './ProductGallery';

describe('ProductGallery', () => {
  it('shows whichever photo activeIndex points at, and calls onSelectIndex when a plain thumbnail is clicked', () => {
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
    const hero = screen.getAllByAltText(/Photo/)[0] as HTMLImageElement;
    expect(hero.src).toContain('photo-1.jpg');

    act(() => screen.getByRole('button', { name: 'Show photo 2' }).click());
    expect(onSelectIndex).toHaveBeenCalledWith(1);
  });

  it(
    "doesn't suppress the browser's own focus outline on a thumbnail that isn't the active photo " +
      '(failure case: an inline `outline: 2px solid transparent` was set on every non-active ' +
      'thumbnail, which silently swallowed the default focus ring for keyboard users)',
    () => {
      render(
        <ProductGallery
          images={[
            { url: '/photo-1.jpg', alt: 'Photo 1' },
            { url: '/photo-2.jpg', alt: 'Photo 2' },
          ]}
          activeIndex={0}
        />
      );
      const secondThumb = screen.getByRole('button', { name: 'Show photo 2' });
      expect(secondThumb.style.outline).not.toBe('2px solid transparent');
    }
  );

  it('labels a color-tagged thumbnail with its color name instead of a generic photo number', () => {
    render(
      <ProductGallery
        images={[
          { url: '/base.jpg', alt: 'Product' },
          { url: '/black.jpg', alt: 'Product — Black', color: 'Black' },
        ]}
        activeIndex={0}
      />
    );
    expect(screen.getByRole('button', { name: 'Show Black' })).toBeInTheDocument();
  });

  it(
    'calls onSelectColor (not onSelectIndex) when a color-tagged thumbnail is clicked, so the ' +
      "page's active color (and its price/stock) switches along with the hero photo",
    () => {
      const onSelectColor = vi.fn();
      const onSelectIndex = vi.fn();
      render(
        <ProductGallery
          images={[
            { url: '/base.jpg', alt: 'Product' },
            { url: '/black.jpg', alt: 'Product — Black', color: 'Black' },
          ]}
          activeIndex={0}
          onSelectColor={onSelectColor}
          onSelectIndex={onSelectIndex}
        />
      );
      act(() => screen.getByRole('button', { name: 'Show Black' }).click());
      expect(onSelectColor).toHaveBeenCalledWith('Black');
      expect(onSelectIndex).not.toHaveBeenCalled();
    }
  );

  it('highlights whichever thumbnail activeIndex points at, without reordering the images themselves', () => {
    const { rerender } = render(
      <ProductGallery
        images={[
          { url: '/base.jpg', alt: 'Product' },
          { url: '/red.jpg', alt: 'Product — Red', color: 'Red' },
          { url: '/black.jpg', alt: 'Product — Black', color: 'Black' },
        ]}
        activeIndex={2}
      />
    );
    const orderBefore = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(screen.getByRole('button', { name: 'Show Black' })).toHaveStyle({
      outline: '2px solid var(--blush-rose)',
    });

    rerender(
      <ProductGallery
        images={[
          { url: '/base.jpg', alt: 'Product' },
          { url: '/red.jpg', alt: 'Product — Red', color: 'Red' },
          { url: '/black.jpg', alt: 'Product — Black', color: 'Black' },
        ]}
        activeIndex={1}
      />
    );
    const orderAfter = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(orderAfter).toEqual(orderBefore);
    expect(screen.getByRole('button', { name: 'Show Red' })).toHaveStyle({
      outline: '2px solid var(--blush-rose)',
    });
    expect(screen.getByRole('button', { name: 'Show Black' }).style.outline).not.toBe(
      '2px solid var(--blush-rose)'
    );
  });
});
