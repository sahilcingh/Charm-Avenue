'use client';
import React, { useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import { deleteProduct } from './actions';

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
    const [confirming, setConfirming] = useState(false);
    const [isPending, startTransition] = useTransition();

    if (confirming) {
        return (
            <div className="flex items-center gap-1.5 animate-bounce-in">
                <button
                    onClick={() => startTransition(() => deleteProduct(productId))}
                    disabled={isPending}
                    className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--blush-rose-dark)' }}
                >
                    {isPending ? '…' : 'Confirm'}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    aria-label="Cancel delete"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
                >
                    <Icon name="XMarkIcon" size={14} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${productName}`}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:text-white"
            style={{ color: 'var(--blush-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--blush-rose-dark)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
            <Icon name="TrashIcon" size={15} />
        </button>
    );
}
