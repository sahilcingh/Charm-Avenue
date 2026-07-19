import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
    title: 'Returns & Refunds | Charm Avenue by Nandini',
    description: 'Our 7-day return window, conditions and refund process at Charm Avenue by Nandini.',
};

const sections = [
    {
        heading: '7-Day Return Window',
        body: (
            <p>
                Not the right fit or vibe? You can request a return within 7 days of delivery for most items, no
                questions asked.
            </p>
        ),
    },
    {
        heading: 'Return Conditions',
        body: (
            <ul className="list-disc list-inside space-y-1.5">
                <li>Items must be unused, unworn and in their original packaging.</li>
                <li>Earrings and other hygiene-sensitive items cannot be returned once opened.</li>
                <li>Items marked "Final Sale" are not eligible for return.</li>
            </ul>
        ),
    },
    {
        heading: 'How to Initiate a Return',
        body: (
            <p>
                Message us on WhatsApp or through the Contact page with your order number and reason for return.
                We&apos;ll share pickup or drop-off instructions within 24 hours.
            </p>
        ),
    },
    {
        heading: 'Refunds',
        body: (
            <p>
                Once we receive and inspect your return, refunds are processed to your original payment method within
                5–7 business days. COD orders are refunded via bank transfer or store credit.
            </p>
        ),
    },
];

export default function ReturnsPage() {
    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
            <PageHero
                eyebrow="💝 Returns"
                title="Returns & Refunds"
                subtitle="Easy 7-day returns, because we want you to love every piece you order."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Returns' }]}
            />
            <PolicyContent sections={sections} updatedAt="19 July 2026" />
            <Footer />
        </main>
    );
}
