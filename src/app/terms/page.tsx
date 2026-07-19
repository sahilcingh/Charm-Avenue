import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import PolicyContent from '@/components/PolicyContent';

export const metadata: Metadata = {
    title: 'Terms of Service | Charm Avenue by Nandini',
    description: 'The terms and conditions for using the Charm Avenue by Nandini website and placing orders.',
};

const sections = [
    {
        heading: 'Acceptance of Terms',
        body: (
            <p>
                By browsing or placing an order on Charm Avenue, you agree to these terms. If you don&apos;t agree,
                please don&apos;t use the site.
            </p>
        ),
    },
    {
        heading: 'Orders & Payments',
        body: (
            <p>
                All orders are subject to availability and confirmation. Prices are listed in INR and may change
                without notice. We reserve the right to cancel any order suspected of fraud or error in pricing.
            </p>
        ),
    },
    {
        heading: 'Use of the Website',
        body: (
            <p>
                You agree to use this site only for lawful purposes and not to misuse, copy or resell any content,
                images or product designs without permission.
            </p>
        ),
    },
    {
        heading: 'Intellectual Property',
        body: (
            <p>
                All logos, product photography and content on this site belong to Charm Avenue by Nandini and may not
                be reproduced without written consent.
            </p>
        ),
    },
    {
        heading: 'Limitation of Liability',
        body: (
            <p>
                Charm Avenue is not liable for indirect or incidental damages arising from the use of, or inability to
                use, our products or website.
            </p>
        ),
    },
    {
        heading: 'Governing Law',
        body: <p>These terms are governed by the laws of India, with courts in India having exclusive jurisdiction.</p>,
    },
    {
        heading: 'Changes to These Terms',
        body: (
            <p>
                We may update these terms from time to time. Continued use of the site after changes means you accept
                the updated terms.
            </p>
        ),
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
            <PageHero
                eyebrow="📜 Terms"
                title="Terms of Service"
                subtitle="The terms and conditions for using our website and placing orders."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms' }]}
            />
            <PolicyContent sections={sections} updatedAt="19 July 2026" />
            <Footer />
        </main>
    );
}
