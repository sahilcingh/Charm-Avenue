import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from './cart-context';

const STORAGE_KEY = 'charm-avenue-cart';

// By default every queried product id is treated as valid/active, so existing
// tests that don't care about pruning behave exactly as before. Tests that DO
// care override this with mockValidIds().
const inMock = vi.fn((_col: string, ids: string[]) => Promise.resolve({ data: ids.map((id) => ({ id })) }));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({ in: inMock }),
            }),
        }),
    }),
}));

function mockValidIds(ids: string[]) {
    inMock.mockImplementation(() => Promise.resolve({ data: ids.map((id) => ({ id })) }));
}

function wrapper({ children }: { children: React.ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
    window.localStorage.clear();
    inMock.mockReset();
    inMock.mockImplementation((_col: string, ids: string[]) => Promise.resolve({ data: ids.map((id) => ({ id })) }));
});

describe('CartProvider / useCart', () => {
    it('starts empty', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));
        expect(result.current.itemCount).toBe(0);
    });

    it('throws when used outside a CartProvider (failure case)', () => {
        expect(() => renderHook(() => useCart())).toThrow('useCart must be used within a CartProvider');
    });

    it('adds a new product with quantity 1 by default', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1'));

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 1 }]);
        expect(result.current.itemCount).toBe(1);
    });

    it('adds a product with an explicit quantity', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 3));

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 3 }]);
    });

    it('increments quantity instead of duplicating the line when adding an existing product', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 2));
        act(() => result.current.addToCart('p1', 3));

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 5 }]);
    });

    it('sums quantities across multiple distinct lines for itemCount', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 2));
        act(() => result.current.addToCart('p2', 5));

        expect(result.current.itemCount).toBe(7);
    });

    it('removes a line entirely via removeFromCart', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1'));
        act(() => result.current.addToCart('p2'));
        act(() => result.current.removeFromCart('p1'));

        expect(result.current.lines).toEqual([{ productId: 'p2', quantity: 1 }]);
    });

    it('removeFromCart on a product not in the cart is a harmless no-op (edge case)', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1'));
        act(() => result.current.removeFromCart('does-not-exist'));

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 1 }]);
    });

    it('setQuantity sets an absolute quantity for an existing line', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1'));
        act(() => result.current.setQuantity('p1', 9));

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 9 }]);
    });

    it('setQuantity to zero removes the line', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 3));
        act(() => result.current.setQuantity('p1', 0));

        expect(result.current.lines).toEqual([]);
    });

    it('setQuantity to a negative number also removes the line (failure/edge case)', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 3));
        act(() => result.current.setQuantity('p1', -5));

        expect(result.current.lines).toEqual([]);
    });

    it('adjustQuantity increments/decrements relative to the CURRENT state, even when called twice before a re-render (concurrency case)', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 5));

        // Two rapid decrements batched into a single act() — simulates two clicks
        // firing before React has re-rendered between them. A naive
        // `setQuantity(id, line.quantity - 1)` caller would compute the same
        // stale target twice and lose one decrement; adjustQuantity must not.
        act(() => {
            result.current.adjustQuantity('p1', -1);
            result.current.adjustQuantity('p1', -1);
        });

        expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 3 }]);
    });

    it('adjustQuantity down to zero removes the line', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 1));
        act(() => result.current.adjustQuantity('p1', -1));

        expect(result.current.lines).toEqual([]);
    });

    it('adjustQuantity on a product not in the cart is a no-op (edge case)', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.adjustQuantity('does-not-exist', 1));

        expect(result.current.lines).toEqual([]);
    });

    it('persists cart contents to localStorage', async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        await waitFor(() => expect(result.current.lines).toEqual([]));

        act(() => result.current.addToCart('p1', 2));

        await waitFor(() => {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            expect(raw).toBe(JSON.stringify([{ productId: 'p1', quantity: 2 }]));
        });
    });

    it('hydrates cart contents from localStorage on mount', async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ productId: 'p9', quantity: 4 }]));

        const { result } = renderHook(() => useCart(), { wrapper });

        await waitFor(() => expect(result.current.lines).toEqual([{ productId: 'p9', quantity: 4 }]));
        expect(result.current.itemCount).toBe(4);
    });

    it('starts empty instead of crashing when localStorage holds malformed JSON (failure case)', async () => {
        window.localStorage.setItem(STORAGE_KEY, '{not valid json');

        const { result } = renderHook(() => useCart(), { wrapper });

        await waitFor(() => expect(result.current.lines).toEqual([]));
    });

    it('prunes lines for products that no longer exist/are inactive, so itemCount stays honest (regression case: header badge vs. cart page mismatch)', async () => {
        mockValidIds(['p1']); // p2 is stale — deleted/deactivated since it was added to this cart
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([
                { productId: 'p1', quantity: 2 },
                { productId: 'p2', quantity: 3 },
            ])
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        await waitFor(() => expect(result.current.lines).toEqual([{ productId: 'p1', quantity: 2 }]));
        expect(result.current.itemCount).toBe(2);
    });

    it('keeps all lines when every product is still valid (no unnecessary state churn)', async () => {
        mockValidIds(['p1', 'p2']);
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([
                { productId: 'p1', quantity: 2 },
                { productId: 'p2', quantity: 1 },
            ])
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        await waitFor(() => expect(inMock).toHaveBeenCalled());
        expect(result.current.lines).toEqual([
            { productId: 'p1', quantity: 2 },
            { productId: 'p2', quantity: 1 },
        ]);
        expect(result.current.itemCount).toBe(3);
    });
});
