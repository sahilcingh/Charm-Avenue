-- Charm Avenue — Products Phase 5: fulfillment wiring (order_items snapshot)
--
-- Purely additive: four new nullable columns on the existing order_items
-- table. Every historical order_item gets NULL in all four, which is
-- exactly correct — none of them involved a variant or personalization.
--
-- Snapshotted here (not looked up live via variant_id) because the variant
-- row itself can be edited or deleted after the order was placed — an
-- order must forever reflect what was actually ordered, the same principle
-- already used for product_name/unit_price on this table.
--
-- Run this once in the Supabase SQL Editor, after orders-migration.sql and
-- products-phase4-migration.sql (variant_id references product_variants).

alter table order_items add column if not exists variant_id uuid references product_variants(id) on delete set null;
alter table order_items add column if not exists variant_label text;
alter table order_items add column if not exists variant_image text;
alter table order_items add column if not exists personalization_text text;
