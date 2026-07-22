'use client';
import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const footerLinks = [
    { label: 'Shop All', href: '/shop' },
    { label: 'New Arrivals', href: '/shop?filter=new' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Returns', href: '/returns' },
];

const socialLinks = [
    { label: 'Instagram', icon: 'HeartIcon' as const, href: '#' },
    { label: 'YouTube', icon: 'PlayIcon' as const, href: '#' },
    { label: 'WhatsApp', icon: 'ChatBubbleLeftRightIcon' as const, href: '#' },
];

export default function Footer() {
    return (
        <footer className="border-t pt-12 pb-8 px-4 md:px-10" style={{ background: 'var(--blush-bg)', borderColor: 'var(--blush-border)' }}>
            <div className="max-w-screen-2xl mx-auto">
                {/* Brand + links */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
                    {/* Left: Brand */}
                    <div className="flex-shrink-0 max-w-xs">
                        <span className="font-script text-2xl inline-flex items-center gap-1 mb-3" style={{ color: 'var(--blush-text)' }}>
                            Charm Avenue
                            <Icon name="HeartIcon" size={13} style={{ color: 'var(--blush-rose)' }} />
                        </span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--blush-muted)' }}>
                            by Nandini — Cute accessories & everyday finds for every girl.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-2 mt-4">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    style={{ background: 'var(--blush-border)', color: 'var(--blush-rose)' }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--blush-rose)';
                                        (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--blush-border)';
                                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--blush-rose)';
                                    }}
                                >
                                    <Icon name={s.icon} size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Right: Links */}
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm font-semibold transition-opacity hover:opacity-70 min-h-[44px] flex items-center"
                                style={{ color: 'var(--blush-muted)' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: 'var(--blush-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
                        © 2026 Charm Avenue by Nandini · All rights reserved
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: 'var(--blush-muted)' }}>
                            <Link href="/privacy" className="hover:opacity-70 transition-opacity">Privacy</Link>
                            <span className="mx-2">·</span>
                            <Link href="/terms" className="hover:opacity-70 transition-opacity">Terms</Link>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
