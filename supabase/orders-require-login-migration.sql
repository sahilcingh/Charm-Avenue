-- Charm Avenue — require login before ordering
--
-- Run this if you already ran the original orders-migration.sql (which
-- allowed guest orders with user_id null). This tightens the existing
-- `orders` / `order_items` tables to match: every order now belongs to a
-- signed-in customer.
--
-- Before running: this will fail if any existing row has user_id null
-- (e.g. a guest test order from before this change). Delete those rows first,
-- or assign them a real user_id, via the Supabase SQL Editor:
--   delete from orders where user_id is null;
-- (order_items cascade-deletes with their parent order.)

alter table orders alter column user_id set not null;
alter table orders drop constraint if exists orders_user_id_fkey;
alter table orders add constraint orders_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

drop policy if exists "anyone can create an order" on orders;
drop policy if exists "customers can create their own orders" on orders;
create policy "customers can create their own orders"
    on orders for insert
    with check (auth.uid() = user_id);

drop policy if exists "anyone can create order items" on order_items;
drop policy if exists "customers can create their own order items" on order_items;
create policy "customers can create their own order items"
    on order_items for insert
    with check (exists (
        select 1 from orders
        where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    ));
