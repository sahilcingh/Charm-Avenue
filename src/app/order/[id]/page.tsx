import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/server';
import type { DbOrder, DbOrderItem } from '@/lib/supabase/types';
import { ORDER_STATUS_LABELS } from '@/lib/order-status';

export const metadata: Metadata = {
    title: 'Your Order | Charm Avenue by Nandini',
    description: 'View your Charm Avenue order status.',
};

export default async function OrderLookupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/order/${id}`);
    }

    // RLS ("customers can read their own orders") scopes this to the
    // signed-in user's own orders — a stranger who guesses/knows this id
    // simply gets no row back, indistinguishable from a nonexistent order.
    const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (!order) notFound();

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);
    const orderRow = order as DbOrder;
    const orderItems = (items ?? []) as DbOrderItem[];
    const status = ORDER_STATUS_LABELS[orderRow.status];

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🎀 Order Confirmed"
                title="Thank You for Your Order"
                subtitle="Keep this page's link — you can check back on your order status here anytime."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Order' }]}
            />
            <section className="w-full px-4 md:px-10 pb-20">
                <div className="max-w-screen-md mx-auto grid gap-6">
                    <div className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>
                                Order #{orderRow.id.slice(0, 8)}
                            </h2>
                            <span
                                className="badge-pill text-xs font-bold"
                                style={{ background: status.bg, color: status.color }}
                            >
                                {status.label}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--blush-text)' }}>
                            <p><span style={{ color: 'var(--blush-muted)' }}>Name:</span> {orderRow.guest_name}</p>
                            <p><span style={{ color: 'var(--blush-muted)' }}>Phone:</span> {orderRow.guest_phone}</p>
                            <p><span style={{ color: 'var(--blush-muted)' }}>Address:</span> {orderRow.guest_address}</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: 'var(--blush-border)' }}>
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

                        {orderRow.discount_total > 0 && (
                            <div className="flex items-center justify-between text-sm pt-4 border-t" style={{ color: 'var(--blush-rose)', borderColor: 'var(--blush-border)' }}>
                                <span>🎁 Combo discount</span>
                                <span className="font-bold">−₹{orderRow.discount_total}</span>
                            </div>
                        )}

                        <div className={`flex items-center justify-between ${orderRow.discount_total > 0 ? '' : 'pt-4 border-t'}`} style={{ borderColor: 'var(--blush-border)' }}>
                            <span className="font-bold" style={{ color: 'var(--blush-text)' }}>Total</span>
                            <span className="font-elegant-serif font-bold text-xl" style={{ color: 'var(--blush-rose)' }}>
                                ₹{orderRow.subtotal}
                            </span>
                        </div>

                        {orderRow.status === 'pending_whatsapp' && (
                            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--blush-muted)' }}>
                                <Icon name="ChatBubbleLeftRightIcon" size={14} />
                                Reply in the WhatsApp chat that opened — we&apos;ll confirm availability and delivery there.
                            </p>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    );
}
