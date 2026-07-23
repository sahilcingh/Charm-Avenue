'use client';
import React, { useEffect, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/supabase/product-mapper';

export default function BudgetFilter({ products }: { products: Product[] }) {
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
    sectionRef.current
      ?.querySelectorAll('.reveal, .reveal-scale')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full px-4 md:px-10 pt-14 pb-12"
      style={{ background: 'var(--blush-border)' }}
    >
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="reveal mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span
              className="badge-pill text-white mb-3 inline-flex"
              style={{ background: 'var(--blush-rose)' }}
            >
              <span>🏷️</span> Budget Friendly
            </span>
            <h2
              className="font-elegant-serif text-section-title tracking-tight"
              style={{ color: 'var(--blush-text)' }}
            >
              Impulse Buys <span style={{ color: 'var(--blush-rose)' }}>You Need</span>
            </h2>
          </div>
          <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--blush-muted)' }}>
            Because cute shouldn&apos;t cost a fortune.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(9rem,32vw,16rem),1fr))] gap-3 md:gap-4">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              transitionDelay={i * 60}
              className="reveal-scale"
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--blush-muted)' }}>
            <span className="text-4xl block mb-3">🛍️</span>
            <p className="font-medium">No items in this range yet — check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
