'use client';
import React, { useState, useRef, useEffect } from 'react';

const trustItems = [
    { icon: '✨', text: 'Anti-Tarnish Guarantee' },
    { icon: '🌸', text: 'Cute Vibes Only' },
    { icon: '🚀', text: 'Fast Shipping Across India' },
    { icon: '💎', text: '100% Authentic Products' },
    { icon: '🎀', text: 'Gift Wrapping Available' },
    { icon: '💝', text: 'Easy 7-Day Returns' },
    { icon: '🌟', text: '12,000+ Happy Customers' },
    { icon: '📦', text: 'COD Available' },
];

export default function TrustCTA() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
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
            { threshold: 0.1 }
        );
        sectionRef.current?.querySelectorAll('.reveal, .reveal-scale').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
            setEmail('');
        }
    };

    // Duplicate for seamless loop
    const allItems = [...trustItems, ...trustItems];

    return (
        <section ref={sectionRef} className="bg-[#FFF0F7] w-full overflow-hidden">
            {/* Ticker strip — deep magenta background */}
            <div className="w-full py-3.5 overflow-hidden" style={{ background: '#E91E8C' }}>
                <div className="flex whitespace-nowrap" style={{ animation: 'marqueeScroll 30s linear infinite' }}>
                    {allItems.map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 shrink-0">
                            <span>{item.icon}</span>
                            <span>{item.text}</span>
                            <span className="text-white/40 ml-4">•</span>
                        </span>
                    ))}
                </div>
                <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
            </div>

            {/* Stats Row */}
            <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-14 pb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[
                        { num: '12K+', label: 'Happy Customers', emoji: '💝' },
                        { num: '500+', label: 'Products', emoji: '🛍️' },
                        { num: '4.9★', label: 'Average Rating', emoji: '⭐' },
                        { num: '2-5', label: 'Days Delivery', emoji: '🚀' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-3xl p-5 text-center card-bubble reveal-scale"
                            style={{ transitionDelay: `${i * 80}ms` }}
                        >
                            <span className="text-2xl block mb-2">{stat.emoji}</span>
                            <p className="font-display font-black text-2xl md:text-3xl text-[#E91E8C]">{stat.num}</p>
                            <p className="text-[#9B4070] text-xs font-medium mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Banner — deep rose/magenta background */}
                <div
                    className="reveal relative rounded-4xl overflow-hidden p-8 md:p-14 text-center"
                    style={{ background: 'linear-gradient(135deg, #AD1457 0%, #E91E8C 50%, #C2185B 100%)' }}
                >
                    {/* Noise */}
                    <div className="absolute inset-0 noise-overlay" />
                    {/* Decorative blobs — pink shades */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,110,199,0.25)' }} />
                    <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,179,224,0.2)' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,240,247,0.1)' }} />

                    <div className="relative z-10 max-w-xl mx-auto">
                        <span
                            className="badge-pill mb-4 inline-flex"
                            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#FFFFFF' }}
                        >
                            🎀 Join the Charm Club
                        </span>
                        <h2 className="font-display font-black text-white text-3xl md:text-5xl tracking-tight mb-4">
                            Get 10% Off Your{' '}
                            <span style={{ background: 'linear-gradient(90deg,#FFB3E0,#FFFFFF,#FFB3E0)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>
                                First Order
                            </span>
                        </h2>
                        <p className="text-white/80 text-base leading-relaxed mb-8">
                            Subscribe for exclusive drops, early access, and cute surprises straight to your inbox.
                        </p>

                        {submitted ? (
                            <div
                                className="flex items-center justify-center gap-3 rounded-full px-8 py-4"
                                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}
                            >
                                <span className="text-xl">🎉</span>
                                <p className="text-white font-bold">You're in! Check your inbox for your 10% off code.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="flex-1 rounded-full px-6 py-3.5 text-[#3D0030] placeholder-[#9B4070] text-sm focus:outline-none transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.5)' }}
                                />
                                <button
                                    type="submit"
                                    className="px-7 py-3.5 rounded-full font-display font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shrink-0 transition-all duration-300 hover:scale-105"
                                    style={{ background: '#3D0030', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(61,0,48,0.4)' }}
                                >
                                    <span>Join ✨</span>
                                </button>
                            </form>
                        )}

                        <p className="text-white/50 text-xs mt-4">No spam. Unsubscribe anytime. 💌</p>
                    </div>
                </div>
            </div>
        </section>
    );
}