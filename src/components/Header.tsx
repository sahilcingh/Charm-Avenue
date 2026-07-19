'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const navLinks = [
    { label: 'Jewellery', href: '/shop/jewellery' },
    { label: 'Hair', href: '/shop/hair' },
    { label: 'Makeup', href: '/shop/makeup' },
    { label: 'Accessories', href: '/shop/accessories' },
];

// Matches navLinks length — staggers each link's entrance when the mobile menu opens.
const navLinkDelays = ['delay-200', 'delay-300', 'delay-400', 'delay-500'];

interface HeaderProps {
    /** 'solid' forces the light/dark-text styling used when there's no full-bleed dark hero behind it. */
    variant?: 'transparent' | 'solid';
}

export default function Header({ variant = 'transparent' }: HeaderProps) {
    const [scrolledPast, setScrolledPast] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const scrolled = variant === 'solid' || scrolledPast;
    const { itemCount } = useCart();

    useEffect(() => {
        const onScroll = () => setScrolledPast(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                        ? 'py-3 border-b' : 'py-5 bg-transparent'
                    }`}
                style={scrolled ? { background: 'rgba(255,240,247,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: '#FFCCE8' } : {}}
            >
                <div className="max-w-screen-xl mx-auto px-4 md:px-10 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="font-display font-black text-xl tracking-tight" style={{ color: scrolled ? '#E91E8C' : 'white' }}>
                            Charm Avenue
                        </span>
                        <span className={`text-xs font-semibold hidden sm:block ${scrolled ? 'text-[#AD1457]' : 'text-white/70'}`}>by Nandini</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-7">
                        {navLinks?.map((link) => (
                            <Link
                                key={link?.label}
                                href={link?.href}
                                className={`text-sm font-semibold transition-colors duration-300 hover:text-[#E91E8C] ${scrolled ? 'text-[#3D0030]' : 'text-white/90'
                                    }`}
                            >
                                {link?.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/cart"
                            aria-label="View cart"
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${scrolled ? 'bg-[#FFE4F4] text-[#3D0030] hover:bg-[#FFCCE8]' : 'glass-white text-white hover:bg-white/25'
                                }`}
                        >
                            <Icon name="ShoppingBagIcon" size={18} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E91E8C] text-white text-[10px] font-bold flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/shop"
                            className={`hidden md:flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${scrolled
                                    ? 'bg-[#E91E8C] text-white hover:bg-[#C2185B]'
                                    : 'glass-white text-white hover:bg-white/25'
                                }`}
                            style={scrolled ? { boxShadow: '0 4px 16px rgba(233,30,140,0.35)' } : {}}
                        >
                            <Icon name="ShoppingBagIcon" size={15} />
                            <span>Shop Now</span>
                        </Link>
                        {/* Mobile hamburger */}
                        <button
                            className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors ${scrolled ? 'bg-[#FFE4F4] text-[#3D0030]' : 'glass-white text-white'
                                }`}
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Icon name="Bars3Icon" size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay — deep rose background */}
            <div
                className={`fixed inset-0 z-[100] flex flex-col p-6 transition-all duration-300 ease-out ${menuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                style={{ background: 'rgba(61,0,48,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                aria-hidden={!menuOpen}
            >
                {menuOpen && (
                    <>
                        <div className="flex items-center justify-between mb-10 animate-enter">
                            <div className="flex items-center gap-2.5">
                                <span className="font-display font-black text-xl tracking-tight text-white">
                                    Charm Avenue
                                </span>
                                <span className="text-xs font-semibold text-white/70">by Nandini</span>
                            </div>
                            <button
                                className="w-10 h-10 rounded-full glass-white flex items-center justify-center"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <Icon name="XMarkIcon" size={20} className="text-white" />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-5 flex-1">
                            {navLinks?.map((link, i) => (
                                <Link
                                    key={link?.label}
                                    href={link?.href}
                                    className={`font-display font-black text-3xl text-white hover:text-[#FF6EC7] transition-colors animate-enter ${navLinkDelays[i]}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link?.label}
                                </Link>
                            ))}
                        </nav>

                        <Link
                            href="/shop"
                            className="w-full text-white py-4 rounded-full font-display font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2 mt-6 transition-all duration-300 animate-enter delay-600"
                            style={{ background: '#E91E8C', boxShadow: '0 4px 20px rgba(233,30,140,0.5)' }}
                            onClick={() => setMenuOpen(false)}
                        >
                            <Icon name="ShoppingBagIcon" size={18} />
                            Shop Now
                        </Link>
                    </>
                )}
            </div>
        </>
    );
}