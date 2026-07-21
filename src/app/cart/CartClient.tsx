'use client';
import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { getProductById, type Product } from '@/lib/products';

export default function CartClient() {
    const { lines, setQuantity, removeFromCart } = useCart();

    const items = lines
        .map((line) => ({ line, product: getProductById(line.productId) }))
        .filter((entry): entry is { line: typeof entry.line; product: Product } => Boolean(entry.product));

    const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);

    if (items.length === 0) {
        return (
            <section className="w-full px-4 md:px-10 py-20">
                <div className="max-w-screen-md mx-auto text-center">
                    <span className="text-5xl block mb-4">🛍️</span>
                    <h2 className="font-elegant-serif text-2xl mb-2" style={{ color: 'var(--blush-text)' }}>Your bag is empty</h2>
                    <p className="mb-8" style={{ color: 'var(--blush-muted)' }}>Looks like you haven&apos;t added anything cute yet.</p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                        style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                    >
                        <Icon name="ShoppingBagIcon" size={16} />
                        Start Shopping
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full px-4 md:px-10 py-14">
            <div className="max-w-screen-2xl mx-auto grid md:grid-cols-3 gap-8">
                {/* Line items */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {items.map(({ line, product }) => (
                        <div key={product.id} className="flex gap-4 bg-white rounded-3xl p-4 card-bubble">
                            <Link
                                href={`/product/${product.id}`}
                                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0"
                            >
                                <AppImage src={product.image} alt={product.imageAlt} fill className="object-cover" sizes="112px" />
                            </Link>
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--blush-muted)' }}>{product.category}</p>
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="font-bold text-sm sm:text-base hover:opacity-70 transition-opacity"
                                        style={{ color: 'var(--blush-text)' }}
                                    >
                                        {product.name}
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-2">
                                    <div className="flex items-center gap-1 rounded-full p-1" style={{ background: 'var(--blush-bg)' }}>
                                        <button
                                            onClick={() => setQuantity(product.id, line.quantity - 1)}
                                            aria-label="Decrease quantity"
                                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-bold hover:opacity-70 transition-opacity"
                                            style={{ color: 'var(--blush-rose)' }}
                                        >
                                            −
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold" style={{ color: 'var(--blush-text)' }}>{line.quantity}</span>
                                        <button
                                            onClick={() => setQuantity(product.id, line.quantity + 1)}
                                            aria-label="Increase quantity"
                                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-bold hover:opacity-70 transition-opacity"
                                            style={{ color: 'var(--blush-rose)' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="font-elegant-serif font-bold text-base sm:text-lg" style={{ color: 'var(--blush-rose)' }}>
                                        ₹{product.price * line.quantity}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFromCart(product.id)}
                                aria-label="Remove item"
                                className="self-start w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
                                style={{ color: 'var(--blush-muted)' }}
                            >
                                <Icon name="XMarkIcon" size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl p-6 card-bubble md:sticky md:top-24">
                        <h2 className="font-elegant-serif text-lg mb-4" style={{ color: 'var(--blush-text)' }}>Order Summary</h2>
                        <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>
                            <span>Subtotal ({items.reduce((n, i) => n + i.line.quantity, 0)} items)</span>
                            <span className="font-bold">₹{subtotal}</span>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--blush-muted)' }}>Shipping & taxes calculated at checkout.</p>
                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--blush-border)' }}>
                            <span className="font-bold" style={{ color: 'var(--blush-text)' }}>Total</span>
                            <span className="font-elegant-serif font-bold text-xl" style={{ color: 'var(--blush-rose)' }}>₹{subtotal}</span>
                        </div>
                        <Link
                            href="/shop"
                            className="mt-6 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
                            style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
