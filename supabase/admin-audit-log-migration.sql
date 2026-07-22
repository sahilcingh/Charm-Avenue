-- Charm Avenue — admin action audit trail
--
-- Records who did what, when, for admin product mutations. Previously a
-- product could be deleted with zero trace of which admin did it or when.
--
-- Run this once in the Supabase SQL Editor.

create table if not exists admin_audit_log (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid not null references auth.users(id) on delete set null,
    action text not null check (action in ('create', 'update', 'delete')),
    product_id uuid,
    product_name text not null,
    created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on admin_audit_log(created_at desc);

alter table admin_audit_log enable row level security;

-- Only admins can read the log.
drop policy if exists "admins can read the audit log" on admin_audit_log;
create policy "admins can read the audit log"
    on admin_audit_log for select
    using (is_admin());

-- Only admins can write to it (defense in depth — the app also only ever
-- writes here as the currently-authenticated admin performing the action).
drop policy if exists "admins can write to the audit log" on admin_audit_log;
create policy "admins can write to the audit log"
    on admin_audit_log for insert
    with check (is_admin());
