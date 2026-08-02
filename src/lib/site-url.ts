/**
 * NEXT_PUBLIC_SITE_URL should be set in the hosting platform's environment
 * variables. This fallback exists so a missing/misconfigured env var
 * degrades to the real production domain instead of leaking `localhost`
 * URLs into the live sitemap, robots.txt, and Open Graph tags.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://charmavenue.in';
