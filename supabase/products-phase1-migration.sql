-- Charm Avenue — Products Phase 1: low-risk additive columns
--
-- Purely additive: every new column here is nullable, or a boolean with a
-- safe `default false`. All 40 existing products are completely unaffected —
-- they simply get NULL (or false) in every new column, which is the correct
-- "this product doesn't use this feature" state, identical to today's
-- behavior. No existing column, constraint, row, or the `products` RLS
-- policies are touched — reads/writes on these new columns are already
-- covered by the existing "active products are publicly readable" /
-- "products are fully manageable by authenticated users" policies.
--
-- Run this once in the Supabase SQL Editor, after schema.sql.

-- Sale window — controls whether original_price/the discount badge is
-- *displayed*. Does NOT change what's actually charged (always `price`,
-- updated manually by the admin when a sale starts/ends — see chat history
-- for the explicit decision behind this).
alter table products add column if not exists sale_starts_at timestamptz;
alter table products add column if not exists sale_ends_at timestamptz;

-- Free-text product details.
alter table products add column if not exists dimensions text;
alter table products add column if not exists material text;
alter table products add column if not exists care_instructions text;

-- Stock & availability — distinct from is_active (visibility). NULL means
-- "not tracking stock for this product," identical to today's behavior
-- (nothing today ever disables ordering for stock reasons). Once a product
-- has active variants (a later phase), variant-level stock is fully
-- authoritative and this column is ignored for that product.
alter table products add column if not exists stock_status text;
alter table products add column if not exists made_to_order_lead_time text;
alter table products add column if not exists low_stock_threshold integer;

alter table products drop constraint if exists products_stock_status_check;
alter table products add constraint products_stock_status_check
    check (stock_status is null or stock_status in ('in_stock', 'out_of_stock', 'made_to_order', 'discontinued'));

-- Personalization — off by default (false), matching today's behavior
-- exactly (no personalization prompt exists anywhere today). A blank
-- personalization_max_length falls back to 50 at the application layer,
-- not here — this column staying NULL means "use the 50-char fallback."
alter table products add column if not exists personalization_enabled boolean not null default false;
alter table products add column if not exists personalization_label text;
alter table products add column if not exists personalization_required boolean not null default false;
alter table products add column if not exists personalization_max_length integer;
