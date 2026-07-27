import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  // Default Server Action body limit is 1MB — a single phone-camera photo routinely
  // exceeds that, which silently failed the admin "save changes" flow in production.
  // Kept above MAX_PRODUCT_IMAGE_BYTES (src/lib/product-image-validation.ts) so the
  // client-side check is always the one giving the friendly error, not this ceiling.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: imageHosts,
    // Uploaded product/category photos get a new, unique filename every time
    // (see uploadImageIfProvided/uploadCategoryImageIfProvided) and are never
    // overwritten, so a cached optimized image is never stale — a long TTL
    // just means Vercel stops re-fetching the original from Supabase Storage
    // so often, which is what was driving Supabase's Cached Egress usage up.
    minimumCacheTTL: 31536000,
    qualities: [75, 85, 100],
  },
  webpack(config, { dev: dev }) {
    if (dev) {
      const ignoredPaths = (process.env.WATCH_IGNORED_PATHS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      config.watchOptions = {
        ignored: ignoredPaths.length
          ? ignoredPaths.map((p) => `**/${p.replace(/^\/+|\/+$/g, '')}/**`)
          : undefined,
      };
    }
    return config;
  },
};
export default nextConfig;
