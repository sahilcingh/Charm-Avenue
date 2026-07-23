'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';
import { useWishlistToggle } from '@/lib/use-wishlist-toggle';
import { useAdminMode } from '@/lib/admin-mode-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Product } from '@/lib/supabase/product-mapper';
import { isSaleWindowActive } from '@/lib/supabase/sale-window';

interface ProductCardProps {
    product: Product;
    transitionDelay?: number;
    className?: string;
}

export default function ProductCard(props: ProductCardProps) {
    return (
        <ErrorBoundary fallback={<ProductCardFallback className={props.className} />}>
            <ProductCardContent {...props} />
        </ErrorBoundary>
    );
}

/** Keeps the grid from visually collapsing around a single failed card. */
function ProductCardFallback({ className = '' }: { className?: string }) {
    return <div className={`bg-white rounded-3xl overflow-hidden card-bubble aspect-square ${className}`} style={{ background: 'var(--blush-bg)' }} />;
}

function ProductCardContent({ product, transitionDelay = 0, className = '' }: ProductCardProps) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { isInWishlist, toggleWithFeedback } = useWishlistToggle();
    const { adminModeOn } = useAdminMode();
    const router = useRouter();
    const wishlisted = isInWishlist(product.id);
    const showDiscount = Boolean(product.originalPrice) && isSaleWindowActive(product.saleStartsAt, product.saleEndsAt, new Date());

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCart(product.id, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
        showToast(`${product.name} added to your bag`, { href: '/cart', actionLabel: 'View Bag' });
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleWithFeedback(product.id, product.name);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(`/admin/products/${product.id}`);
    };

    return (
        <Link
            href={`/product/${product.slug}`}
            className={`block relative bg-white rounded-3xl overflow-hidden card-bubble transition-all duration-300 hover:-translate-y-1 cursor-pointer ${className}`}
            style={{ transitionDelay: `${transitionDelay}ms` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden rounded-t-3xl">
                <AppImage
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    className={`object-cover transition-transform duration-500 ${hovered ? 'scale-110' : 'scale-100'}`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                {product.tag && (
                    <span
                        className="absolute top-2 left-2 badge-pill text-xs shadow-sm"
                        style={{ background: product.tagBg, color: product.tagText }}
                    >
                        {product.tag}
                    </span>
                )}
                <button
                    onClick={handleToggleWishlist}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full glass-white flex items-center justify-center z-10 transition-transform hover:scale-110"
                >
                    <Icon
                        name="HeartIcon"
                        variant={wishlisted ? 'solid' : 'outline'}
                        size={16}
                        style={{ color: wishlisted ? 'var(--blush-rose)' : '#FFFFFF' }}
                    />
                </button>
                {adminModeOn && (
                    <button
                        onClick={handleEdit}
                        aria-label={`Edit ${product.name}`}
                        className="absolute top-12 right-2 w-8 h-8 rounded-full glass-white flex items-center justify-center z-10 transition-transform hover:scale-110"
                    >
                        <Icon name="PencilSquareIcon" size={15} style={{ color: '#FFFFFF' }} />
                    </button>
                )}
                {/* Quick add overlay */}
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'rgba(30,23,18,0.45)' }}
                >
                    <button
                        onClick={handleQuickAdd}
                        className="px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
                        style={{ background: '#FFFFFF', color: 'var(--blush-rose)' }}
                        onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = 'var(--blush-rose)';
                            btn.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.background = '#FFFFFF';
                            btn.style.color = 'var(--blush-rose)';
                        }}
                    >
                        <Icon name={added ? 'CheckIcon' : 'ShoppingBagIcon'} size={14} />
                        {added ? 'Added!' : 'Quick Add'}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="text-xs font-medium mb-0.5 truncate" style={{ color: 'var(--blush-muted)' }}>{product.category}</p>
                <p className="font-bold text-sm leading-tight mb-1.5 truncate" style={{ color: 'var(--blush-text)' }}>{product.name}</p>
                <div className="flex items-center gap-1.5">
                    <span className="font-elegant-serif font-bold text-base" style={{ color: 'var(--blush-rose)' }}>₹{product.price}</span>
                    {showDiscount && (
                        <span className="text-xs line-through" style={{ color: 'var(--blush-muted)' }}>₹{product.originalPrice}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
