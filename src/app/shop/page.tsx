import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ShopClient from './ShopClient';
import { getCategories, getAllActiveProducts } from '@/lib/supabase/products-data';

export const metadata: Metadata = {
    title: 'Shop All | Charm Avenue by Nandini',
    description: 'Shop cute accessories, hair accessories, gifts & novelty and trending finds — starting at just ₹150.',
};

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const initialFilter = params?.filter === 'new' ? 'new' : 'all';
    const [categories, products] = await Promise.all([getCategories(), getAllActiveProducts()]);

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🛍️ Shop All"
                title={
                    <>
                        All the <span style={{ color: 'var(--blush-rose)' }}>Cute Stuff</span> in one place.
                    </>
                }
                subtitle="Cute accessories, hair accessories, gifts & novelty and trending finds — starting at just ₹150."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
            />
            <ShopClient initialFilter={initialFilter} products={products} categories={categories} />
            <Footer />
        </main>
    );
}
