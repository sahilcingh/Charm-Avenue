'use client';
import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
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
        <footer className="border-t pt-12 pb-8 px-4 md:px-10" style={{ background: '#FFE4F4', borderColor: '#FFCCE8' }}>
            <div className="max-w-screen-xl mx-auto">
                {/* Brand + links */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
                    {/* Left: Brand */}
                    <div className="flex-shrink-0 max-w-xs">
                        <div className="flex items-center gap-2.5 mb-3">
                            <AppLogo size={36} />
                            <span className="font-display font-black text-lg text-[#3D0030] tracking-tight">
                                Charm Avenue
                            </span>
                        </div>
                        <p className="text-[#9B4070] text-sm leading-relaxed">
                            by Nandini — Cute accessories & anti-tarnish jewellery for every girl.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-2 mt-4">
                            {socialLinks.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    style={{ background: '#FFCCE8', color: '#E91E8C' }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = '#E91E8C';
                                        (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLAnchorElement).style.background = '#FFCCE8';
                                        (e.currentTarget as HTMLAnchorElement).style.color = '#E91E8C';
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
                                className="text-sm font-semibold text-[#9B4070] hover:text-[#E91E8C] transition-colors min-h-[44px] flex items-center"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: '#FFCCE8' }}>
                    <p className="text-[#9B4070] text-sm">
                        © 2026 Charm Avenue by Nandini · All rights reserved
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-[#9B4070] text-sm">
                            <Link href="/privacy" className="hover:text-[#E91E8C] transition-colors">Privacy</Link>
                            <span className="mx-2">·</span>
                            <Link href="/terms" className="hover:text-[#E91E8C] transition-colors">Terms</Link>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}