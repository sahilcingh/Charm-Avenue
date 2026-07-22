import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { WishlistProvider, useWishlist } from './wishlist-context';

const getUserMock = vi.fn();
const selectEqMock = vi.fn();
const insertMock = vi.fn();
const deleteEqEqMock = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: getUserMock,
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        from: () => ({
            select: () => ({ eq: selectEqMock }),
            insert: insertMock,
            delete: () => ({ eq: () => ({ eq: deleteEqEqMock }) }),
        }),
    }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
    return <WishlistProvider>{children}</WishlistProvider>;
}

function mockLoggedOut() {
    getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockLoggedIn(existingProductIds: string[] = []) {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    selectEqMock.mockResolvedValue({ data: existingProductIds.map((id) => ({ product_id: id })) });
}

beforeEach(() => {
    getUserMock.mockReset();
    selectEqMock.mockReset();
    insertMock.mockReset();
    deleteEqEqMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    deleteEqEqMock.mockResolvedValue({ error: null });
});

describe('WishlistProvider / useWishlist', () => {
    it('throws when used outside a WishlistProvider (failure case)', () => {
        expect(() => renderHook(() => useWishlist())).toThrow('useWishlist must be used within a WishlistProvider');
    });

    it('starts logged out with an empty wishlist', async () => {
        mockLoggedOut();
        const { result } = renderHook(() => useWishlist(), { wrapper });

        await waitFor(() => expect(result.current.isLoggedIn).toBe(false));
        expect(result.current.count).toBe(0);
        expect(result.current.isInWishlist('p1')).toBe(false);
    });

    it('loads the existing wishlist for a logged-in user on mount', async () => {
        mockLoggedIn(['p1', 'p2']);
        const { result } = renderHook(() => useWishlist(), { wrapper });

        await waitFor(() => expect(result.current.count).toBe(2));
        expect(result.current.isInWishlist('p1')).toBe(true);
        expect(result.current.isInWishlist('p2')).toBe(true);
        expect(result.current.isInWishlist('p3')).toBe(false);
    });

    it('normal case: adds a product not yet in the wishlist', async () => {
        mockLoggedIn([]);
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('p1');
        });

        expect(outcome).toBe('added');
        expect(result.current.isInWishlist('p1')).toBe(true);
        expect(result.current.count).toBe(1);
        expect(insertMock).toHaveBeenCalledWith({ user_id: 'user-1', product_id: 'p1' });
    });

    it('normal case: removes a product already in the wishlist', async () => {
        mockLoggedIn(['p1']);
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.count).toBe(1));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('p1');
        });

        expect(outcome).toBe('removed');
        expect(result.current.isInWishlist('p1')).toBe(false);
        expect(result.current.count).toBe(0);
        expect(deleteEqEqMock).toHaveBeenCalled();
    });

    it('returns not-logged-in and makes no Supabase call when logged out', async () => {
        mockLoggedOut();
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.isLoggedIn).toBe(false));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('p1');
        });

        expect(outcome).toBe('not-logged-in');
        expect(insertMock).not.toHaveBeenCalled();
        expect(deleteEqEqMock).not.toHaveBeenCalled();
    });

    it('missing field: rejects an empty product id without ever calling Supabase', async () => {
        mockLoggedIn([]);
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('');
        });

        expect(outcome).toBe('invalid-product');
        expect(insertMock).not.toHaveBeenCalled();
    });

    it('missing field: rejects a whitespace-only product id (edge case)', async () => {
        mockLoggedIn([]);
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('   ');
        });

        expect(outcome).toBe('invalid-product');
        expect(insertMock).not.toHaveBeenCalled();
    });

    it('leaves state unchanged when the insert fails', async () => {
        mockLoggedIn([]);
        insertMock.mockResolvedValue({ error: { message: 'boom' } });
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('p1');
        });

        expect(outcome).toBe('error');
        expect(result.current.isInWishlist('p1')).toBe(false);
        expect(result.current.count).toBe(0);
    });

    it('leaves state unchanged when the delete fails', async () => {
        mockLoggedIn(['p1']);
        deleteEqEqMock.mockResolvedValue({ error: { message: 'boom' } });
        const { result } = renderHook(() => useWishlist(), { wrapper });
        await waitFor(() => expect(result.current.count).toBe(1));

        let outcome: string | undefined;
        await act(async () => {
            outcome = await result.current.toggleWishlist('p1');
        });

        expect(outcome).toBe('error');
        expect(result.current.isInWishlist('p1')).toBe(true);
        expect(result.current.count).toBe(1);
    });
});
