'use client';
import React, { useRef, useEffect } from 'react';
import { FaInstagram, FaWhatsapp, FaYoutube, FaFacebookF } from 'react-icons/fa';

// href is null for accounts that don't exist yet — shown for brand recognition
// only, deliberately not rendered as a clickable link (a link to nowhere is
// worse than no link at all).
const socialLinks = [
  {
    label: 'Instagram',
    Icon: FaInstagram,
    href: 'https://www.instagram.com/charm_avenue.in',
  },
  { label: 'WhatsApp', Icon: FaWhatsapp, href: 'https://wa.me/918957298041' },
  { label: 'YouTube', Icon: FaYoutube, href: null },
  { label: 'Facebook', Icon: FaFacebookF, href: null },
];

const trustItems = [
  { icon: '✨', text: 'Handpicked With Love' },
  { icon: '🌸', text: 'Cute Vibes Only' },
  { icon: '🚀', text: 'Fast Shipping Across India' },
  { icon: '💎', text: '100% Authentic Products' },
  { icon: '🎀', text: 'Gift Wrapping Available' },
  { icon: '📦', text: 'Secure Protective Packaging' },
  { icon: '🌟', text: '12,000+ Happy Customers' },
  { icon: '💳', text: 'Prepaid Orders Only' },
];

export default function TrustCTA() {
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
    sectionRef.current
      ?.querySelectorAll('.reveal, .reveal-scale')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Duplicate for seamless loop
  const allItems = [...trustItems, ...trustItems];

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden"
      style={{ background: 'var(--blush-bg)' }}
    >
      {/* Ticker strip */}
      <div
        className="w-full py-3.5 overflow-hidden"
        style={{ background: 'var(--blush-rose-button)' }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{ animation: 'marqueeScroll 30s linear infinite' }}
        >
          {allItems.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 shrink-0"
            >
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
            { num: '500+', label: 'Happy Customers', emoji: '💝' },
            { num: '50+', label: 'Products', emoji: '🛍️' },
            { num: '4.9★', label: 'Average Rating', emoji: '⭐' },
            { num: '2-5', label: 'Days Delivery', emoji: '🚀' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 text-center card-bubble reveal-scale"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="text-2xl block mb-2">{stat.emoji}</span>
              <p
                className="font-elegant-serif font-bold text-2xl md:text-3xl"
                style={{ color: 'var(--blush-rose)' }}
              >
                {stat.num}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--blush-muted)' }}>
                {stat.label}
              </p>
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
          <div
            className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
          <div
            className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'rgba(253,243,241,0.15)' }}
          />

          <div className="relative z-10 max-w-xl mx-auto">
            <span
              className="badge-pill mb-4 inline-flex"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#FFFFFF',
              }}
            >
              💕 Stay in the Loop
            </span>
            <h2 className="font-elegant-serif text-white text-3xl md:text-5xl tracking-tight mb-4">
              Follow Along for More{' '}
              <span
                className="font-script"
                style={{
                  background: 'linear-gradient(90deg,#FDF3F1,#FFFFFF,#FDF3F1)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                }}
              >
                Charm
              </span>
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-10">
              Real customer unboxings, restock alerts, and behind-the-scenes cuteness, straight from
              our socials.
            </p>

            <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
              {socialLinks.map((s) => {
                const iconCircle = (
                  <span
                    className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full flex items-center justify-center transition-all duration-300 ${
                      s.href
                        ? 'text-white bg-white/15 border border-white/35 group-hover:scale-110 group-hover:bg-white group-hover:text-[var(--blush-rose)]'
                        : 'text-white/40 bg-white/5 border border-white/15'
                    }`}
                  >
                    <s.Icon size={26} />
                  </span>
                );
                const labelEl = (
                  <span
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                      s.href ? 'text-white/80 group-hover:text-white' : 'text-white/30'
                    }`}
                  >
                    {s.label}
                  </span>
                );

                return s.href ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Charm Avenue on ${s.label}`}
                    className="group flex flex-col items-center gap-2.5"
                  >
                    {iconCircle}
                    {labelEl}
                  </a>
                ) : (
                  <div
                    key={s.label}
                    aria-hidden="true"
                    className="flex flex-col items-center gap-2.5"
                  >
                    {iconCircle}
                    {labelEl}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
