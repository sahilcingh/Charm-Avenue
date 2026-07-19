import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Syne, Plus_Jakarta_Sans } from 'next/font/google';
import { CartProvider } from '@/lib/cart-context';
import '../styles/tailwind.css';

const syne = Syne({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-syne',
    display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-plus-jakarta-sans',
    display: 'swap',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: 'Charm Avenue by Nandini — Cute Accessories & Anti-Tarnish Jewellery',
    description: 'Shop anti-tarnish jewellery, hair accessories, cute makeup & more starting ₹150. Fast shipping across India. Charm Avenue by Nandini.',
    icons: {
        icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    },
    openGraph: {
        title: 'Charm Avenue by Nandini',
        description: 'Cute accessories & anti-tarnish jewellery starting ₹150',
        images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${syne.variable} ${plusJakartaSans.variable}`}>
            <body className={plusJakartaSans.className}>
                <CartProvider>{children}</CartProvider>

                <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fcharmavenu6077back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.19" />
                <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></body>
        </html>
    );
}