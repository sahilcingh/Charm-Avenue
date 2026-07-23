'use client';
import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product, Category } from '@/lib/supabase/product-mapper';

type FilterKey = 'all' | 'new';

interface ShopClientProps {
  initialFilter: FilterKey;
  products: Product[];
  categories: Category[];
}

export default function ShopClient({ initialFilter, products, categories }: ShopClientProps) {
  const filtered = products.filter((p) => {
    if (initialFilter === 'new') return p.tag?.toLowerCase().includes('new');
    return true;
  });

  return (
    <>
      {/* Category quick links */}
      <section className="w-full px-4 md:px-10 pt-10" style={{ background: 'var(--blush-bg)' }}>
        <div className="max-w-screen-2xl mx-auto flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white font-bold text-sm transition-all duration-300"
              style={{ border: '1px solid var(--blush-border)', color: 'var(--blush-text)' }}
            >
              <span>{cat.emoji}</span> {cat.title}
            </Link>
          ))}
        </div>
      </section>

      <section
        className="w-full px-4 md:px-10 pt-6 pb-16"
        style={{ background: 'var(--blush-bg)' }}
      >
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-sm font-medium mb-6" style={{ color: 'var(--blush-muted)' }}>
            {filtered.length} product{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,32vw,16rem),1fr))] gap-3 md:gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--blush-muted)' }}>
              <span className="text-4xl block mb-3">🛍️</span>
              <p className="font-medium">No items in this range yet — check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
