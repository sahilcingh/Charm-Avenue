'use client';
import React, { useState, useRef, useEffect } from 'react';

const trustItems = [
    { icon: '✨', text: 'Anti-Tarnish Guarantee' },
    { icon: '🌸', text: 'Cute Vibes Only' },
    { icon: '🚀', text: 'Fast Shipping Across India' },
    { icon: '💎', text: '100% Authentic Products' },
    { icon: '🎀', text: 'Gift Wrapping Available' },
    { icon: '📦', text: 'Secure Protective Packaging' },
    { icon: '🌟', text: '12,000+ Happy Customers' },
    { icon: '💳', text: 'Prepaid Orders Only' },
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
        <section ref={sectionRef} className="w-full overflow-hidden" style={{ background: 'var(--blush-bg)' }}>
            {/* Ticker strip */}
            <div className="w-full py-3.5 overflow-hidden" style={{ background: 'var(--blush-rose)' }}>
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
            <div className="max-w-screen-2xl mx-auto px-4 md:px-10 pt-14 pb-12">
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
                            <p className="font-elegant-serif font-bold text-2xl md:text-3xl" style={{ color: 'var(--blush-rose)' }}>{stat.num}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: 'var(--blush-muted)' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Banner */}
                <div
                    className="reveal relative rounded-4xl overflow-hidden p-8 md:p-14 text-center"
                    style={{ background: 'linear-gradient(135deg, #B85864 0%, #E8828F 50%, #D1636F 100%)' }}
                >
                    {/* Noise */}
                    <div className="absolute inset-0 noise-overlay" />
                    {/* Decorative blobs */}
                    <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.2)' }} />
                    <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(253,243,241,0.15)' }} />

                    <div className="relative z-10 max-w-xl mx-auto">
                        <span
                            className="badge-pill mb-4 inline-flex"
                            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#FFFFFF' }}
                        >
                            🎀 Join the Charm Club
                        </span>
                        <h2 className="font-elegant-serif text-white text-3xl md:text-5xl tracking-tight mb-4">
                            Get 10% Off Your{' '}
                            <span className="font-script" style={{ background: 'linear-gradient(90deg,#FDF3F1,#FFFFFF,#FDF3F1)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>
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
                                    className="flex-1 rounded-full px-6 py-3.5 text-sm focus:outline-none transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.5)', color: 'var(--blush-text)' }}
                                />
                                <button
                                    type="submit"
                                    className="px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 shrink-0 transition-all duration-300 hover:scale-105"
                                    style={{ background: 'var(--blush-text)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(30,23,18,0.4)' }}
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
