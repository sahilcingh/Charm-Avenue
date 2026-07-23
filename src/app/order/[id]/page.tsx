import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';
import AutoRefresh from '@/components/AutoRefresh';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { DbOrder, DbOrderItem } from '@/lib/supabase/types';
import { ORDER_STATUS_LABELS } from '@/lib/order-status';

export const metadata: Metadata = {
  title: 'Your Order | Charm Avenue by Nandini',
  description: 'View your Charm Avenue order enquiry status.',
};

export default async function OrderLookupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // No login required — placing an enquiry never required an account, so
  // viewing its confirmation shouldn't either. Fetched with the service-role
  // client (bypasses RLS) and filtered to this exact id: the only way to
  // reach this page at all is by knowing the order's own unguessable UUID,
  // the same "the link is the credential" model Stripe/Shopify use for
  // guest order-confirmation pages — there's no public SELECT policy on
  // `orders` itself, so a bare API/table query still requires login or admin.
  const supabase = createServiceClient();
  if (!supabase)
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured — order confirmation pages cannot load.'
    );

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);
  const orderRow = order as DbOrder;
  const orderItems = (items ?? []) as DbOrderItem[];
  const status = ORDER_STATUS_LABELS[orderRow.status];

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      {/* Picks up a status change (e.g. the admin marking this "Paid") without a manual reload. */}
      <AutoRefresh />
      <Header />
      <PageHero
        eyebrow="🎀 Enquiry Received"
        title="Your Order Enquiry Has Been Received"
        subtitle="Keep this page's link — you can check back on your enquiry status here anytime."
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

            {orderRow.guest_name || orderRow.guest_phone || orderRow.guest_address ? (
              <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--blush-text)' }}>
                {orderRow.guest_name && (
                  <p>
                    <span style={{ color: 'var(--blush-muted)' }}>Name:</span> {orderRow.guest_name}
                  </p>
                )}
                {orderRow.guest_phone && (
                  <p>
                    <span style={{ color: 'var(--blush-muted)' }}>Phone:</span>{' '}
                    {orderRow.guest_phone}
                  </p>
                )}
                {orderRow.guest_address && (
                  <p>
                    <span style={{ color: 'var(--blush-muted)' }}>Address:</span>{' '}
                    {orderRow.guest_address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
                We&apos;ll get your delivery details directly over WhatsApp.
              </p>
            )}

            <div
              className="flex flex-col gap-2 pt-4 border-t"
              style={{ borderColor: 'var(--blush-border)' }}
            >
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm gap-3"
                  style={{ color: 'var(--blush-text)' }}
                >
                  <span>
                    {item.product_name} x{item.quantity}
                    {item.variant_label && (
                      <span className="block text-xs" style={{ color: 'var(--blush-muted)' }}>
                        {item.variant_label}
                      </span>
                    )}
                    {item.personalization_text && (
                      <span
                        className="block text-xs italic"
                        style={{ color: 'var(--blush-muted)' }}
                      >
                        &ldquo;{item.personalization_text}&rdquo;
                      </span>
                    )}
                  </span>
                  <span className="font-bold shrink-0">₹{item.unit_price * item.quantity}</span>
                </div>
              ))}
            </div>

            {orderRow.discount_total > 0 && (
              <div
                className="flex items-center justify-between text-sm pt-4 border-t"
                style={{ color: 'var(--blush-rose)', borderColor: 'var(--blush-border)' }}
              >
                <span>🎁 Combo discount</span>
                <span className="font-bold">−₹{orderRow.discount_total}</span>
              </div>
            )}

            <div
              className={`flex items-center justify-between ${orderRow.discount_total > 0 ? '' : 'pt-4 border-t'}`}
              style={{ borderColor: 'var(--blush-border)' }}
            >
              <span className="font-bold" style={{ color: 'var(--blush-text)' }}>
                Total
              </span>
              <span
                className="font-elegant-serif font-bold text-xl"
                style={{ color: 'var(--blush-rose)' }}
              >
                ₹{orderRow.subtotal}
              </span>
            </div>

            {orderRow.status === 'pending_whatsapp' && (
              <p
                className="text-xs flex items-center gap-1.5"
                style={{ color: 'var(--blush-muted)' }}
              >
                <Icon name="ChatBubbleLeftRightIcon" size={14} />
                Reply in the WhatsApp chat that opened — we&apos;ll confirm availability and
                delivery there.
              </p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
