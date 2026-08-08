import { describe, it, expect, beforeEach, vi } from 'vitest';

const SUPABASE_URL = 'https://qgnxtmmlphalrqushegq.supabase.co';
const PRODUCT_PHOTO = `${SUPABASE_URL}/storage/v1/object/public/product-images/photo.jpg`;

describe('toProxiedSrc', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('rewrites a Supabase-hosted photo to the same-origin proxy path, marked unoptimized', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    const { toProxiedSrc } = await import('./image-proxy');

    expect(toProxiedSrc(PRODUCT_PHOTO)).toEqual({
      src: `/api/image-proxy?url=${encodeURIComponent(PRODUCT_PHOTO)}`,
      unoptimized: true,
    });
  });

  it('leaves a non-Supabase absolute URL untouched (e.g. the homepage hero stock photo)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    const { toProxiedSrc } = await import('./image-proxy');
    const heroUrl = 'https://images.pexels.com/photos/4515450/pexels-photo-4515450.jpeg';

    expect(toProxiedSrc(heroUrl)).toEqual({ src: heroUrl, unoptimized: false });
  });

  it('leaves a relative/local path untouched (e.g. the on-brand placeholder)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    const { toProxiedSrc } = await import('./image-proxy');

    expect(toProxiedSrc('/assets/images/no_image.png')).toEqual({
      src: '/assets/images/no_image.png',
      unoptimized: false,
    });
  });

  it('degrades safely instead of throwing when NEXT_PUBLIC_SUPABASE_URL is unset (failure case)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { toProxiedSrc } = await import('./image-proxy');

    expect(toProxiedSrc(PRODUCT_PHOTO)).toEqual({ src: PRODUCT_PHOTO, unoptimized: false });
  });
});
