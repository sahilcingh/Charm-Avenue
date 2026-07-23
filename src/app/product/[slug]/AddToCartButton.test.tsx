import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import AddToCartButton from './AddToCartButton';
import { CartProvider, useCart } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';

// CartProvider's self-pruning validity check hits this — treat every queried id as valid/active
// by default so it never interferes with these Add-to-Bag-focused tests.
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({ in: (_col: string, ids: string[]) => Promise.resolve({ data: ids.map((id) => ({ id })) }) }),
            }),
        }),
    }),
}));

function CartProbe() {
    const { lines, itemCount } = useCart();
    return <div data-testid="probe">{itemCount}:{JSON.stringify(lines)}</div>;
}

function renderButton(props: Partial<React.ComponentProps<typeof AddToCartButton>> = {}) {
    return render(
        <ToastProvider>
            <CartProvider>
                <AddToCartButton productId="p1" productName="Panda Lamp" {...props} />
                <CartProbe />
            </CartProvider>
        </ToastProvider>
    );
}

beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
});

describe('AddToCartButton', () => {
    it('adds one unit of the product to the cart on click', async () => {
        renderButton();

        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByTestId('probe')).toHaveTextContent('1:[{"productId":"p1","quantity":1}]');
    });

    it('increments quantity on repeated clicks rather than duplicating the line', async () => {
        renderButton();
        const button = screen.getByRole('button', { name: /Add to Bag/i });

        act(() => button.click());
        act(() => button.click());
        act(() => button.click());

        expect(await screen.findByTestId('probe')).toHaveTextContent('3:[{"productId":"p1","quantity":3}]');
    });

    it('shows a toast confirming the product was added, linking to the cart', async () => {
        renderButton();
        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByText('Panda Lamp added to your bag')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View Bag' })).toHaveAttribute('href', '/cart');
    });

    it('temporarily shows "Added to Bag" and then reverts the label', async () => {
        vi.useFakeTimers();
        renderButton();

        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());
        expect(screen.getByRole('button', { name: 'Added to Bag' })).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(screen.getByRole('button', { name: 'Add to Bag' })).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('includes the selected variant id in the cart line when provided', async () => {
        renderButton({ variantId: 'variant-red' });
        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByTestId('probe')).toHaveTextContent('1:[{"productId":"p1","variantId":"variant-red","quantity":1}]');
    });

    it('includes the personalization text in the cart line when provided', async () => {
        renderButton({ personalizationText: 'For Priya' });
        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByTestId('probe')).toHaveTextContent('1:[{"productId":"p1","personalizationText":"For Priya","quantity":1}]');
    });

    it('blocks adding to cart and shows an error when personalization is required but left blank', async () => {
        renderButton({ personalizationRequired: true, personalizationText: '' });
        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByText(/please fill in the personalization field/i)).toBeInTheDocument();
        expect(screen.getByTestId('probe')).toHaveTextContent('0:[]');
    });

    it('allows adding to cart when personalization is required and filled in', async () => {
        renderButton({ personalizationRequired: true, personalizationText: 'For Priya' });
        act(() => screen.getByRole('button', { name: /Add to Bag/i }).click());

        expect(await screen.findByTestId('probe')).toHaveTextContent('1:[{"productId":"p1","personalizationText":"For Priya","quantity":1}]');
    });
});
