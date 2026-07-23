'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from './supabase/client';

export interface CartLine {
    productId: string;
    variantId?: string;
    personalizationText?: string;
    quantity: number;
}

interface LineOptions {
    variantId?: string;
    personalizationText?: string;
}

interface CartContextValue {
    lines: CartLine[];
    itemCount: number;
    /** False until the initial localStorage read completes — an empty `lines` array before
     *  this flips true means "not loaded yet", not "cart is actually empty". */
    hydrated: boolean;
    addToCart: (productId: string, quantity?: number, options?: LineOptions) => void;
    removeFromCart: (productId: string, options?: LineOptions) => void;
    setQuantity: (productId: string, quantity: number, options?: LineOptions) => void;
    adjustQuantity: (productId: string, delta: number, options?: LineOptions) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'charm-avenue-cart';

// Two lines are "the same" only if product, variant, AND personalization text all match —
// a different color/size, or different custom engraving text, is a genuinely distinct line,
// not a quantity bump on an existing one.
function matchesLine(line: CartLine, productId: string, options?: LineOptions): boolean {
    return line.productId === productId
        && line.variantId === options?.variantId
        && line.personalizationText === options?.personalizationText;
}

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

    const addToCart = useCallback((productId: string, quantity = 1, options?: LineOptions) => {
        setLines((prev) => {
            const existing = prev.find((l) => matchesLine(l, productId, options));
            if (existing) {
                return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity } : l));
            }
            return [...prev, { productId, variantId: options?.variantId, personalizationText: options?.personalizationText, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string, options?: LineOptions) => {
        setLines((prev) => prev.filter((l) => !matchesLine(l, productId, options)));
    }, []);

    const setQuantity = useCallback((productId: string, quantity: number, options?: LineOptions) => {
        setLines((prev) => {
            if (quantity <= 0) return prev.filter((l) => !matchesLine(l, productId, options));
            return prev.map((l) => (matchesLine(l, productId, options) ? { ...l, quantity } : l));
        });
    }, []);

    // Computes the new quantity from the CURRENT state inside the updater, rather than
    // from a value the caller read at render time — a caller doing
    // `setQuantity(id, line.quantity - 1)` would lose an update if invoked twice before
    // React re-renders (e.g. two quantity-button clicks batched together).
    const adjustQuantity = useCallback((productId: string, delta: number, options?: LineOptions) => {
        setLines((prev) => {
            const existing = prev.find((l) => matchesLine(l, productId, options));
            if (!existing) return prev;
            const nextQuantity = existing.quantity + delta;
            if (nextQuantity <= 0) return prev.filter((l) => l !== existing);
            return prev.map((l) => (l === existing ? { ...l, quantity: nextQuantity } : l));
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
