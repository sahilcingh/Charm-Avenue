'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from './supabase/client';

export interface CartLine {
    productId: string;
    quantity: number;
}

interface CartContextValue {
    lines: CartLine[];
    itemCount: number;
    /** False until the initial localStorage read completes — an empty `lines` array before
     *  this flips true means "not loaded yet", not "cart is actually empty". */
    hydrated: boolean;
    addToCart: (productId: string, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    setQuantity: (productId: string, quantity: number) => void;
    adjustQuantity: (productId: string, delta: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'charm-avenue-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) setLines(JSON.parse(raw));
        } catch {
            // ignore malformed/unavailable storage
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        } catch {
            // ignore unavailable storage — the cart still works for this session,
            // it just won't persist across a reload
        }
    }, [lines, hydrated]);

    // Self-heals the cart against products that were deleted or deactivated after being
    // added (e.g. by an admin) — without this, itemCount (used by the header badge) would
    // keep counting phantom lines the cart page itself filters out, so the two disagree.
    useEffect(() => {
        if (!hydrated || lines.length === 0) return;
        let cancelled = false;
        const supabase = createClient();
        supabase
            .from('products')
            .select('id')
            .eq('is_active', true)
            .in('id', lines.map((l) => l.productId))
            .then(({ data }) => {
                if (cancelled) return;
                const validIds = new Set((data ?? []).map((row: { id: string }) => row.id));
                setLines((prev) => {
                    const pruned = prev.filter((l) => validIds.has(l.productId));
                    return pruned.length === prev.length ? prev : pruned;
                });
            });
        return () => {
            cancelled = true;
        };
        // Re-validate only when the set of product ids actually changes, not on every quantity tick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated, lines.map((l) => l.productId).sort().join(',')]);

    const addToCart = useCallback((productId: string, quantity = 1) => {
        setLines((prev) => {
            const existing = prev.find((l) => l.productId === productId);
            if (existing) {
                return prev.map((l) =>
                    l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l
                );
            }
            return [...prev, { productId, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setLines((prev) => prev.filter((l) => l.productId !== productId));
    }, []);

    const setQuantity = useCallback((productId: string, quantity: number) => {
        setLines((prev) => {
            if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
            return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
        });
    }, []);

    // Computes the new quantity from the CURRENT state inside the updater, rather than
    // from a value the caller read at render time — a caller doing
    // `setQuantity(id, line.quantity - 1)` would lose an update if invoked twice before
    // React re-renders (e.g. two quantity-button clicks batched together).
    const adjustQuantity = useCallback((productId: string, delta: number) => {
        setLines((prev) => {
            const existing = prev.find((l) => l.productId === productId);
            if (!existing) return prev;
            const nextQuantity = existing.quantity + delta;
            if (nextQuantity <= 0) return prev.filter((l) => l.productId !== productId);
            return prev.map((l) => (l.productId === productId ? { ...l, quantity: nextQuantity } : l));
        });
    }, []);

    const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

    const value = useMemo(
        () => ({ lines, itemCount, hydrated, addToCart, removeFromCart, setQuantity, adjustQuantity }),
        [lines, itemCount, hydrated, addToCart, removeFromCart, setQuantity, adjustQuantity]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within a CartProvider');
    return ctx;
}
