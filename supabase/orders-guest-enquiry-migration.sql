-- Charm Avenue — guest-friendly WhatsApp enquiries (Cashfree removed)
--
-- Reverts orders-require-login-migration.sql's "login required" tightening,
-- and goes further: there's no longer a checkout form collecting delivery
-- details either (everything after the WhatsApp message is negotiated in
-- the chat itself), so guest_name/guest_phone/guest_address are no longer
-- collected at all and must become nullable too.
--
-- SELECT policies are untouched — "admins can read all orders" and
-- "customers can read their own orders" (auth.uid() = user_id) still stand.
-- The latter still matters: a logged-in customer's enquiry still gets a
-- real user_id, so it keeps showing in their Account → Order History.
-- A guest's one-off confirmation page is deliberately NOT served via a
-- public SELECT policy (that would let anon read every order/customer's
-- name+phone+address) — it's fetched server-side with the service-role
-- client instead, gated only by knowing the order's own unguessable UUID.
--
-- Run this once in the Supabase SQL Editor, after orders-migration.sql
-- (and orders-require-login-migration.sql, if you ran that one). Safe to
-- re-run in full if you already ran an earlier version of this file — every
-- statement is idempotent (drop-if-exists / create-or-replace).

alter table orders alter column user_id drop not null;
alter table orders alter column guest_name drop not null;
alter table orders alter column guest_phone drop not null;
alter table orders alter column guest_address drop not null;

drop policy if exists "anyone can create an order" on orders;
drop policy if exists "customers can create their own orders" on orders;
drop policy if exists "anyone can create a guest or their own order" on orders;
create policy "anyone can create a guest or their own order"
    on orders for insert
    with check (auth.uid() = user_id or user_id is null);

-- The order_items insert policy needs to check the parent order's ownership,
-- but a plain `exists (select 1 from orders where ...)` subquery is itself
-- subject to `orders`' own SELECT RLS — and anon has no SELECT policy on
-- orders (by design, see above). Without this helper, that subquery always
-- returns zero rows for a guest, so the check silently fails even for a
-- guest inserting items into their own just-created order. A SECURITY
-- DEFINER function (same pattern as is_admin() in security-migration.sql)
-- runs with elevated privileges and bypasses that RLS recursion problem.
create or replace function order_accepts_new_items(target_order_id uuid)
returns boolean as $$
    select exists (
        select 1 from orders
        where orders.id = target_order_id
        and (orders.user_id = auth.uid() or orders.user_id is null)
    );
$$ language sql security definer stable set search_path = public;

drop policy if exists "anyone can create order items" on order_items;
drop policy if exists "customers can create their own order items" on order_items;
drop policy if exists "anyone can create order items for a guest or their own order" on order_items;
create policy "anyone can create order items for a guest or their own order"
    on order_items for insert
    with check (order_accepts_new_items(order_id));
