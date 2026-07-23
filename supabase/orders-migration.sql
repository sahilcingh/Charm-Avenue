-- Charm Avenue — real order records
--
-- Replaces the old "cart + static WhatsApp link with nothing persisted"
-- flow with actual order rows. Placing an order requires being signed in
-- (enforced at /checkout and again in the Server Actions that insert here),
-- so user_id is always a real customer.
--
-- Run this once in the Supabase SQL Editor, after schema.sql and
-- security-migration.sql (this depends on is_admin()).

create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    guest_name text not null,
    guest_phone text not null,
    guest_address text not null,
    status text not null default 'pending_whatsapp'
        check (status in ('pending_whatsapp', 'pending_payment', 'paid', 'cancelled')),
    subtotal numeric not null check (subtotal >= 0),
    payment_gateway_order_id text,   -- Cashfree's own order id; null until "Pay Now" is used
    payment_gateway_payment_id text, -- set once the payment webhook confirms success
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    product_name text not null,  -- snapshot at order time — survives later renames/deletion
    unit_price numeric not null check (unit_price >= 0), -- snapshot — survives later price changes
    quantity int not null check (quantity > 0)
);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- Keep updated_at current whenever an admin changes an order's status
-- (set_updated_at() is defined in schema.sql, shared with products).
drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
    before update on orders
    for each row
    execute function set_updated_at();

alter table orders enable row level security;
alter table order_items enable row level security;

-- A signed-in customer can only ever create an order under their own id.
drop policy if exists "anyone can create an order" on orders;
drop policy if exists "customers can create their own orders" on orders;
create policy "customers can create their own orders"
    on orders for insert
    with check (auth.uid() = user_id);

drop policy if exists "admins can read all orders" on orders;
create policy "admins can read all orders"
    on orders for select
    using (is_admin());

drop policy if exists "admins can update orders" on orders;
create policy "admins can update orders"
    on orders for update
    using (is_admin())
    with check (is_admin());

drop policy if exists "customers can read their own orders" on orders;
create policy "customers can read their own orders"
    on orders for select
    using (auth.uid() = user_id);

-- order_items has no owner of its own; read access mirrors the parent order.
drop policy if exists "anyone can create order items" on order_items;
drop policy if exists "customers can create their own order items" on order_items;
create policy "customers can create their own order items"
    on order_items for insert
    with check (exists (
        select 1 from orders
        where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    ));

drop policy if exists "admins can read all order items" on order_items;
create policy "admins can read all order items"
    on order_items for select
    using (is_admin());

drop policy if exists "customers can read their own order items" on order_items;
create policy "customers can read their own order items"
    on order_items for select
    using (exists (
        select 1 from orders
        where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    ));
