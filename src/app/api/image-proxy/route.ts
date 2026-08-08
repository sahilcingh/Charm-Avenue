import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_HOST } from '@/lib/image-proxy';

const ALLOWED_PATH_PREFIX = '/storage/v1/object/public/product-images/';

/**
 * Fetches a Supabase Storage object once and re-serves it with our own
 * long-lived Cache-Control, so Vercel's CDN edge-caches it exactly like it
 * would any other cacheable response — see src/lib/image-proxy.ts for why
 * this exists instead of using next/image's built-in optimizer directly.
 *
 * Locked to this project's own Supabase host and the product-images bucket
 * specifically — never a caller-supplied arbitrary host — so this can't
 * become an open relay for fetching internal or third-party URLs.
 */
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');
  if (!target) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (
    !SUPABASE_HOST ||
    parsed.host !== SUPABASE_HOST ||
    !parsed.pathname.startsWith(ALLOWED_PATH_PREFIX)
  ) {
    return new NextResponse('Host not allowed', { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Upstream fetch failed', { status: upstream.status || 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
