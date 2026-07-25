import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import ProductGallery from './ProductGallery';

describe('ProductGallery', () => {
  it('shows the first photo by default and switches the hero photo when a thumbnail is clicked', () => {
    render(
      <ProductGallery
        images={[
          { url: '/photo-1.jpg', alt: 'Photo 1' },
          { url: '/photo-2.jpg', alt: 'Photo 2' },
        ]}
      />
    );
    const hero = screen.getAllByAltText(/Photo/)[0] as HTMLImageElement;
    expect(hero.src).toContain('photo-1.jpg');

    act(() => screen.getByRole('button', { name: 'Show photo 2' }).click());
    expect((screen.getAllByAltText(/Photo/)[0] as HTMLImageElement).src).toContain('photo-2.jpg');
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
      />
    );
    expect(screen.getByRole('button', { name: 'Show Black' })).toBeInTheDocument();
  });

  it(
    "calls onSelectColor when a color-tagged thumbnail is clicked, so the page's active color " +
      "(and its price/stock) switches along with the hero photo — not just the gallery's own " +
      'local highlight',
    () => {
      const onSelectColor = vi.fn();
      render(
        <ProductGallery
          images={[
            { url: '/base.jpg', alt: 'Product' },
            { url: '/black.jpg', alt: 'Product — Black', color: 'Black' },
          ]}
          onSelectColor={onSelectColor}
        />
      );
      act(() => screen.getByRole('button', { name: 'Show Black' }).click());
      expect(onSelectColor).toHaveBeenCalledWith('Black');
    }
  );

  it('does not call onSelectColor when clicking a plain (non-color) thumbnail', () => {
    const onSelectColor = vi.fn();
    render(
      <ProductGallery
        images={[
          { url: '/photo-1.jpg', alt: 'Photo 1' },
          { url: '/photo-2.jpg', alt: 'Photo 2' },
        ]}
        onSelectColor={onSelectColor}
      />
    );
    act(() => screen.getByRole('button', { name: 'Show photo 2' }).click());
    expect(onSelectColor).not.toHaveBeenCalled();
  });
});
