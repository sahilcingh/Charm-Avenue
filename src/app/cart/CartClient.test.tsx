import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import React from 'react';
import CartClient from './CartClient';
import { CartProvider } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { WishlistProvider } from '@/lib/wishlist-context';

const productsFromMock = vi.fn();
const getUserMock = vi.fn();
const wishlistSelectEqMock = vi.fn();
const wishlistInsertMock = vi.fn();
const wishlistDeleteEqEqMock = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: getUserMock,
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
        from: (table: string) =>
            table === 'wishlist_items'
                ? {
                      select: () => ({ eq: wishlistSelectEqMock }),
                      insert: wishlistInsertMock,
                      delete: () => ({ eq: () => ({ eq: wishlistDeleteEqEqMock }) }),
                  }
                : productsFromMock(),
    }),
}));

function mockLoggedOut() {
    getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockLoggedIn(wishlisted: string[] = []) {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    wishlistSelectEqMock.mockResolvedValue({ data: wishlisted.map((id) => ({ product_id: id })) });
}

const STORAGE_KEY = 'charm-avenue-cart';

function makeProductRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: 'p1',
        slug: 'panda-lamp',
        name: 'Panda Lamp',
        category_slug: 'gifts-novelty',
        category: { title: 'Gifts & Novelty' },
        price: 130,
        original_price: null,
        image: '/assets/images/no_image.png',
        image_alt: 'Panda Lamp',
        tag: null,
        tag_bg: null,
        tag_text: null,
        emoji: '🐼',
        description: '',
        rating: 4.5,
        review_count: 0,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

function mockProductRows(rows: ReturnType<typeof makeProductRow>[]) {
    productsFromMock.mockReturnValue({
        select: () => ({
            // CartClient's own full-detail fetch.
            in: () => Promise.resolve({ data: rows }),
            // CartProvider's independent is_active validity check.
            eq: () => ({
                in: () => Promise.resolve({ data: rows.filter((r) => r.is_active).map((r) => ({ id: r.id })) }),
            }),
        }),
    });
}

function renderCartWithLines(lines: { productId: string; quantity: number }[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    return render(
        <ToastProvider>
            <CartProvider>
                <WishlistProvider>
                    <CartClient />
                </WishlistProvider>
            </CartProvider>
        </ToastProvider>
    );
}

beforeEach(() => {
    window.localStorage.clear();
    productsFromMock.mockReset();
    getUserMock.mockReset();
    wishlistSelectEqMock.mockReset();
    wishlistInsertMock.mockReset();
    wishlistDeleteEqEqMock.mockReset();
    mockLoggedOut();
    wishlistInsertMock.mockResolvedValue({ error: null });
    wishlistDeleteEqEqMock.mockResolvedValue({ error: null });
});

describe('CartClient', () => {
    it('shows a loading state while the cart still has unresolved lines', () => {
        // A non-empty cart triggers the async Supabase fetch, which stays pending
        // (never resolved in this test) — so the loading state must still be showing.
        productsFromMock.mockReturnValue({
            select: () => ({ in: () => new Promise(() => {}), eq: () => ({ in: () => new Promise(() => {}) }) }),
        });
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);
        expect(screen.getByText('Loading your bag…')).toBeInTheDocument();
    });

    it('shows the empty-bag state when there are no lines', async () => {
        mockProductRows([]);
        renderCartWithLines([]);

        expect(await screen.findByText('Your bag is empty')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Start Shopping/i })).toHaveAttribute('href', '/shop');
    });

    it('renders every line item with name, category, and correct subtotal/total for multiple products', async () => {
        mockProductRows([
            makeProductRow({ id: 'p1', slug: 'panda-lamp', name: 'Panda Lamp', price: 130 }),
            makeProductRow({ id: 'p2', slug: 'water-keychains', name: 'Water Keychains', price: 150 }),
        ]);
        renderCartWithLines([
            { productId: 'p1', quantity: 2 },
            { productId: 'p2', quantity: 1 },
        ]);

        expect(await screen.findByText('Panda Lamp')).toBeInTheDocument();
        expect(screen.getByText('Water Keychains')).toBeInTheDocument();
        expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument();

        // Subtotal = 130*2 + 150*1 = 410, shown in both the subtotal row and the total row.
        expect(screen.getAllByText('₹410')).toHaveLength(2);
    });

    it('silently drops a cart line whose product no longer exists/is inactive, instead of crashing (edge case)', async () => {
        // Cart has two lines, but Supabase only returns the still-active one.
        mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp' })]);
        renderCartWithLines([
            { productId: 'p1', quantity: 1 },
            { productId: 'deleted-product', quantity: 1 },
        ]);

        expect(await screen.findByText('Panda Lamp')).toBeInTheDocument();
        expect(screen.getByText('Subtotal (1 items)')).toBeInTheDocument();
    });

    it('increases quantity and subtotal when the + button is clicked', async () => {
        mockProductRows([makeProductRow({ price: 130 })]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        const row = screen.getByText('Panda Lamp').closest('div.flex.gap-4') as HTMLElement;

        act(() => within(row).getByLabelText('Increase quantity').click());

        expect(within(row).getByText('2')).toBeInTheDocument();
        expect(within(row).getByText('₹260')).toBeInTheDocument();
    });

    it('decreases quantity down to removing the item entirely once it hits zero', async () => {
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        screen.getByLabelText('Decrease quantity').click();

        expect(await screen.findByText('Your bag is empty')).toBeInTheDocument();
    });

    it('survives two quantity-button clicks batched into the same render pass without losing an update (concurrency/regression case)', async () => {
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 5 }]);

        await screen.findByText('Panda Lamp');
        const button = screen.getByLabelText('Decrease quantity');

        // Both clicks flushed within a single act() call, so React batches them together —
        // this is what would expose a stale-closure bug if adjustQuantity weren't wired in correctly.
        act(() => {
            button.click();
            button.click();
        });

        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('removes an item entirely via the remove button', async () => {
        mockProductRows([
            makeProductRow({ id: 'p1', name: 'Panda Lamp' }),
            makeProductRow({ id: 'p2', name: 'Water Keychains', slug: 'water-keychains' }),
        ]);
        renderCartWithLines([
            { productId: 'p1', quantity: 1 },
            { productId: 'p2', quantity: 1 },
        ]);

        await screen.findByText('Panda Lamp');
        const row = screen.getByText('Panda Lamp').closest('div.flex.gap-4') as HTMLElement;
        act(() => within(row).getByLabelText('Remove item').click());

        expect(screen.queryByText('Panda Lamp')).not.toBeInTheDocument();
        expect(screen.getByText('Water Keychains')).toBeInTheDocument();
    });

    it('builds a WhatsApp enquiry link containing the cart contents and total', async () => {
        mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
        renderCartWithLines([{ productId: 'p1', quantity: 2 }]);

        await screen.findByText('Panda Lamp');
        const link = screen.getByRole('link', { name: /Enquire on WhatsApp/i });
        const href = link.getAttribute('href') ?? '';

        expect(href).toContain('https://wa.me/');
        expect(decodeURIComponent(href)).toContain('Panda Lamp x2 - ₹260');
        expect(decodeURIComponent(href)).toContain('Total: ₹260');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('links Continue Shopping to /shop', async () => {
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/shop');
    });

    it('links the product image and name to the correct product page by slug', async () => {
        mockProductRows([makeProductRow({ slug: 'panda-lamp' })]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        // Both the image wrapper and the name text render as separate links sharing
        // the same accessible name (the image's alt text matches the product name).
        const links = screen.getAllByRole('link', { name: 'Panda Lamp' });
        expect(links).toHaveLength(2);
        links.forEach((link) => expect(link).toHaveAttribute('href', '/product/panda-lamp'));
    });

    it('prompts sign-in instead of saving when a logged-out visitor clicks the wishlist heart on a cart item (edge case)', async () => {
        mockLoggedOut();
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        act(() => screen.getByLabelText('Add to wishlist').click());

        expect(await screen.findByText('Sign in to save favorites')).toBeInTheDocument();
        expect(wishlistInsertMock).not.toHaveBeenCalled();
    });

    it('saves a cart item to the wishlist when a logged-in customer clicks its heart', async () => {
        mockLoggedIn([]);
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByText('Panda Lamp');
        await waitFor(() => expect(wishlistSelectEqMock).toHaveBeenCalled());
        act(() => screen.getByLabelText('Add to wishlist').click());

        await waitFor(() => expect(wishlistInsertMock).toHaveBeenCalledWith({ user_id: 'user-1', product_id: 'p1' }));
        expect(await screen.findByText('Panda Lamp added to your wishlist')).toBeInTheDocument();
        expect(await screen.findByLabelText('Remove from wishlist')).toBeInTheDocument();
    });

    it('removes a cart item from the wishlist when its heart is already saved', async () => {
        mockLoggedIn(['p1']);
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        const heart = await screen.findByLabelText('Remove from wishlist');
        act(() => heart.click());

        await waitFor(() => expect(wishlistDeleteEqEqMock).toHaveBeenCalled());
        expect(await screen.findByLabelText('Add to wishlist')).toBeInTheDocument();
    });

    it('removing an item from the cart does not affect its separate wishlist state', async () => {
        mockLoggedIn(['p1']);
        mockProductRows([makeProductRow()]);
        renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

        await screen.findByLabelText('Remove from wishlist');
        act(() => screen.getByLabelText('Remove item').click());

        expect(await screen.findByText('Your bag is empty')).toBeInTheDocument();
        expect(wishlistDeleteEqEqMock).not.toHaveBeenCalled();
    });
});
