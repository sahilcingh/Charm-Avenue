import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
    return (
        <section
            className="relative w-full min-h-[clamp(40rem,70vh,47.5rem)] flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--blush-bg)' }}
        >
            {/* Background flat-lay photo */}
            <div className="absolute inset-0">
                <AppImage
                    src="https://images.pexels.com/photos/4515450/pexels-photo-4515450.jpeg"
                    alt="Flat lay of pink peonies and pearl hair pins on a light surface"
                    fill
                    priority
                    className="object-cover object-[center_62%] md:object-[center_48%]"
                    sizes="100vw"
                />
                {/* Light blush veil, just enough behind the text for legibility without flattening the photo */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(circle at center, rgba(253,243,241,0.72) 0%, rgba(253,243,241,0.42) 45%, rgba(253,243,241,0.08) 75%)',
                    }}
                />
            </div>

            {/* Centered content */}
            <div className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-16 text-center animate-enter">
                <div
                    className="inline-block rounded-full px-5 py-1.5 mb-3"
                    style={{ background: 'rgba(253,243,241,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                >
                    <p
                        className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em]"
                        style={{ color: 'var(--blush-rose)' }}
                    >
                        Pretty Finds, Just For You
                    </p>
                </div>
                <Icon name="HeartIcon" size={16} className="block mx-auto mb-3" style={{ color: 'var(--blush-rose)' }} />
                <h1
                    className="font-elegant-serif leading-[1.05] mb-1"
                    style={{
                        color: 'var(--blush-text)',
                        fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
                        textShadow: '0 2px 20px rgba(253,243,241,0.85), 0 1px 4px rgba(253,243,241,0.85)',
                    }}
                >
                    Little things,
                </h1>
                <h2
                    className="font-script leading-none mb-5 inline-flex items-center gap-2"
                    style={{
                        color: 'var(--blush-rose)',
                        fontSize: 'clamp(3rem, 9vw, 5.5rem)',
                        textShadow: '0 2px 20px rgba(253,243,241,0.85), 0 1px 4px rgba(253,243,241,0.85)',
                    }}
                >
                    Big Charm
                    <Icon name="HeartIcon" size={28} className="mb-4" style={{ color: 'var(--blush-rose)' }} />
                </h2>
                <div className="flex items-center justify-center gap-3 mb-6">
                    <span className="h-px w-12" style={{ background: 'var(--blush-border)' }} />
                    <span aria-hidden>🎀</span>
                    <span className="h-px w-12" style={{ background: 'var(--blush-border)' }} />
                </div>
                <p
                    className="text-sm sm:text-base leading-relaxed mb-8"
                    style={{ color: 'var(--blush-text)', opacity: 0.8 }}
                >
                    Little charms, beautiful moments, and a touch of magic — made to make you uniquely you.
                </p>
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm uppercase tracking-widest text-white transition-transform duration-300 hover:scale-105"
                    style={{ background: 'var(--blush-rose)', boxShadow: '0 6px 20px rgba(221,139,148,0.4)' }}
                >
                    Shop Now
                    <Icon name="ArrowRightIcon" size={16} />
                </Link>
            </div>
        </section>
    );
}
