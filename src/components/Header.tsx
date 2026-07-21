'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'New Arrivals', href: '/shop?filter=new' },
    { label: 'Best Sellers', href: '/shop' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
];

// Matches navLinks length — staggers each link's entrance when the mobile menu opens.
const navLinkDelays = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600'];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { itemCount } = useCart();
    const pathname = usePathname();

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const isLinkActive = (href: string) => {
        const base = href.split('?')[0];
        return base === '/' ? pathname === '/' : pathname.startsWith(base);
    };

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-50 border-b"
                style={{ background: 'var(--blush-bg)', borderColor: 'var(--blush-border)' }}
            >
                <div className="relative max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    {/* Left: nav (desktop) / hamburger (mobile) */}
                    <div className="flex items-center">
                        <nav className="hidden 2xl:flex items-center gap-7 2xl:gap-9">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="whitespace-nowrap text-[11px] lg:text-xs font-semibold uppercase tracking-wide transition-colors hover:opacity-80"
                                    style={{ color: isLinkActive(link.href) ? 'var(--blush-rose)' : 'var(--blush-text)' }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <button
                            className="2xl:hidden w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Icon name="Bars3Icon" size={20} />
                        </button>
                    </div>

                    {/* Center: script logo — absolutely centered regardless of nav/icon widths */}
                    <Link
                        href="/"
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center leading-none whitespace-nowrap"
                    >
                        <span className="font-script text-2xl sm:text-3xl md:text-4xl inline-flex items-center gap-1" style={{ color: 'var(--blush-text)' }}>
                            Charm Avenue
                            <Icon name="HeartIcon" size={14} style={{ color: 'var(--blush-rose)' }} />
                        </span>
                        <span
                            className="text-[9px] sm:text-[10px] font-semibold tracking-[0.35em] uppercase mt-1 flex items-center gap-2"
                            style={{ color: 'var(--blush-muted)' }}
                        >
                            <span className="w-3 h-px" style={{ background: 'var(--blush-muted)' }} />
                            By Nandini
                            <span className="w-3 h-px" style={{ background: 'var(--blush-muted)' }} />
                        </span>
                    </Link>

                    {/* Right: icons */}
                    <div className="flex items-center gap-3 sm:gap-4 2xl:mr-24">
                        <button
                            className="hidden sm:flex w-9 h-9 items-center justify-center transition-opacity hover:opacity-70"
                            style={{ color: 'var(--blush-text)' }}
                            aria-label="Search"
                        >
                            <Icon name="MagnifyingGlassIcon" size={19} />
                        </button>
                        <button
                            className="hidden sm:flex w-9 h-9 items-center justify-center transition-opacity hover:opacity-70"
                            style={{ color: 'var(--blush-text)' }}
                            aria-label="Account"
                        >
                            <Icon name="UserIcon" size={19} />
                        </button>
                        <button
                            className="relative w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ color: 'var(--blush-text)' }}
                            aria-label="Wishlist"
                        >
                            <Icon name="HeartIcon" size={19} />
                            <span
                                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                style={{ background: 'var(--blush-rose)' }}
                            >
                                0
                            </span>
                        </button>
                        <Link
                            href="/cart"
                            aria-label="View cart"
                            className="relative w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
                            style={{ color: 'var(--blush-text)' }}
                        >
                            <Icon name="ShoppingBagIcon" size={19} />
                            <span
                                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                style={{ background: 'var(--blush-rose)' }}
                            >
                                {itemCount}
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-[100] flex flex-col p-6 transition-all duration-300 ease-out ${menuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                style={{ background: 'var(--blush-bg)' }}
                aria-hidden={!menuOpen}
            >
                {menuOpen && (
                    <>
                        <div className="flex items-center justify-between mb-8 animate-enter">
                            <span className="font-script text-2xl inline-flex items-center gap-1" style={{ color: 'var(--blush-text)' }}>
                                Charm Avenue
                                <Icon name="HeartIcon" size={12} style={{ color: 'var(--blush-rose)' }} />
                            </span>
                            <button
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4 flex-1 overflow-y-auto">
                            {navLinks.map((link, i) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={`font-elegant-serif text-2xl transition-colors animate-enter ${navLinkDelays[i]}`}
                                    style={{ color: isLinkActive(link.href) ? 'var(--blush-rose)' : 'var(--blush-text)' }}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center gap-4 mb-6 animate-enter delay-700">
                            <button className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--blush-text)' }}>
                                <Icon name="UserIcon" size={18} /> Account
                            </button>
                            <button className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--blush-text)' }}>
                                <Icon name="HeartIcon" size={18} /> Wishlist
                            </button>
                        </div>

                        <Link
                            href="/shop"
                            className="w-full text-white py-4 rounded-full font-semibold text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 animate-enter delay-800"
                            style={{ background: 'var(--blush-rose)' }}
                            onClick={() => setMenuOpen(false)}
                        >
                            Shop Now
                            <Icon name="ArrowRightIcon" size={18} />
                        </Link>
                    </>
                )}
            </div>
        </>
    );
}
