-- Charm Avenue — customer wishlist
--
-- Ties the (currently decorative) wishlist heart icon to real customer
-- accounts. Since there's no cart checkout, this is the main place a
-- signed-in customer's data actually gets used — they save items here, then
-- reach out over WhatsApp when ready to enquire.
--
-- Run this once in the Supabase SQL Editor.

create table if not exists wishlist_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, product_id)
);

alter table wishlist_items enable row level security;

drop policy if exists "users can view their own wishlist" on wishlist_items;
create policy "users can view their own wishlist"
    on wishlist_items for select
    using (auth.uid() = user_id);

drop policy if exists "users can add to their own wishlist" on wishlist_items;
create policy "users can add to their own wishlist"
    on wishlist_items for insert
    with check (auth.uid() = user_id);

drop policy if exists "users can remove from their own wishlist" on wishlist_items;
create policy "users can remove from their own wishlist"
    on wishlist_items for delete
    using (auth.uid() = user_id);
