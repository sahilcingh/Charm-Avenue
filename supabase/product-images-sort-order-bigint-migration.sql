-- Charm Avenue — fix product_images.sort_order overflow
--
-- addProductImage (src/app/admin/(protected)/products/actions.ts) inserts
-- `sort_order: Date.now()` — a millisecond timestamp (~1.78 trillion as of
-- 2026) — but the column was declared `integer` (32-bit, max ~2.1 billion).
-- Every single "Add another photo" attempt has been failing with a Postgres
-- "integer out of range" error, which Next.js redacts into a generic
-- "An error occurred in the Server Components render" message in production.
--
-- Widening to bigint (max ~9.2 quintillion) comfortably fits millisecond
-- timestamps forever, with no other change needed — existing rows' sort_order
-- values (all well within int32 range already) are preserved as-is.
--
-- Run this once in the Supabase SQL Editor, after products-phase2-migration.sql.

alter table product_images alter column sort_order type bigint;
