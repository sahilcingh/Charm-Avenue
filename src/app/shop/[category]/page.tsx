import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ProductCard from '@/components/ProductCard';
import { getCategories, getCategoryBySlug, getProductsByCategory } from '@/lib/supabase/products-data';

export async function generateStaticParams() {
    const categories = await getCategories();
    return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}): Promise<Metadata> {
    const { category } = await params;
    const cat = await getCategoryBySlug(category);
    if (!cat) return {};
    return {
        title: `${cat.title} | Charm Avenue by Nandini`,
        description: cat.description,
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ category: string }>;
}) {
    const { category } = await params;
    const cat = await getCategoryBySlug(category);
    if (!cat) notFound();

    const [allCategories, products] = await Promise.all([getCategories(), getProductsByCategory(cat.slug)]);

    return (
        <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
            <Header />
            <PageHero
                eyebrow={`${cat.emoji} ${cat.tag}`}
                title={cat.title}
                subtitle={cat.description}
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: cat.title }]}
            />

            <section className="w-full px-4 md:px-10 pt-6 pb-16" style={{ background: 'var(--blush-bg)' }}>
                <div className="max-w-screen-2xl mx-auto">
                    {/* Other categories */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                        {allCategories.map((c) => (
                            <Link
                                key={c.slug}
                                href={`/shop/${c.slug}`}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300"
                                style={
                                    c.slug === cat.slug
                                        ? { background: 'var(--blush-rose)', color: '#FFFFFF' }
                                        : { background: '#FFFFFF', color: 'var(--blush-text)', border: '1px solid var(--blush-border)' }
                                }
                            >
                                <span>{c.emoji}</span> {c.title}
                            </Link>
                        ))}
                    </div>

                    <p className="text-sm font-medium mb-6" style={{ color: 'var(--blush-muted)' }}>
                        {products.length} product{products.length === 1 ? '' : 's'}
                    </p>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,32vw,16rem),1fr))] gap-3 md:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16" style={{ color: 'var(--blush-muted)' }}>
                            <span className="text-4xl block mb-3">✨</span>
                            <p className="font-medium">New styles dropping soon in this category!</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
