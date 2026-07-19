'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';
import type { Product } from '@/lib/products';

interface ProductCardProps {
    product: Product;
    transitionDelay?: number;
    className?: string;
}

export default function ProductCard({ product, transitionDelay = 0, className = '' }: ProductCardProps) {
    const [hovered, setHovered] = useState(false);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCart(product.id, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
        showToast(`${product.name} added to your bag`, { href: '/cart', actionLabel: 'View Bag' });
    };

    return (
        <Link
            href={`/product/${product.id}`}
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
                {/* Quick add overlay */}
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'rgba(173,20,87,0.45)' }}
                >
                    <button
                        onClick={handleQuickAdd}
                        className="bg-white text-[#E91E8C] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg hover:bg-[#E91E8C] hover:text-white transition-colors"
                    >
                        <Icon name={added ? 'CheckIcon' : 'ShoppingBagIcon'} size={14} />
                        {added ? 'Added!' : 'Quick Add'}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="text-xs text-[#9B4070] font-medium mb-0.5 truncate">{product.category}</p>
                <p className="font-bold text-[#3D0030] text-sm leading-tight mb-1.5 truncate">{product.name}</p>
                <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-[#E91E8C] text-base">₹{product.price}</span>
                    {product.originalPrice && (
                        <span className="text-[#9B4070] text-xs line-through">₹{product.originalPrice}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
