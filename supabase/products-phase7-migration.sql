-- Charm Avenue — Products Phase 7: combos (cross-product discounts)
--
-- Purely additive: two brand-new tables plus one new nullable-safe column on
-- `orders`. No existing table's rows or behavior change until an admin
-- actually creates a combo (nothing does today).
--
-- A combo is a discount rule across 2+ independently-sold existing products
-- — NOT a bundle product with its own fulfillment. When every product in an
-- active combo is present in a shopper's cart (any variant, any quantity
-- ≥1), a one-time percentage discount applies to the combined price of one
-- unit of each combo product. No scheduled window — an admin turns a combo
-- on/off manually, same manual-control philosophy as the sale-price decision
-- in products-phase1-migration.sql.
--
-- Run this once in the Supabase SQL Editor, after schema.sql,
-- security-migration.sql (depends on is_admin()), orders-migration.sql, and
-- products-phase1-migration.sql (reuses set_updated_at()).

create table if not exists combos (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists combo_products (
    combo_id uuid not null references combos(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    primary key (combo_id, product_id)
);

create index if not exists combo_products_product_id_idx on combo_products(product_id);

drop trigger if exists combos_set_updated_at on combos;
create trigger combos_set_updated_at
    before update on combos
    for each row
    execute function set_updated_at();

-- Snapshotted at order time, same principle as order_items' price/variant
-- columns — the combo itself can be edited or deleted later, but the order
-- must forever reflect what was actually charged. `subtotal` keeps meaning
-- "the final total" everywhere it's already read (admin display, Cashfree
-- charge amount); this column exists purely so admins can see how much of
-- that total was a combo discount.
alter table orders add column if not exists discount_total numeric not null default 0;

alter table combos enable row level security;
alter table combo_products enable row level security;

drop policy if exists "active combos are publicly readable" on combos;
create policy "active combos are publicly readable"
    on combos for select
    using (is_active = true);

drop policy if exists "combos are manageable by admins" on combos;
create policy "combos are manageable by admins"
    on combos for all
    using (is_admin())
    with check (is_admin());

drop policy if exists "active combos' products are publicly readable" on combo_products;
create policy "active combos' products are publicly readable"
    on combo_products for select
    using (exists (
        select 1 from combos
        where combos.id = combo_products.combo_id
        and combos.is_active = true
    ));

drop policy if exists "combo products are manageable by admins" on combo_products;
create policy "combo products are manageable by admins"
    on combo_products for all
    using (is_admin())
    with check (is_admin());
