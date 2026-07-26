import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Icon from '@/components/ui/AppIcon';
import ProductCard from '@/components/ProductCard';
import { getAllActiveProducts } from '@/lib/supabase/products-data';
import { filterProductsBySearch } from '@/lib/supabase/product-search';

export const metadata: Metadata = {
  title: 'Search | Charm Avenue by Nandini',
  description:
    'Search Charm Avenue for cute accessories, hair accessories, gifts & novelty and trending finds.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const results = query ? filterProductsBySearch(await getAllActiveProducts(), query) : [];

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--blush-bg)' }}>
      <Header />
      <PageHero
        eyebrow="🔍 Search"
        title={query ? `Results for "${query}"` : 'Search Charm Avenue'}
        subtitle={
          query
            ? `${results.length} product${results.length === 1 ? '' : 's'} found`
            : 'Type something in the search bar above to get started.'
        }
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}
      />
      <section className="w-full px-4 md:px-10 pb-16">
        <div className="max-w-screen-2xl mx-auto">
          {query && results.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--blush-muted)' }}>
              <span className="text-4xl block mb-3">🔍</span>
              <p className="font-medium mb-6">
                No products match &quot;{query}&quot;. Try a different search.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'var(--blush-rose-button)',
                  boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
                }}
              >
                <Icon name="ShoppingBagIcon" size={16} />
                Browse All Products
              </Link>
            </div>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,32vw,16rem),1fr))] gap-3 md:gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
