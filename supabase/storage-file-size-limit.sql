-- Charm Avenue — align the product-images bucket's own size limit
--
-- Without this, the bucket falls back to the project-wide Storage default
-- (set in Dashboard → Settings → Storage), which may be much higher or lower
-- than what the app actually expects. Setting it explicitly here keeps the
-- three layers in sync: client-side check (MAX_PRODUCT_IMAGE_BYTES in
-- src/lib/product-image-validation.ts, 8MB) < Server Action limit
-- (next.config.mjs, 10MB) < this bucket limit, so a legitimate upload the
-- client already accepted never gets rejected by Storage itself.
--
-- Run this once in the Supabase SQL Editor.

update storage.buckets
set file_size_limit = 10485760 -- 10MB, in bytes
where id = 'product-images';
