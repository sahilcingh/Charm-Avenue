-- Charm Avenue — database schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).

-- ─────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────
create table if not exists categories (
    slug text primary key,
    title text not null,
    subtitle text not null,
    emoji text not null,
    tag text not null,
    image text not null,
    image_alt text not null,
    tag_bg text not null,
    tag_text text not null,
    description text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

alter table categories enable row level security;

-- Anyone (including logged-out storefront visitors) can read categories.
create policy "categories are publicly readable"
    on categories for select
    using (true);

-- Only logged-in users (i.e. the admin) can create/edit/delete categories.
create policy "categories are editable by authenticated users"
    on categories for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────
create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    category_slug text not null references categories(slug) on delete restrict,
    price integer not null,
    original_price integer,
    image text not null,
    image_alt text not null,
    tag text,
    tag_bg text,
    tag_text text,
    emoji text not null default '✨',
    description text not null default '',
    rating numeric(2, 1) not null default 4.5,
    review_count integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists products_category_slug_idx on products(category_slug);

alter table products enable row level security;

-- Storefront can only see active products.
create policy "active products are publicly readable"
    on products for select
    using (is_active = true);

-- Admin (any authenticated user) can see and manage everything, including inactive/draft products.
create policy "products are fully manageable by authenticated users"
    on products for all
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
    before update on products
    for each row
    execute function set_updated_at();

-- ─────────────────────────────────────────────
-- Storage bucket for product photos uploaded via the admin panel
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images are publicly readable"
    on storage.objects for select
    using (bucket_id = 'product-images');

create policy "product images are manageable by authenticated users"
    on storage.objects for all
    using (bucket_id = 'product-images' and auth.role() = 'authenticated')
    with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
