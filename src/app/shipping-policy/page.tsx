import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
    title: 'Shipping Policy | Charm Avenue by Nandini',
    description: 'Shipping timelines, charges and order tracking for Charm Avenue by Nandini.',
};

const sections = [
    {
        heading: 'Processing Time',
        body: (
            <p>
                Orders are packed and handed to our courier partners within 1–2 business days of being placed. During
                sales or festive drops, processing may take up to 3 business days.
            </p>
        ),
    },
    {
        heading: 'Delivery Timelines',
        body: (
            <p>
                We ship Pan India and most orders arrive within 2–5 business days of dispatch, depending on your
                location. Remote areas may take a little longer.
            </p>
        ),
    },
    {
        heading: 'Shipping Charges & COD',
        body: (
            <>
                <p>Shipping is free on prepaid orders above ₹499. A small shipping fee applies below that threshold.</p>
                <p>Cash on Delivery (COD) is available on all orders, with a nominal COD handling fee.</p>
            </>
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
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
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
