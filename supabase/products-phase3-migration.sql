-- Charm Avenue — Products Phase 3: tags + multiple categories
--
-- Purely additive: two brand-new join tables plus a small `tags` lookup
-- table. products.category_slug is never touched — it stays the required,
-- primary category (breadcrumbs, related-products, /shop/[category] all
-- keep reading it exactly as today). product_categories only ever ADDS
-- extra category memberships on top.
--
-- product_categories is backfilled below with every existing product's
-- current category_slug, so future code can read multi-category
-- membership from this one table for every product (old and new) instead
-- of permanently branching between "check category_slug" and "check
-- product_categories". This is an INSERT, not an UPDATE — no existing
-- column on any table is touched.
--
-- Run this once in the Supabase SQL Editor, after schema.sql and
-- security-migration.sql (depends on is_admin()).

create table if not exists tags (
    slug text primary key,
    label text not null,
    created_at timestamptz not null default now()
);

create table if not exists product_tags (
    product_id uuid not null references products(id) on delete cascade,
    tag_slug text not null references tags(slug) on delete cascade,
    primary key (product_id, tag_slug)
);

create table if not exists product_categories (
    product_id uuid not null references products(id) on delete cascade,
    category_slug text not null references categories(slug) on delete cascade,
    primary key (product_id, category_slug)
);

create index if not exists product_tags_tag_slug_idx on product_tags(tag_slug);
create index if not exists product_categories_category_slug_idx on product_categories(category_slug);

-- Backfill: every existing product's current primary category also becomes
-- a row here, so `product_categories` is a complete membership list from
-- day one. Safe to re-run — `on conflict do nothing`.
insert into product_categories (product_id, category_slug)
select id, category_slug from products
on conflict (product_id, category_slug) do nothing;

alter table tags enable row level security;
alter table product_tags enable row level security;
alter table product_categories enable row level security;

-- Tag names themselves aren't tied to any one product's visibility — fine to read publicly.
drop policy if exists "tags are publicly readable" on tags;
create policy "tags are publicly readable"
    on tags for select
    using (true);

drop policy if exists "tags are manageable by admins" on tags;
create policy "tags are manageable by admins"
    on tags for all
    using (is_admin())
    with check (is_admin());

-- Mirrors product_images' pattern — a hidden/draft product's tag or extra
-- category memberships aren't enumerable by the public, same as its row in
-- `products` isn't.
drop policy if exists "active products' tags are publicly readable" on product_tags;
create policy "active products' tags are publicly readable"
    on product_tags for select
    using (exists (
        select 1 from products
        where products.id = product_tags.product_id
        and products.is_active = true
    ));

drop policy if exists "product tags are manageable by admins" on product_tags;
create policy "product tags are manageable by admins"
    on product_tags for all
    using (is_admin())
    with check (is_admin());

drop policy if exists "active products' extra categories are publicly readable" on product_categories;
create policy "active products' extra categories are publicly readable"
    on product_categories for select
    using (exists (
        select 1 from products
        where products.id = product_categories.product_id
        and products.is_active = true
    ));

drop policy if exists "product categories are manageable by admins" on product_categories;
create policy "product categories are manageable by admins"
    on product_categories for all
    using (is_admin())
    with check (is_admin());
