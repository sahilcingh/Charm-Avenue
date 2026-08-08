import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import AppImage from './AppImage';

const SUPABASE_URL = 'https://qgnxtmmlphalrqushegq.supabase.co';
const PRODUCT_PHOTO = `${SUPABASE_URL}/storage/v1/object/public/product-images/photo.jpg`;

describe('AppImage', () => {
  it(
    'routes a Supabase-hosted photo through the same-origin image proxy instead of requesting it ' +
      "directly (this is what keeps Vercel's optimizer quota and Supabase's egress usage both flat)",
    async () => {
      // SUPABASE_HOST (in image-proxy.ts) is computed once at module load, so the env var has to
      // be in place *before* that module is (re-)imported — too late to matter once AppImage
      // itself has already been imported statically above.
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
      vi.resetModules();
      const { default: FreshAppImage } = await import('./AppImage');

      render(<FreshAppImage src={PRODUCT_PHOTO} alt="Product" />);
      expect(screen.getByAltText('Product')).toHaveAttribute(
        'src',
        expect.stringContaining(`/api/image-proxy?url=${encodeURIComponent(PRODUCT_PHOTO)}`)
      );
    }
  );

  it('renders the given src', () => {
    render(<AppImage src="/a.jpg" alt="A" />);
    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('a.jpg'));
  });

  it('updates the rendered image when the src prop changes on an already-mounted instance (failure case: a caller swapping the photo, e.g. a product card previewing a different color variant, must not get stuck on the first image)', () => {
    const { rerender } = render(<AppImage src="/a.jpg" alt="A" />);
    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('a.jpg'));

    rerender(<AppImage src="/b.jpg" alt="A" />);

    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('b.jpg'));
  });

  it(
    'renders an on-brand placeholder instead of the generic broken-image-style graphic when the ' +
      'src is the catalog\'s "no photo yet" sentinel (failure case: the actual file at that path ' +
      'looked like a native broken-image icon, not an intentional on-brand placeholder)',
    () => {
      render(<AppImage src="/assets/images/no_image.png" alt="Coming soon" />);
      expect(screen.getByRole('img', { name: 'Coming soon' })).toBeInTheDocument();
      expect(screen.queryByAltText('Coming soon')).not.toBeInTheDocument();
    }
  );

  it('shows the same on-brand placeholder once a real photo fails to load and falls back to the sentinel', () => {
    render(<AppImage src="/broken.jpg" alt="Product" fallbackSrc="/assets/images/no_image.png" />);
    const img = screen.getByAltText('Product');
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(screen.getByRole('img', { name: 'Product' })).toBeInTheDocument();
    expect(screen.queryByAltText('Product')).not.toBeInTheDocument();
  });

  it('resets a prior error/fallback state once a new src is supplied', () => {
    const { rerender } = render(<AppImage src="/broken.jpg" alt="A" fallbackSrc="/fallback.jpg" />);
    const img = screen.getByAltText('A');
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(img).toHaveAttribute('src', expect.stringContaining('fallback.jpg'));

    rerender(<AppImage src="/good.jpg" alt="A" fallbackSrc="/fallback.jpg" />);

    expect(screen.getByAltText('A')).toHaveAttribute('src', expect.stringContaining('good.jpg'));
  });
});
