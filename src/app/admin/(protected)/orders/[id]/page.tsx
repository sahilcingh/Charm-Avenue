import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbOrderItem } from '@/lib/supabase/types';
import OrderStatusSelect from '../OrderStatusSelect';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (!order) notFound();

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);
    const orderItems = (items ?? []) as DbOrderItem[];

    return (
        <div>
            <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 hover:opacity-70 transition-opacity animate-enter"
                style={{ color: 'var(--blush-rose)' }}
            >
                <Icon name="ArrowLeftIcon" size={14} />
                Back to Orders
            </Link>

            <div className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-6 animate-enter delay-200">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="font-elegant-serif text-2xl" style={{ color: 'var(--blush-text)' }}>
                            Order #{order.id.slice(0, 8)}
                        </h1>
                        <p className="text-xs mt-1" style={{ color: 'var(--blush-muted)' }}>
                            Placed {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--blush-muted)' }}>Name</p>
                        <p className="text-sm" style={{ color: 'var(--blush-text)' }}>{order.guest_name}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--blush-muted)' }}>Phone</p>
                        <p className="text-sm" style={{ color: 'var(--blush-text)' }}>{order.guest_phone}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--blush-muted)' }}>Address</p>
                        <p className="text-sm" style={{ color: 'var(--blush-text)' }}>{order.guest_address}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: 'var(--blush-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--blush-muted)' }}>Items</p>
                    {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm gap-3" style={{ color: 'var(--blush-text)' }}>
                            <span>
                                {item.product_name} x{item.quantity}
                                {item.variant_label && (
                                    <span className="block text-xs" style={{ color: 'var(--blush-muted)' }}>{item.variant_label}</span>
                                )}
                                {item.personalization_text && (
                                    <span className="block text-xs italic" style={{ color: 'var(--blush-muted)' }}>&ldquo;{item.personalization_text}&rdquo;</span>
                                )}
                            </span>
                            <span className="font-bold shrink-0">₹{item.unit_price * item.quantity}</span>
                        </div>
                    ))}
                </div>

                {order.discount_total > 0 && (
                    <div className="flex items-center justify-between text-sm pt-4 border-t" style={{ color: 'var(--blush-rose)', borderColor: 'var(--blush-border)' }}>
                        <span>🎁 Combo discount</span>
                        <span className="font-bold">−₹{order.discount_total}</span>
                    </div>
                )}

                <div className={`flex items-center justify-between ${order.discount_total > 0 ? '' : 'pt-4 border-t'}`} style={{ borderColor: 'var(--blush-border)' }}>
                    <span className="font-bold" style={{ color: 'var(--blush-text)' }}>Total</span>
                    <span className="font-elegant-serif font-bold text-xl" style={{ color: 'var(--blush-rose)' }}>
                        ₹{order.subtotal}
                    </span>
                </div>

                {order.payment_gateway_order_id && (
                    <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                        Cashfree order id: {order.payment_gateway_order_id}
                        {order.payment_gateway_payment_id && ` · payment id: ${order.payment_gateway_payment_id}`}
                    </p>
                )}
            </div>
        </div>
    );
}
