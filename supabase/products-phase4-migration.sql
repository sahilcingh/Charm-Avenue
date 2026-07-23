-- Charm Avenue — Products Phase 4: variants (color / size)
--
-- Purely additive: a brand-new, optional table. A product with zero
-- product_variants rows sells exactly as it does today — single price,
-- single stock status (from products itself), single image. Only once an
-- admin adds ≥1 active variant does variant-level data become authoritative
-- for that product (price/stock/image overrides, per the earlier decision
-- that variants fully override the product-level stock fields once any
-- exist — no partial fallback).
--
-- Run this once in the Supabase SQL Editor, after schema.sql,
-- security-migration.sql (depends on is_admin()), and products-phase1
-- (reuses set_updated_at()).

create table if not exists product_variants (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id) on delete cascade,
    color text,
    size text,
    sku text,
    price_override integer,
    original_price_override integer,
    image text,
    stock_status text check (stock_status is null or stock_status in ('in_stock', 'out_of_stock', 'made_to_order', 'discontinued')),
    stock_count integer,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on product_variants(product_id);

drop trigger if exists product_variants_set_updated_at on product_variants;
create trigger product_variants_set_updated_at
    before update on product_variants
    for each row
    execute function set_updated_at();

alter table product_variants enable row level security;

-- Mirrors product_images/product_tags/product_categories — a hidden/draft
-- product's variants aren't enumerable by the public, and a retired
-- (is_active = false) variant isn't shown even for an active product.
drop policy if exists "active variants of active products are publicly readable" on product_variants;
create policy "active variants of active products are publicly readable"
    on product_variants for select
    using (
        is_active = true
        and exists (select 1 from products where products.id = product_variants.product_id and products.is_active = true)
    );

drop policy if exists "product variants are manageable by admins" on product_variants;
create policy "product variants are manageable by admins"
    on product_variants for all
    using (is_admin())
    with check (is_admin());
