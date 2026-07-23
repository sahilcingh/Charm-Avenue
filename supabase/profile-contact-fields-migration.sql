-- Charm Avenue — save a logged-in customer's phone/address for checkout pre-fill
--
-- security-migration.sql originally only granted column-level update access
-- to `name` (deliberately excluding is_admin from client writes). This adds
-- phone/address as two more customer-writable columns for the same reason
-- checkout pre-fill needs them.
--
-- Run this once in the Supabase SQL Editor, after security-migration.sql.

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists address text;

grant update (name, phone, address) on profiles to authenticated;
