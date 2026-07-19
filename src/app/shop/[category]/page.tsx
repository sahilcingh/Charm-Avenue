import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES, getCategoryBySlug, getProductsByCategory } from '@/lib/products';

export function generateStaticParams() {
    return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ category: string }>;
}): Promise<Metadata> {
    const { category } = await params;
    const cat = getCategoryBySlug(category);
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
    const cat = getCategoryBySlug(category);
    if (!cat) notFound();

    const products = getProductsByCategory(cat.slug);

    return (
        <main className="min-h-screen bg-[#FFF0F7] overflow-x-hidden">
            <Header variant="solid" />
            <PageHero
                eyebrow={`${cat.emoji} ${cat.tag}`}
                title={cat.title}
                subtitle={cat.description}
                breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: cat.title }]}
            />

            <section className="bg-[#FFF0F7] w-full px-4 md:px-10 pt-6 pb-16">
                <div className="max-w-screen-xl mx-auto">
                    {/* Other categories */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                        {CATEGORIES.map((c) => (
                            <Link
                                key={c.slug}
                                href={`/shop/${c.slug}`}
                                className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${c.slug === cat.slug
                                        ? 'bg-[#E91E8C] text-white'
                                        : 'bg-white border border-[#FFCCE8] text-[#3D0030] hover:border-[#E91E8C]/50 hover:bg-[#FFE4F4]'
                                    }`}
                            >
                                <span>{c.emoji}</span> {c.title}
                            </Link>
                        ))}
                    </div>

                    <p className="text-[#9B4070] text-sm font-medium mb-6">
                        {products.length} product{products.length === 1 ? '' : 's'}
                    </p>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-[#9B4070]">
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
