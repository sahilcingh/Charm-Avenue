import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';
import ProductCard from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { mapProductRow } from '@/lib/supabase/product-mapper';
import type { DbCategory, DbProduct } from '@/lib/supabase/types';

export const metadata: Metadata = {
    title: 'My Wishlist | Charm Avenue by Nandini',
    description: 'Your saved favorites from Charm Avenue.',
};

interface WishlistRow {
    products: (DbProduct & { category: Pick<DbCategory, 'title'> | null }) | null;
}

export default async function WishlistPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/wishlist');
    }

    const { data } = await supabase
        .from('wishlist_items')
        .select('products(*, category:categories(title))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const products = ((data ?? []) as unknown as WishlistRow[])
        .filter((row) => row.products?.is_active)
        .map((row) => mapProductRow(row.products!, row.products!.category?.title));

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow="🤍 My Wishlist"
                title={
                    <>
                        Your saved <span className="font-script" style={{ color: 'var(--blush-rose)' }}>favorites</span>
                    </>
                }
                subtitle="Everything you've hearted, all in one place."
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]}
            />

            <section className="w-full px-4 md:px-10 pt-6 pb-16">
                <div className="max-w-screen-2xl mx-auto">
                    {products.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,32vw,16rem),1fr))] gap-3 md:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <span className="text-5xl block mb-4">🤍</span>
                            <h2 className="font-elegant-serif text-2xl mb-2" style={{ color: 'var(--blush-text)' }}>Your wishlist is empty</h2>
                            <p className="mb-8" style={{ color: 'var(--blush-muted)' }}>
                                Tap the heart on anything you love to save it here.
                            </p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                                style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                            >
                                <Icon name="HeartIcon" size={16} />
                                Start Browsing
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
