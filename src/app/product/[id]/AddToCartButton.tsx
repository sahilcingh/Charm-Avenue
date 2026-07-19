'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';

export default function AddToCartButton({ productId }: { productId: string }) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);

    const handleClick = () => {
        addToCart(productId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <button
            onClick={handleClick}
            className="w-full sm:w-auto self-start px-10 py-4 rounded-full font-display font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2 text-white transition-all duration-300 hover:scale-[1.02]"
            style={{ background: added ? '#3D0030' : '#E91E8C', boxShadow: '0 4px 20px rgba(233,30,140,0.4)' }}
        >
            <Icon name={added ? 'CheckIcon' : 'ShoppingBagIcon'} size={18} />
            {added ? 'Added to Bag' : 'Add to Bag'}
        </button>
    );
}
