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
        <section ref={sectionRef} className="bg-[#FFE4F4] w-full px-4 md:px-10 pt-14 pb-12">
            <div className="max-w-screen-xl mx-auto">
                {/* Header */}
                <div className="reveal mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <span className="badge-pill bg-[#E91E8C] text-white mb-3 inline-flex">
                            <span>🏷️</span> Budget Friendly
                        </span>
                        <h2 className="font-display text-section-title font-black text-[#3D0030] tracking-tight">
                            Impulse Buys{' '}
                            <span className="shimmer-text">You Need</span>
                        </h2>
                    </div>
                    <p className="text-[#9B4070] text-sm max-w-xs leading-relaxed">
                        Because cute shouldn't cost a fortune. Filter by your budget.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="reveal flex gap-2 mb-8 flex-wrap">
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActive(f.key)}
                            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-1.5 ${active === f.key
                                    ? 'bg-[#E91E8C] text-white shadow-lg scale-105'
                                    : 'bg-white text-[#3D0030] border border-[#FFCCE8] hover:border-[#E91E8C]/50 hover:bg-[#FFF0F7]'
                                }`}
                            style={active === f.key ? { boxShadow: '0 4px 16px rgba(233,30,140,0.35)' } : {}}
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
                    <div className="text-center py-16 text-[#9B4070]">
                        <span className="text-4xl block mb-3">🛍️</span>
                        <p className="font-medium">No items in this range yet — check back soon!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
