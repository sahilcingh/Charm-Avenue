import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import AutoRefresh from '@/components/AutoRefresh';
import type { DbOrder, OrderStatus } from '@/lib/supabase/types';
import { normalizeOrder } from '@/lib/supabase/normalize-order';
import OrderStatusSelect from './OrderStatusSelect';
import { OrderRow, OrderCard, StopPropagation } from './OrderRow';

type OrderRowData = DbOrder & { order_items: { count: number }[] };

const STATUS_FILTERS: { key: OrderStatus | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'pending_whatsapp', label: 'Pending WhatsApp' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

const VALID_STATUSES = new Set<string>(STATUS_FILTERS.map((f) => f.key).filter(Boolean));

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status && VALID_STATUSES.has(status) ? (status as OrderStatus) : undefined;

  const supabase = await createClient();

  let listQuery = supabase
    .from('orders')
    .select('*, order_items(count)')
    .order('created_at', { ascending: false });
  if (statusFilter) listQuery = listQuery.eq('status', statusFilter);

  const [{ data: orders, error }, { data: allOrders }] = await Promise.all([
    listQuery,
    supabase.from('orders').select('status, subtotal'),
  ]);

  const list = ((orders as OrderRowData[] | null) ?? []).map(normalizeOrder);
  const all = ((allOrders as Pick<DbOrder, 'status' | 'subtotal'>[] | null) ?? []).map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
  }));
  const pendingCount = all.filter(
    (o) => o.status === 'pending_whatsapp' || o.status === 'pending_payment'
  ).length;
  const paidOrders = all.filter((o) => o.status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);

  // Total/Revenue are neutral aggregates (like Products' "Total"); Pending
  // and Paid are actual states, so each gets its own semantic color instead
  // of every card sharing the brand-rose treatment.
  const stats = [
    {
      key: 'total',
      icon: 'ShoppingBagIcon',
      label: 'Total',
      value: all.length,
      iconBg: 'var(--blush-bg)',
      iconColor: 'var(--blush-muted)',
      valueColor: 'var(--blush-text)',
    },
    {
      key: 'pending',
      icon: 'ClockIcon',
      label: 'Pending',
      value: pendingCount,
      iconBg: '#FBEBCF',
      iconColor: '#A6740A',
      valueColor: 'var(--blush-text)',
      dotColor: '#A6740A',
    },
    {
      key: 'paid',
      icon: 'CheckCircleIcon',
      label: 'Paid',
      value: paidOrders.length,
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
      valueColor: 'var(--blush-text)',
      dotColor: '#2E7D32',
    },
    {
      key: 'revenue',
      icon: 'BanknotesIcon',
      label: 'Revenue',
      value: `₹${revenue}`,
      iconBg: 'var(--blush-bg)',
      iconColor: 'var(--blush-muted)',
      valueColor: 'var(--blush-text)',
    },
  ];

  return (
    <div>
      {/* Picks up new WhatsApp enquiries and status changes without a manual reload. */}
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Orders
        </h1>
      </div>

      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="bg-white rounded-2xl border p-4 md:p-5 flex flex-col gap-3 md:gap-4"
              style={{ borderColor: 'var(--blush-border)' }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: stat.iconBg }}
              >
                <Icon name={stat.icon} size={14} style={{ color: stat.iconColor }} />
              </span>
              <div className="min-w-0">
                <p
                  className="font-elegant-serif font-bold text-2xl md:text-3xl leading-none truncate"
                  style={{ color: stat.valueColor, fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat.value}
                </p>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mt-2"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  {stat.dotColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: stat.dotColor }}
                    />
                  )}
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav
        className="flex items-center flex-wrap gap-6 mb-8"
        style={{ borderBottom: '1px solid var(--blush-border)' }}
      >
        {STATUS_FILTERS.map((f) => {
          const active = (statusFilter ?? '') === f.key;
          return (
            <Link
              key={f.label}
              href={f.key ? `/admin/orders?status=${f.key}` : '/admin/orders'}
              className="text-sm font-semibold pb-3 transition-colors"
              style={{
                color: active ? 'var(--blush-text)' : 'var(--blush-muted)',
                borderBottom: active ? '2px solid var(--blush-rose)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {error && (
        <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon
              name="ExclamationTriangleIcon"
              size={18}
              style={{ color: 'var(--blush-rose-dark)' }}
            />
          </span>
          <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
            Couldn&apos;t load orders: {error.message}.
          </p>
        </div>
      )}

      {!error && list.length === 0 && (
        <div className="bg-white rounded-3xl p-14 card-bubble text-center">
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon name="ShoppingBagIcon" size={26} style={{ color: 'var(--blush-border)' }} />
          </span>
          <p className="font-bold mb-1" style={{ color: 'var(--blush-text)' }}>
            No orders {statusFilter ? 'with this status' : 'yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
            WhatsApp enquiries will show up here.
          </p>
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="bg-white rounded-2xl border lg:hidden"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          {list.map((order) => (
            <OrderCard
              key={order.id}
              orderId={order.id}
              className="flex flex-col gap-3 p-4 border-b last:border-0 transition-colors duration-150 hover:bg-[var(--blush-bg)]"
              style={{
                borderColor: 'var(--blush-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className="font-bold tracking-tight text-[0.9375rem] truncate min-w-0 flex-1"
                  style={{ color: 'var(--blush-text)' }}
                >
                  {order.guest_name || 'WhatsApp enquiry'}
                </p>
                <StopPropagation>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </StopPropagation>
              </div>
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: 'var(--blush-muted)' }}
              >
                <span>{order.guest_phone || 'N/A'}</span>
                <span className="font-semibold" style={{ color: 'var(--blush-muted)' }}>
                  #{order.id.slice(0, 8)}
                </span>
              </div>
              <div
                className="flex items-center justify-between text-xs pt-2 border-t"
                style={{ color: 'var(--blush-muted)', borderColor: 'var(--blush-border)' }}
              >
                <span>
                  {order.order_items?.[0]?.count ?? 0} item(s) ·{' '}
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span
                  className="font-elegant-serif font-semibold text-sm"
                  style={{ color: 'var(--blush-text)' }}
                >
                  ₹{order.subtotal}
                </span>
              </div>
            </OrderCard>
          ))}
          <div
            className="px-4 py-3 border-t text-xs"
            style={{
              borderColor: 'var(--blush-border)',
              color: 'var(--blush-muted)',
              background: 'var(--blush-bg)',
            }}
          >
            Showing {list.length} {list.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
      )}

      {!error && list.length > 0 && (
        <div
          className="hidden lg:block bg-white rounded-3xl border overflow-x-auto"
          style={{ borderColor: 'var(--blush-border)' }}
        >
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr style={{ background: 'var(--blush-bg)' }}>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Customer
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Order
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Items
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Total
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Date
                </th>
                <th
                  className="px-5 py-3.5 font-bold text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((order) => (
                <OrderRow
                  key={order.id}
                  orderId={order.id}
                  className="border-t transition-colors duration-150 hover:bg-[var(--blush-bg)]"
                  style={{
                    borderColor: 'var(--blush-border)',
                  }}
                >
                  <td className="px-5 py-4">
                    <p
                      className="font-bold tracking-tight text-[0.9375rem]"
                      style={{ color: 'var(--blush-text)' }}
                    >
                      {order.guest_name || 'WhatsApp enquiry'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>
                      {order.guest_phone || 'N/A'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold" style={{ color: 'var(--blush-muted)' }}>
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--blush-text)' }}>
                    {order.order_items?.[0]?.count ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="font-elegant-serif font-semibold"
                      style={{ color: 'var(--blush-text)' }}
                    >
                      ₹{order.subtotal}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--blush-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <StopPropagation>
                      <OrderStatusSelect orderId={order.id} status={order.status} />
                    </StopPropagation>
                  </td>
                </OrderRow>
              ))}
            </tbody>
          </table>
          <div
            className="px-5 py-3 border-t text-xs"
            style={{
              borderColor: 'var(--blush-border)',
              color: 'var(--blush-muted)',
              background: 'var(--blush-bg)',
            }}
          >
            Showing {list.length} {list.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
      )}

      {!error && all.length > 0 && all.length < 5 && (
        <div
          className="mt-4 rounded-2xl border p-4 md:p-5 flex items-center gap-3"
          style={{ borderColor: 'var(--blush-border)', background: 'var(--blush-bg)' }}
        >
          <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <Icon name="SparklesIcon" size={14} style={{ color: 'var(--blush-muted)' }} />
          </span>
          <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
            New orders will appear here automatically the moment a customer checks out.
          </p>
        </div>
      )}
    </div>
  );
}
