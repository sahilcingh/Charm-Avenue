const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return '';
  }
})();

/**
 * Routes Supabase-hosted photos through our own /api/image-proxy instead of
 * Next.js's built-in optimizer. The optimizer has a monthly cap on distinct
 * source images (Vercel's "Image Optimization" line item) — once that's
 * exhausted, every new product photo 404s. Serving straight from Supabase
 * with `unoptimized` avoids the cap but sends every single visitor's request
 * to Supabase directly, driving up its metered "Cached Egress" instead.
 *
 * The proxy sidesteps both: it's a plain Route Handler (not subject to the
 * optimizer's quota), and its response carries its own long Cache-Control,
 * so Vercel's edge network caches it the same way the optimizer's output
 * used to — Supabase is only ever hit once per edge region, not once per
 * visitor.
 */
export function toProxiedSrc(src: string): { src: string; unoptimized: boolean } {
  try {
    const parsed = new URL(src);
    if (SUPABASE_HOST && parsed.host === SUPABASE_HOST) {
      return { src: `/api/image-proxy?url=${encodeURIComponent(src)}`, unoptimized: true };
    }
  } catch {
    // Relative paths (e.g. the on-brand placeholder) aren't parseable as an absolute
    // URL — they're already local, so there's nothing to proxy.
  }
  return { src, unoptimized: false };
}

export { SUPABASE_HOST };
