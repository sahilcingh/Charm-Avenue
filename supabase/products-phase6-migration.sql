-- Charm Avenue — Products Phase 6: product-level stock count
--
-- Purely additive: one new nullable column. All 40 existing products are
-- completely unaffected — they get NULL, identical to today's behavior
-- (nothing today compares stock against a live count for a plain product).
--
-- Closes a gap noticed while wiring the storefront to Phase 1's
-- low_stock_threshold: the admin UI already promises "shown to shoppers as
-- 'only N left' once stock drops to this number or below," but products had
-- no live count to compare that threshold against — only product_variants
-- did (Phase 4's stock_count). This column gives a plain (variant-less)
-- product the same capability, so the existing admin copy is actually true.
--
-- Once a product has ≥1 active variant, variant-level stock stays fully
-- authoritative (per the earlier decision) and this column is ignored for
-- that product — it only matters for products with zero variants.
--
-- Run this once in the Supabase SQL Editor, after products-phase1-migration.sql.

alter table products add column if not exists stock_count integer;
