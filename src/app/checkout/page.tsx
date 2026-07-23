import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
    title: 'Checkout | Charm Avenue by Nandini',
    description: 'Enter your delivery details to complete your order.',
};

export default async function CheckoutPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/checkout');
    }

    const { data: profile } = await supabase.from('profiles').select('name, phone, address').eq('id', user.id).single();
    const prefill = {
        name: profile?.name ?? '',
        phone: profile?.phone ?? '',
        address: profile?.address ?? '',
    };

    // "Pay Now" only appears once real Cashfree credentials are configured —
    // no dead/broken button in the meantime.
    const paymentEnabled = Boolean(process.env.CASHFREE_APP_ID);

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🛍️ Checkout"
                title="Complete Your Order"
                subtitle="Enter your delivery details, then choose how you'd like to confirm your order."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
            />
            <CheckoutClient prefill={prefill} paymentEnabled={paymentEnabled} />
            <Footer />
        </main>
    );
}
