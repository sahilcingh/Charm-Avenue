'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  variantId?: string;
  personalizationText?: string;
  personalizationRequired?: boolean;
}

export default function AddToCartButton({
  productId,
  productName,
  variantId,
  personalizationText,
  personalizationRequired,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (personalizationRequired && !personalizationText?.trim()) {
      setError('Please fill in the personalization field above.');
      return;
    }
    setError(null);
    addToCart(productId, 1, {
      variantId,
      personalizationText: personalizationText?.trim() || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    showToast(`${productName} added to your bag`, { href: '/cart', actionLabel: 'View Bag' });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full sm:w-auto self-start px-10 py-4 rounded-full font-bold text-base uppercase tracking-widest flex items-center justify-center gap-2 text-white transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: added ? 'var(--blush-text)' : 'var(--blush-rose)',
          boxShadow: '0 4px 20px rgba(232,130,143,0.4)',
        }}
      >
        <Icon name={added ? 'CheckIcon' : 'ShoppingBagIcon'} size={18} />
        {added ? 'Added to Bag' : 'Add to Bag'}
      </button>
      {error && (
        <p className="text-xs font-medium mt-2" style={{ color: 'var(--blush-rose-dark)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
