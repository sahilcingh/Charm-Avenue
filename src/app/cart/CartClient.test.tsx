import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import CartClient from './CartClient';
import { CartProvider } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { createWhatsAppEnquiry } from './actions';

const productsFromMock = vi.fn();
const getUserMock = vi.fn();
const wishlistSelectEqMock = vi.fn();
const wishlistInsertMock = vi.fn();
const wishlistDeleteEqEqMock = vi.fn();
const combosEqMock = vi.fn();
const variantsInMock = vi.fn();
const pushMock = vi.fn();
const openMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('./actions', () => ({
  createWhatsAppEnquiry: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: (table: string) => {
      if (table === 'wishlist_items') {
        return {
          select: () => ({ eq: wishlistSelectEqMock }),
          insert: wishlistInsertMock,
          delete: () => ({ eq: () => ({ eq: wishlistDeleteEqEqMock }) }),
        };
      }
      if (table === 'combos') {
        return { select: () => ({ eq: combosEqMock }) };
      }
      if (table === 'product_variants') {
        return { select: () => ({ in: variantsInMock }) };
      }
      return productsFromMock();
    },
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
        in: () =>
          Promise.resolve({ data: rows.filter((r) => r.is_active).map((r) => ({ id: r.id })) }),
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
  combosEqMock.mockReset();
  variantsInMock.mockReset();
  pushMock.mockReset();
  openMock.mockReset();
  vi.mocked(createWhatsAppEnquiry).mockReset();
  mockLoggedOut();
  wishlistInsertMock.mockResolvedValue({ error: null });
  wishlistDeleteEqEqMock.mockResolvedValue({ error: null });
  combosEqMock.mockResolvedValue({ data: [] });
  variantsInMock.mockResolvedValue({ data: [] });
  vi.mocked(createWhatsAppEnquiry).mockResolvedValue({
    orderId: 'order-1',
    whatsappUrl: 'https://wa.me/919999999999?text=hi',
  });
  vi.stubGlobal('open', openMock);
});

function mockCombos(
  rows: {
    id: string;
    name: string;
    discount_percent: number;
    combo_products: { product_id: string }[];
  }[]
) {
  combosEqMock.mockResolvedValue({ data: rows });
}

function fillContactDetails(name = 'Priya Sharma', phone = '9876543210') {
  fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('98765 43210'), { target: { value: phone } });
}

