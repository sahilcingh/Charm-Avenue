import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const SUPABASE_URL = 'https://qgnxtmmlphalrqushegq.supabase.co';
const VALID_TARGET = `${SUPABASE_URL}/storage/v1/object/public/product-images/photo.jpg`;

function requestFor(url?: string) {
  const base = 'http://localhost/api/image-proxy';
  return new NextRequest(url ? `${base}?url=${encodeURIComponent(url)}` : base);
}

describe('GET /api/image-proxy', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    vi.resetModules();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects a request with no url param, without ever fetching anything', async () => {
    const { GET } = await import('./route');
    const res = await GET(requestFor());
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a url pointing at a different host (vulnerability case: must never become an open proxy)', async () => {
    const { GET } = await import('./route');
    const res = await GET(requestFor('https://evil.example.com/x.jpg'));
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a Supabase-hosted url outside the product-images bucket (defense in depth)', async () => {
    const { GET } = await import('./route');
    const res = await GET(
      requestFor(`${SUPABASE_URL}/storage/v1/object/public/other-bucket/x.jpg`)
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches the upstream object once and re-serves it with a year-long Cache-Control (normal case)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(new ReadableStream(), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    );
    const { GET } = await import('./route');
    const res = await GET(requestFor(VALID_TARGET));

    expect(global.fetch).toHaveBeenCalledWith(VALID_TARGET);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('passes the upstream status through when the fetch fails (e.g. the file was deleted)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 404 })
    );
    const { GET } = await import('./route');
    const res = await GET(requestFor(VALID_TARGET));
    expect(res.status).toBe(404);
  });
});
