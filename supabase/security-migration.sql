-- Charm Avenue — admin/customer role separation
--
-- Why this is needed: schema.sql's original policies only check
-- `auth.role() = 'authenticated'` — i.e. "is anyone logged in at all".
-- That was safe while only Nandini had an account, but now that customers
-- can sign up too, any customer account would satisfy that same check and
-- could add/edit/delete products via a direct API call. This migration adds
-- a real admin-vs-customer distinction and locks product/category/storage
-- writes down to admins only.
--
-- Run this ONCE in the Supabase SQL Editor, after schema.sql.

-- ─────────────────────────────────────────────
-- Profiles (one row per auth user, customer or admin)
-- ─────────────────────────────────────────────
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- A user can read and update only their own profile row. There is no policy
-- letting anyone set is_admin from the client — that column is only ever
-- changed by the one-off `update profiles set is_admin = true ...`
-- statement below, run directly in the SQL Editor, never through the app.
drop policy if exists "profiles are readable by their owner" on profiles;
create policy "profiles are readable by their owner"
    on profiles for select
    using (auth.uid() = id);

drop policy if exists "profiles are updatable by their owner" on profiles;
create policy "profiles are updatable by their owner"
    on profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- RLS policies only restrict which ROWS a user can touch, not which
-- COLUMNS — the "with check" above would happily let a customer send
-- `update profiles set is_admin = true` against their own row. Column-level
-- grants close that: authenticated users can only ever write `name`.
revoke update on profiles from authenticated;
grant update (name) on profiles to authenticated;

-- Auto-create a profile row (is_admin defaults to false) whenever someone
-- signs up, whether that's a customer via /signup or an admin created
-- directly in the Supabase dashboard.
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, name)
    values (new.id, new.email, new.raw_user_meta_data->>'name');
    return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

-- Backfill profiles for any accounts (e.g. the existing admin) created
-- before this migration ran.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Helper used by every "admin only" policy below — SECURITY DEFINER so it
-- can read profiles regardless of the caller's own row-level policy.
create or replace function is_admin()
returns boolean as $$
    select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql security definer stable set search_path = public;

-- ─────────────────────────────────────────────
-- Promote Nandini's existing admin account.
-- Replace the email below with her actual login email, then run just this
-- one statement (safe to re-run).
-- ─────────────────────────────────────────────
update profiles set is_admin = true where email = 'admin@gmail.com';

-- ─────────────────────────────────────────────
-- Tighten categories/products/storage policies to admins only.
-- ─────────────────────────────────────────────
drop policy if exists "categories are editable by authenticated users" on categories;
create policy "categories are editable by admins"
    on categories for all
    using (is_admin())
    with check (is_admin());

drop policy if exists "products are fully manageable by authenticated users" on products;
create policy "products are fully manageable by admins"
    on products for all
    using (is_admin())
    with check (is_admin());

drop policy if exists "product images are manageable by authenticated users" on storage.objects;
create policy "product images are manageable by admins"
    on storage.objects for all
    using (bucket_id = 'product-images' and is_admin())
    with check (bucket_id = 'product-images' and is_admin());
