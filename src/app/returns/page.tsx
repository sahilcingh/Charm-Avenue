import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
    title: 'Returns Policy | Charm Avenue by Nandini',
    description: 'Our returns and exchange policy at Charm Avenue by Nandini.',
};

const sections = [
    {
        heading: 'No Return or Exchange',
        body: (
            <p>
                All products are non-returnable and non-exchangeable. Please check the product details carefully
                before placing your order.
            </p>
        ),
    },
    {
        heading: 'Please Choose Carefully',
        body: (
            <p>
                Since we&apos;re unable to accept returns or exchanges, we&apos;d love for you to take a moment to
                review the size, colour and description of each item before checking out.
            </p>
        ),
    },
    {
        heading: 'Questions Before You Order?',
        body: (
            <p>
                Not sure if a piece is right for you? Reach out on our Contact page before placing your order and
                we&apos;ll be happy to help.
            </p>
        ),
    },
];

export default function ReturnsPage() {
    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="📋 Returns"
                title="Returns Policy"
                subtitle="Please read our return and exchange policy before placing your order."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Returns' }]}
            />
            <PolicyContent sections={sections} updatedAt="19 July 2026" />
            <Footer />
        </main>
    );
}
