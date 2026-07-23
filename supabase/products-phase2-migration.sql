-- Charm Avenue — Products Phase 2: image gallery
--
-- Purely additive: a brand-new, optional table. products.image/image_alt are
-- never touched, mirrored, or renamed — they stay the permanent, singular
-- "main photo" used everywhere except the product detail page's gallery
-- (cards, cart, wishlist, admin list, live preview). A product with zero
-- product_images rows renders exactly as it does today (single image, no
-- gallery UI).
--
-- product_images holds only SUPPLEMENTARY photos, shown after the main one
-- in the detail-page gallery — there's deliberately no separate "cover"
-- flag here. The main photo (products.image) is always the gallery's first/
-- hero image too, so there's only ever one place to change "the" photo
-- shown everywhere for a product, avoiding a card/gallery disagreement.
--
-- Run this once in the Supabase SQL Editor, after schema.sql and
-- security-migration.sql (depends on is_admin()).

create table if not exists product_images (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references products(id) on delete cascade,
    url text not null,
    alt text not null default '',
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

alter table product_images enable row level security;

-- Mirrors the existing "active products are publicly readable" policy on
-- products itself — a hidden/draft product's gallery structure isn't
-- enumerable by the public, same as its row in `products` isn't.
drop policy if exists "active products' images are publicly readable" on product_images;
create policy "active products' images are publicly readable"
    on product_images for select
    using (exists (
        select 1 from products
        where products.id = product_images.product_id
        and products.is_active = true
    ));

drop policy if exists "product images are manageable by admins" on product_images;
create policy "product images are manageable by admins"
    on product_images for all
    using (is_admin())
    with check (is_admin());
