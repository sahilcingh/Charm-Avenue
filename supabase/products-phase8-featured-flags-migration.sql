-- Charm Avenue — Products Phase 8: explicit New Arrivals / Best Sellers flags
--
-- Until now, "New Arrivals" and "Best Sellers" on /shop were driven by
-- substring-matching the single free-text badge field (products.tag) for
-- "new"/"best" — fragile, and conflated "what text shows on the card" with
-- "does this product belong in that section." These two dedicated booleans
-- decouple that: an admin ticks a checkbox per product, independent of
-- whatever badge text (if any) is shown.
--
-- Purely additive — both columns default to false, so no existing product
-- changes behavior until an admin opts it in.
--
-- Run this once in the Supabase SQL Editor, after schema.sql.

alter table products add column if not exists is_new_arrival boolean not null default false;
alter table products add column if not exists is_best_seller boolean not null default false;
