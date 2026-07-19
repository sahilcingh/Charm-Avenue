'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine {
    productId: string;
    quantity: number;
}

interface CartContextValue {
    lines: CartLine[];
    itemCount: number;
    addToCart: (productId: string, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    setQuantity: (productId: string, quantity: number) => void;
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
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    }, [lines, hydrated]);

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

    const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

    const value = useMemo(
        () => ({ lines, itemCount, addToCart, removeFromCart, setQuantity }),
        [lines, itemCount, addToCart, removeFromCart, setQuantity]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within a CartProvider');
    return ctx;
}
