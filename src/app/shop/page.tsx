import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
    title: 'Shop All | Charm Avenue by Nandini',
    description: 'Shop anti-tarnish jewellery, hair accessories, cute makeup and trending finds — starting at just ₹150.',
};

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const initialFilter = params?.filter === 'new' ? 'new' : 'all';

    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
            <PageHero
                eyebrow="🛍️ Shop All"
                title={
                    <>
                        All the <span className="shimmer-text">Cute Stuff</span> in one place.
                    </>
                }
                subtitle="Anti-tarnish jewellery, hair accessories, cute makeup and trending finds — starting at just ₹150."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
            />
            <ShopClient initialFilter={initialFilter} />
            <Footer />
        </main>
    );
}
