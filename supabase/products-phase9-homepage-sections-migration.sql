-- Charm Avenue — Products Phase 9: admin-curated homepage sections
--
-- "Impulse Buys You Need" and "Shop the Aesthetic" used to be hardcoded
-- components showing an automatic "N most recently added active products"
-- slice, with a hardcoded title. This makes both — and any future section —
-- fully admin-curated: a named, orderable list of sections, each rendered in
-- one of two existing visual layouts ('grid' or 'carousel'), each holding an
-- explicit, orderable list of specific products.
--
-- Purely additive. Run this once in the Supabase SQL Editor, after
-- schema.sql and security-migration.sql (depends on is_admin() and
-- set_updated_at()).

create table if not exists homepage_sections (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    eyebrow_emoji text not null default '✨',
    eyebrow_label text not null default 'Featured',
    subtitle text,
    layout text not null default 'grid' check (layout in ('grid', 'carousel')),
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists homepage_section_products (
    section_id uuid not null references homepage_sections(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    sort_order integer not null default 0,
    primary key (section_id, product_id)
);

create index if not exists homepage_section_products_product_id_idx
    on homepage_section_products(product_id);

drop trigger if exists homepage_sections_set_updated_at on homepage_sections;
create trigger homepage_sections_set_updated_at
    before update on homepage_sections
    for each row
    execute function set_updated_at();

alter table homepage_sections enable row level security;
alter table homepage_section_products enable row level security;

drop policy if exists "homepage sections are publicly readable" on homepage_sections;
create policy "homepage sections are publicly readable"
    on homepage_sections for select
    using (true);

drop policy if exists "homepage sections are manageable by admins" on homepage_sections;
create policy "homepage sections are manageable by admins"
    on homepage_sections for all
    using (is_admin())
    with check (is_admin());

drop policy if exists "homepage section products are publicly readable" on homepage_section_products;
create policy "homepage section products are publicly readable"
    on homepage_section_products for select
    using (true);

drop policy if exists "homepage section products are manageable by admins" on homepage_section_products;
create policy "homepage section products are manageable by admins"
    on homepage_section_products for all
    using (is_admin())
    with check (is_admin());

-- Seed today's two hardcoded sections with their current copy/layout, so
-- nothing on the live homepage changes the moment this migration runs.
-- Guarded by title so re-running this migration is a no-op once seeded.
insert into homepage_sections (title, eyebrow_emoji, eyebrow_label, subtitle, layout, sort_order)
select seed.title, seed.eyebrow_emoji, seed.eyebrow_label, seed.subtitle, seed.layout, seed.sort_order
from (
    values
        ('Impulse Buys You Need', '🏷️', 'Budget Friendly', 'Because cute shouldn''t cost a fortune.', 'grid', 0),
        ('Shop the Aesthetic', '📸', 'Charm Feed', null, 'carousel', 1)
) as seed(title, eyebrow_emoji, eyebrow_label, subtitle, layout, sort_order)
where not exists (
    select 1 from homepage_sections where homepage_sections.title = seed.title
);

-- Backfill each seeded section with the same products it shows today (the
-- most recently created active products), so the storefront looks identical
-- immediately after this migration — the admin can re-curate from there.
insert into homepage_section_products (section_id, product_id, sort_order)
select s.id, p.id, row_number() over (order by p.created_at desc) - 1
from homepage_sections s
cross join lateral (
    select id, created_at from products
    where is_active = true
    order by created_at desc
    limit 10
) p
where s.title = 'Impulse Buys You Need'
on conflict do nothing;

insert into homepage_section_products (section_id, product_id, sort_order)
select s.id, p.id, row_number() over (order by p.created_at desc) - 1
from homepage_sections s
cross join lateral (
    select id, created_at from products
    where is_active = true
    order by created_at desc
    limit 6
) p
where s.title = 'Shop the Aesthetic'
on conflict do nothing;
