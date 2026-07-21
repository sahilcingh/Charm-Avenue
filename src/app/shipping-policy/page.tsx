import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
    title: 'Shipping Policy | Charm Avenue by Nandini',
    description: 'Prepaid ordering, secure packaging and shipping timelines for Charm Avenue by Nandini.',
};

const sections = [
    {
        heading: 'Prepaid Orders Only',
        body: (
            <p>
                We currently accept prepaid orders only. Cash on Delivery (COD) is not available at this time.
            </p>
        ),
    },
    {
        heading: 'Secure Packaging',
        body: (
            <p>
                Every order is carefully packed with secure and protective packaging to ensure your products reach you
                safely.
            </p>
        ),
    },
    {
        heading: 'Shipping',
        body: (
            <p>
                Orders are dispatched after successful payment confirmation. Delivery timelines may vary depending on
                your location and courier services.
            </p>
        ),
    },
    {
        heading: 'Order Tracking',
        body: (
            <p>
                Once your order ships, you&apos;ll receive a tracking link by email/SMS so you can follow it every step
                of the way.
            </p>
        ),
    },
    {
        heading: 'Questions?',
        body: <p>Reach out any time on our Contact page and we&apos;ll help sort out delivery questions quickly.</p>,
    },
];

export default function ShippingPolicyPage() {
    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🚀 Shipping"
                title="Shipping Policy"
                subtitle="Everything you need to know about how and when your order reaches you."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shipping Policy' }]}
            />
            <PolicyContent sections={sections} updatedAt="19 July 2026" />
            <Footer />
        </main>
    );
}
