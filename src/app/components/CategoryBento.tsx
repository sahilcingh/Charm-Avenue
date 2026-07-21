'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { CATEGORIES, type CategorySlug } from '@/lib/products';

const layoutBySlug: Record<CategorySlug, { colSpan: string; rowSpan: string; minHeight: string }> = {
    jewellery: { colSpan: 'md:col-span-2', rowSpan: 'md:row-span-2', minHeight: 'min-h-[420px] md:min-h-[500px]' },
    hair: { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1', minHeight: 'min-h-[220px]' },
    makeup: { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1', minHeight: 'min-h-[220px]' },
    accessories: { colSpan: 'md:col-span-1', rowSpan: 'md:row-span-1', minHeight: 'min-h-[220px]' },
    pouches: { colSpan: 'md:col-span-2', rowSpan: 'md:row-span-1', minHeight: 'min-h-[220px]' },
};

export default function CategoryBento() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08 }
        );
        const elements = sectionRef.current?.querySelectorAll('.reveal, .reveal-scale');
        elements?.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="w-full px-4 md:px-10 pt-16 pb-12" style={{ background: 'var(--blush-bg)' }}>
            {/* Header */}
            <div className="max-w-screen-xl mx-auto mb-10">
                <div className="reveal flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <span
                            className="badge-pill mb-3 inline-flex"
                            style={{ background: '#FFFFFF', color: 'var(--blush-rose)', border: '1px solid var(--blush-border)' }}
                        >
                            <span>🛍️</span> Shop by Category
                        </span>
                        <h2 className="font-elegant-serif text-section-title tracking-tight" style={{ color: 'var(--blush-text)' }}>
                            All the{' '}
                            <span style={{ color: 'var(--blush-rose)' }}>Cute Stuff</span>
                            <br />
                            in one place.
                        </h2>
                    </div>
                    <p className="text-base leading-relaxed max-w-xs" style={{ color: 'var(--blush-muted)' }}>
                        5 categories. Endless charm. Every piece tells a story.
                    </p>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
                {CATEGORIES.map((cat, i) => {
                    const layout = layoutBySlug[cat.slug];
                    return (
                        <Link
                            key={cat.slug}
                            href={`/shop/${cat.slug}`}
                            className={`block relative ${layout.colSpan} ${layout.rowSpan} ${layout.minHeight} rounded-3xl overflow-hidden group cursor-pointer reveal-scale card-depth`}
                            style={{ transitionDelay: `${i * 80}ms` }}
                        >
                            {/* Image */}
                            <AppImage
                                src={cat.image}
                                alt={cat.imageAlt}
                                fill
                                className="object-cover grayscale-hover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            {/* Gradient scrim */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E1712]/80 via-[#1E1712]/30 to-transparent" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 z-10">
                                {/* Top tag */}
                                <div className="flex justify-between items-start">
                                    <span
                                        className="badge-pill shadow-sm"
                                        style={{ background: cat.tagBg, color: cat.tagText }}
                                    >
                                        {cat.emoji} {cat.tag}
                                    </span>
                                    <span className="w-9 h-9 rounded-full glass-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Icon name="ArrowUpRightIcon" size={16} className="text-white" />
                                    </span>
                                </div>

                                {/* Bottom text */}
                                <div>
                                    <h3 className="font-elegant-serif text-white text-xl md:text-2xl leading-tight mb-1">
                                        {cat.title}
                                    </h3>
                                    <p className="text-white/80 text-xs md:text-sm font-medium">{cat.subtitle}</p>
                                    <span className="mt-3 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        Explore <Icon name="ChevronRightIcon" size={14} className="text-white" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