describe('CartClient', () => {
  it('shows a loading state while the cart still has unresolved lines', () => {
    // A non-empty cart triggers the async Supabase fetch, which stays pending
    // (never resolved in this test) — so the loading state must still be showing.
    productsFromMock.mockReturnValue({
      select: () => ({
        in: () => new Promise(() => {}),
        eq: () => ({ in: () => new Promise(() => {}) }),
      }),
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

  it('sends the cart as a WhatsApp enquiry, opens WhatsApp, and navigates to the confirmation page — no login required', async () => {
    mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
    renderCartWithLines([{ productId: 'p1', quantity: 2 }]);

    await screen.findByText('Panda Lamp');
    fillContactDetails('Priya Sharma', '9876543210');
    act(() => screen.getByRole('button', { name: /Enquire on WhatsApp/i }).click());

    await waitFor(() =>
      expect(createWhatsAppEnquiry).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            productId: 'p1',
            productName: 'Panda Lamp',
            unitPrice: 130,
            quantity: 2,
          }),
        ],
        { name: 'Priya Sharma', phone: '9876543210', address: '' },
        0
      )
    );
    await waitFor(() =>
      expect(openMock).toHaveBeenCalledWith(
        'https://wa.me/919999999999?text=hi',
        '_blank',
        'noopener,noreferrer'
      )
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/order/order-1'));
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]'));
  });

  it('includes variant and personalization details in the enquiry line items when present', async () => {
    mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
    variantsInMock.mockResolvedValue({
      data: [
        {
          id: 'variant-1',
          product_id: 'p1',
          color: 'Red',
          size: null,
          price_override: null,
          original_price_override: null,
          image: null,
          stock_status: null,
          stock_count: null,
          is_active: true,
        },
      ],
    });
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { productId: 'p1', variantId: 'variant-1', personalizationText: 'For Priya', quantity: 1 },
      ])
    );
    render(
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <CartClient />
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    );

    await screen.findByText('Panda Lamp');
    fillContactDetails('Priya Sharma', '9876543210');
    act(() => screen.getByRole('button', { name: /Enquire on WhatsApp/i }).click());

    await waitFor(() =>
      expect(createWhatsAppEnquiry).toHaveBeenCalledWith(
        [expect.objectContaining({ variantId: 'variant-1', personalizationText: 'For Priya' })],
        expect.objectContaining({ name: 'Priya Sharma', phone: '9876543210' }),
        0
      )
    );
  });

  it('shows an error and does not navigate when the enquiry fails to save', async () => {
    vi.mocked(createWhatsAppEnquiry).mockResolvedValue({
      error: 'Could not record your enquiry. Please try again.',
    });
    mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
    renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

    await screen.findByText('Panda Lamp');
    fillContactDetails('Priya Sharma', '9876543210');
    act(() => screen.getByRole('button', { name: /Enquire on WhatsApp/i }).click());

    expect(
      await screen.findByText('Could not record your enquiry. Please try again.')
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(openMock).not.toHaveBeenCalled();
    expect(screen.getByText('Panda Lamp')).toBeInTheDocument();
  });

  it('shows validation errors and does not call the enquiry action when name and phone are left blank', async () => {
    mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
    renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

    await screen.findByText('Panda Lamp');
    act(() => screen.getByRole('button', { name: /Enquire on WhatsApp/i }).click());

    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid 10-digit mobile number.')).toBeInTheDocument();
    expect(createWhatsAppEnquiry).not.toHaveBeenCalled();
  });

  it('sends the enquiry with a blank address when none is entered — address is optional', async () => {
    mockProductRows([makeProductRow({ id: 'p1', name: 'Panda Lamp', price: 130 })]);
    renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

    await screen.findByText('Panda Lamp');
    fillContactDetails('Priya Sharma', '9876543210');
    act(() => screen.getByRole('button', { name: /Enquire on WhatsApp/i }).click());

    await waitFor(() =>
      expect(createWhatsAppEnquiry).toHaveBeenCalledWith(
        expect.anything(),
        { name: 'Priya Sharma', phone: '9876543210', address: '' },
        0
      )
    );
  });

  it('links Continue Shopping to /shop', async () => {
    mockProductRows([makeProductRow()]);
    renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

    await screen.findByText('Panda Lamp');
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute(
      'href',
      '/shop'
    );
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

    await waitFor(() =>
      expect(wishlistInsertMock).toHaveBeenCalledWith({ user_id: 'user-1', product_id: 'p1' })
    );
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

  it('shows a combo discount line and reduces the total when every combo product is in the cart', async () => {
    mockProductRows([
      makeProductRow({ id: 'p1', name: 'Earrings', price: 200 }),
      makeProductRow({ id: 'p2', name: 'Necklace', slug: 'necklace', price: 300 }),
    ]);
    mockCombos([
      {
        id: 'combo-1',
        name: 'Earrings + Necklace',
        discount_percent: 10,
        combo_products: [{ product_id: 'p1' }, { product_id: 'p2' }],
      },
    ]);
    renderCartWithLines([
      { productId: 'p1', quantity: 1 },
      { productId: 'p2', quantity: 1 },
    ]);

    expect(await screen.findByText('🎁 Earrings + Necklace — 10% off')).toBeInTheDocument();
    expect(screen.getByText('−₹50')).toBeInTheDocument();
    // Subtotal 500, discount 50 -> total 450 (subtotal row still shows 500).
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹450')).toBeInTheDocument();
  });

  it('does not show a combo discount when only some of its products are in the cart', async () => {
    mockProductRows([makeProductRow({ id: 'p1', name: 'Earrings', price: 200 })]);
    mockCombos([
      {
        id: 'combo-1',
        name: 'Earrings + Necklace',
        discount_percent: 10,
        combo_products: [{ product_id: 'p1' }, { product_id: 'p2' }],
      },
    ]);
    renderCartWithLines([{ productId: 'p1', quantity: 1 }]);

    await screen.findByText('Earrings');
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
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
