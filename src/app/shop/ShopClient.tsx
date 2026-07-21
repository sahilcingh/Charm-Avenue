'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/lib/products';

type FilterKey = 'all' | 'new' | 'under499' | 'under999';

const filters: { key: FilterKey; label: string; emoji: string }[] = [
    { key: 'all', label: 'All Finds', emoji: '✨' },
    { key: 'new', label: 'New Arrivals', emoji: '🌸' },
    { key: 'under499', label: 'Under ₹499', emoji: '🏷️' },
    { key: 'under999', label: 'Under ₹999', emoji: '💸' },
];

export default function ShopClient({ initialFilter }: { initialFilter: FilterKey }) {
    const [active, setActive] = useState<FilterKey>(initialFilter);

    const filtered = PRODUCTS.filter((p) => {
        if (active === 'new') return p.tag?.toLowerCase().includes('new');
        if (active === 'under499') return p.price < 499;
        if (active === 'under999') return p.price < 999;
        return true;
    });

    return (
        <>
            {/* Category quick links */}
            <section className="w-full px-4 md:px-10 pt-10" style={{ background: 'var(--blush-bg)' }}>
                <div className="max-w-screen-xl mx-auto flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {CATEGORIES.map((cat) => (
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

            <section className="w-full px-4 md:px-10 pt-6 pb-16" style={{ background: 'var(--blush-bg)' }}>
                <div className="max-w-screen-xl mx-auto">
                    {/* Filter tabs */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setActive(f.key)}
                                className="px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-1.5"
                                style={
                                    active === f.key
                                        ? { background: 'var(--blush-rose)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(232,130,143,0.4)', transform: 'scale(1.05)' }
                                        : { background: '#FFFFFF', color: 'var(--blush-text)', border: '1px solid var(--blush-border)' }
                                }
                            >
                                <span>{f.emoji}</span> {f.label}
                            </button>
                        ))}
                    </div>

                    <p className="text-sm font-medium mb-6" style={{ color: 'var(--blush-muted)' }}>
                        {filtered.length} product{filtered.length === 1 ? '' : 's'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
