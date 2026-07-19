'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
    const badgeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (badgeRef?.current) {
                badgeRef.current.style.transform = `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.02}deg)`;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="relative w-full min-h-screen grid grid-rows-[200px_1fr] md:grid-rows-[260px_1fr] overflow-hidden">
            {/* Full-bleed hero image */}
            <div className="absolute inset-0">
                <AppImage
                    src="https://img.rocket.new/generatedImages/rocket_gen_img_1f7ed4286-1774319801004.png"
                    alt="Flat lay of pink and gold women's jewellery, rings, bracelets and accessories on a cream background, warm pastel tones"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="100vw"
                />
                {/* Deep magenta gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#3D0030]/90 via-[#AD1457]/50 to-transparent" />
                {/* Hot pink brand tint */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#E91E8C]/25 via-transparent to-[#FF6EC7]/15" />
                {/* Noise texture */}
                <div className="absolute inset-0 noise-overlay" />
            </div>

            {/* Rotating badge — monochrome pink */}
            <div
                ref={badgeRef}
                className="absolute top-24 right-3 sm:top-28 sm:right-4 md:top-32 md:right-12 z-30"
            >
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
                    <svg className="animate-spin-slow w-full h-full" viewBox="0 0 100 100">
                        <defs>
                            <path id="cp" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
                        </defs>
                        <text fontSize="8" fontFamily="var(--font-plus-jakarta-sans)" fontWeight="800" letterSpacing="3.2" fill="#FFB3E0">
                            <textPath href="#cp" startOffset="0%">
                                ✨ ANTI-TARNISH • 100% CUTE • INDIA •
                            </textPath>
                        </text>
                    </svg>
                    <span className="absolute text-base sm:text-xl">💍</span>
                </div>
            </div>

            {/* Anti-Tarnish trust badge — prominent, top-left */}
            <div className="absolute top-28 left-4 md:left-12 z-30 animate-enter delay-500">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(233,30,140,0.22)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1.5px solid rgba(233,30,140,0.45)' }}>
                    <div className="w-9 h-9 rounded-full bg-[#E91E8C] flex items-center justify-center shrink-0">
                        <span className="text-base">💎</span>
                    </div>
                    <div>
                        <p className="text-white font-black text-sm leading-tight">100% Anti-Tarnish</p>
                        <p className="text-[#FFB3E0] text-xs font-semibold leading-tight">Jewellery Guaranteed</p>
                    </div>
                </div>
            </div>

            {/* Rating badge — mobile hidden, shows on md+ */}
            <div className="absolute top-44 left-4 md:left-12 z-30 animate-enter delay-600 hidden md:block">
                <div className="glass-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                    <span className="text-lg">⭐</span>
                    <div>
                        <p className="text-white text-xs font-bold leading-tight">4.9 / 5</p>
                        <p className="text-white/70 text-xs leading-tight">12,000+ Happy Customers</p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-20 row-start-2 self-end w-full max-w-screen-xl mx-auto px-5 md:px-12 pb-16 md:pb-24">
                <div className="max-w-3xl">
                    {/* Eyebrow */}
                    <div className="animate-enter delay-100">
                        <span className="badge-pill mb-5 inline-flex" style={{ background: 'rgba(233,30,140,0.25)', border: '1px solid rgba(233,30,140,0.4)', color: '#FFB3E0' }}>
                            <span>🌸</span> New Collection Drop
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="mb-4 animate-enter delay-200">
                        <h1 className="font-display font-black text-white leading-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
                            Charm Avenue
                            <span className="block text-[#FF6EC7]">by Nandini</span>
                        </h1>
                    </div>

                    <p className="text-hero-sub text-white/85 font-medium leading-relaxed max-w-xl mb-8 animate-enter delay-300">
                        Jewellery that stays as pretty as day one. Anti-tarnish guaranteed, starting just ₹150.
                    </p>

                    {/* Info cards */}
                    <div className="flex flex-wrap gap-3 mb-8 animate-enter delay-400">
                        <div className="glass-white rounded-2xl px-4 py-3 flex items-center gap-2">
                            <span className="text-base">💎</span>
                            <div>
                                <p className="text-white font-bold text-sm leading-tight">Anti-Tarnish</p>
                                <p className="text-white/65 text-xs">100% Guaranteed</p>
                            </div>
                        </div>
                        <div className="glass-white rounded-2xl px-4 py-3 flex items-center gap-2">
                            <span className="text-base">🚀</span>
                            <div>
                                <p className="text-white font-bold text-sm leading-tight">Fast Shipping</p>
                                <p className="text-white/65 text-xs">Pan India 2–5 days</p>
                            </div>
                        </div>
                        <div className="glass-white rounded-2xl px-4 py-3 flex items-center gap-2">
                            <span className="text-base">💝</span>
                            <div>
                                <p className="text-white font-bold text-sm leading-tight">From ₹150</p>
                                <p className="text-white/65 text-xs">Budget-friendly finds</p>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 animate-bounce-in delay-500">
                        {/* Glassmorphism CTA — hot pink typography as specified */}
                        <button className="group btn-glass-hot-pink px-8 py-4 rounded-full font-display font-black text-base tracking-wide flex items-center justify-center gap-3 animate-pulse-glow transition-all duration-300">
                            <span>✨ Shop Cute Finds</span>
                            <span className="bg-[#E91E8C]/20 rounded-full p-1.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300">
                                <Icon name="ArrowUpRightIcon" size={16} className="text-[#E91E8C]" />
                            </span>
                        </button>
                        <button className="glass-white text-white px-8 py-4 rounded-full font-display font-bold text-base tracking-wide flex items-center justify-center gap-2 hover:bg-white/30 transition-all duration-300">
                            <Icon name="PlayIcon" size={16} className="text-white" variant="solid" />
                            See Collections
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom scroll hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 animate-float">
                <p className="text-[#FFB3E0]/70 text-xs tracking-widest uppercase font-medium">Scroll</p>
                <Icon name="ChevronDownIcon" size={18} className="text-[#FFB3E0]/70" />
            </div>
        </section>
    );
}