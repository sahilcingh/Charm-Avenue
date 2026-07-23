-- Charm Avenue — admin orders dashboard
--
-- Run this if you already ran orders-migration.sql before this trigger was
-- added. Keeps orders.updated_at current whenever an admin changes an
-- order's status from /admin/orders (set_updated_at() is defined in
-- schema.sql, shared with products). No RLS changes needed — the
-- "admins can read all orders" / "admins can update orders" policies
-- already added by orders-migration.sql cover this dashboard.

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
    before update on orders
    for each row
    execute function set_updated_at();
