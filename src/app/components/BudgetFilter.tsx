'use client';
import React, { useState, useEffect, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS } from '@/lib/products';

type FilterKey = 'all' | 'under499' | 'under999';

const filters: { key: FilterKey; label: string; emoji: string }[] = [
    { key: 'all', label: 'All Finds', emoji: '✨' },
    { key: 'under499', label: 'Under ₹499', emoji: '🏷️' },
    { key: 'under999', label: 'Under ₹999', emoji: '💸' },
];

export default function BudgetFilter() {
    const [active, setActive] = useState<FilterKey>('all');
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('active');
                        observer.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.08 }
        );
        sectionRef.current?.querySelectorAll('.reveal, .reveal-scale').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const filtered = PRODUCTS.filter((p) => {
        if (active === 'under499') return p.price < 499;
        if (active === 'under999') return p.price < 999;
        return true;
    });

    return (
        <section ref={sectionRef} className="w-full px-4 md:px-10 pt-14 pb-12" style={{ background: 'var(--blush-border)' }}>
            <div className="max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="reveal mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <span className="badge-pill text-white mb-3 inline-flex" style={{ background: 'var(--blush-rose)' }}>
                            <span>🏷️</span> Budget Friendly
                        </span>
                        <h2 className="font-elegant-serif text-section-title tracking-tight" style={{ color: 'var(--blush-text)' }}>
                            Impulse Buys{' '}
                            <span style={{ color: 'var(--blush-rose)' }}>You Need</span>
                        </h2>
                    </div>
                    <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--blush-muted)' }}>
                        Because cute shouldn't cost a fortune. Filter by your budget.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="reveal flex gap-2 mb-8 flex-wrap">
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

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filtered.map((product, i) => (
                        <ProductCard key={product.id} product={product} transitionDelay={i * 60} className="reveal-scale" />
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
    );
}
