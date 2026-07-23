import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import ProductCard from './ProductCard';
import { CartProvider, useCart } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { AdminModeProvider, ADMIN_MODE_STORAGE_KEY } from '@/lib/admin-mode-context';
import type { Product } from '@/lib/supabase/product-mapper';

const getUserMock = vi.fn();
const insertMock = vi.fn();
const deleteEqEqMock = vi.fn();
const selectEqMock = vi.fn();
const pushMock = vi.fn();
const profileIsAdminMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    // CartProvider's self-pruning validity check queries 'products' — treat every
    // queried id as valid/active so it never interferes with wishlist-focused tests.
    // AdminModeProvider queries 'profiles' for is_admin — defaults to non-admin
    // (see beforeEach) so the wishlist-focused tests are unaffected; the admin-only
    // tests below override it per-case.
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              in: (_col: string, ids: string[]) =>
                Promise.resolve({ data: ids.map((id) => ({ id })) }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: profileIsAdminMock }) }) };
      }
      return {
        select: () => ({ eq: selectEqMock }),
        insert: insertMock,
        delete: () => ({ eq: () => ({ eq: deleteEqEqMock }) }),
      };
    },
  }),
}));

const product: Product = {
  id: 'p1',
  slug: 'panda-lamp',
  name: 'Panda Lamp',
  categorySlug: 'gifts-novelty',
  category: 'Gifts & Novelty',
  price: 130,
  image: '/assets/images/no_image.png',
  imageAlt: 'Panda Lamp',
  emoji: '🐼',
  description: '',
  rating: 4.5,
  reviewCount: 0,
  personalizationEnabled: false,
  personalizationLabel: null,
  personalizationRequired: false,
  personalizationMaxLength: null,
  saleStartsAt: null,
  saleEndsAt: null,
  stockStatus: null,
  madeToOrderLeadTime: null,
  lowStockThreshold: null,
  stockCount: null,
  dimensions: null,
  material: null,
  careInstructions: null,
};

function CartProbe() {
  const { itemCount } = useCart();
  return <div data-testid="cart-probe">{itemCount}</div>;
}

function renderCard(overrides: Partial<Product> = {}) {
  return render(
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <AdminModeProvider>
            <ProductCard product={{ ...product, ...overrides }} />
            <CartProbe />
          </AdminModeProvider>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}

function mockLoggedOut() {
  getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockLoggedIn(wishlisted: string[] = []) {
  getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  selectEqMock.mockResolvedValue({ data: wishlisted.map((id) => ({ product_id: id })) });
}

function mockLoggedInAsAdmin() {
  getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  selectEqMock.mockResolvedValue({ data: [] });
  profileIsAdminMock.mockResolvedValue({ data: { is_admin: true } });
}

beforeEach(() => {
  window.localStorage.clear();
  getUserMock.mockReset();
  insertMock.mockReset();
  deleteEqEqMock.mockReset();
  selectEqMock.mockReset();
  pushMock.mockReset();
  profileIsAdminMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
  deleteEqEqMock.mockResolvedValue({ error: null });
  profileIsAdminMock.mockResolvedValue({ data: { is_admin: false } });
});

// A failed assertion inside a fake-timers test would otherwise skip its own
// vi.useRealTimers() cleanup and leave every later test's waitFor()/findBy()
// hanging on fake time — restore real timers unconditionally after each test.
afterEach(() => {
  vi.useRealTimers();
});

describe('ProductCard', () => {
  it('renders the product name, category, and price', () => {
    mockLoggedOut();
    renderCard();

    expect(screen.getByText('Panda Lamp')).toBeInTheDocument();
    expect(screen.getByText('Gifts & Novelty')).toBeInTheDocument();
    expect(screen.getByText('₹130')).toBeInTheDocument();
  });

  it('shows the original-price strike-through when there is no sale window at all (matches pre-Phase-6 behavior)', () => {
    mockLoggedOut();
    renderCard({ originalPrice: 180 });
    expect(screen.getByText('₹180')).toBeInTheDocument();
  });

  it('shows the original-price strike-through while now is inside the sale window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
    mockLoggedOut();
    renderCard({
      originalPrice: 180,
      saleStartsAt: '2026-01-01T00:00:00Z',
      saleEndsAt: '2026-01-31T00:00:00Z',
    });
    expect(screen.getByText('₹180')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('hides the original-price strike-through once the sale window has ended', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-15T00:00:00Z'));
    mockLoggedOut();
    renderCard({
      originalPrice: 180,
      saleStartsAt: '2026-01-01T00:00:00Z',
      saleEndsAt: '2026-01-31T00:00:00Z',
    });
    expect(screen.queryByText('₹180')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('links to the product page by slug', () => {
    mockLoggedOut();
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp');
  });

  it('adds the product to the cart via Quick Add', async () => {
    mockLoggedOut();
    renderCard();

    act(() => screen.getByRole('button', { name: /Quick Add/i }).click());

    expect(await screen.findByTestId('cart-probe')).toHaveTextContent('1');
    expect(await screen.findByText('Panda Lamp added to your bag')).toBeInTheDocument();
  });

  it('prompts sign-in instead of saving when a logged-out visitor clicks the wishlist heart (edge case)', async () => {
    mockLoggedOut();
    renderCard();

    act(() => screen.getByRole('button', { name: 'Add to wishlist' }).click());

    expect(await screen.findByText('Sign in to save favorites')).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('saves the product to the wishlist when a logged-in customer clicks the heart', async () => {
    mockLoggedIn([]);
    renderCard();

    await waitFor(() => expect(selectEqMock).toHaveBeenCalled());
    act(() => screen.getByRole('button', { name: 'Add to wishlist' }).click());

    await waitFor(() =>
      expect(insertMock).toHaveBeenCalledWith({ user_id: 'user-1', product_id: 'p1' })
    );
    expect(await screen.findByText('Panda Lamp added to your wishlist')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Remove from wishlist' })).toBeInTheDocument();
  });

  it('removes the product from the wishlist when clicking an already-saved heart, without a toast (matches cart remove convention)', async () => {
    mockLoggedIn(['p1']);
    renderCard();

    const button = await screen.findByRole('button', { name: 'Remove from wishlist' });
    act(() => button.click());

    await waitFor(() => expect(deleteEqEqMock).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Add to wishlist' })).toBeInTheDocument();
  });

  it('shows an error toast and leaves the heart state unchanged if the wishlist write fails (failure case)', async () => {
    mockLoggedIn([]);
    insertMock.mockResolvedValue({ error: { message: 'network error' } });
    renderCard();

    await waitFor(() => expect(selectEqMock).toHaveBeenCalled());
    act(() => screen.getByRole('button', { name: 'Add to wishlist' }).click());

    expect(
      await screen.findByText('Could not update your wishlist. Please try again.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to wishlist' })).toBeInTheDocument();
  });
});

describe('ProductCard — admin edit controls', () => {
  it('does not render the edit control for a regular (non-admin) user', async () => {
    mockLoggedIn([]);
    renderCard();

    await waitFor(() => expect(selectEqMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /edit panda lamp/i })).not.toBeInTheDocument();
  });

  it('does not render the edit control for a non-admin even with a stale "admin mode on" preference left in localStorage (failure case: a leaked/forged preference must not grant admin UI)', async () => {
    window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, 'true');
    mockLoggedIn([]);
    renderCard();

    await waitFor(() => expect(selectEqMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /edit panda lamp/i })).not.toBeInTheDocument();
  });

  it('does not render the edit control for an admin while admin mode is off (the default)', async () => {
    mockLoggedInAsAdmin();
    renderCard();

    await waitFor(() => expect(profileIsAdminMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /edit panda lamp/i })).not.toBeInTheDocument();
  });

  it("renders the edit control for an admin with admin mode on, and navigates to that product's edit page when clicked", async () => {
    window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, 'true');
    mockLoggedInAsAdmin();
    renderCard();

    const editButton = await screen.findByRole('button', { name: /edit panda lamp/i });
    act(() => editButton.click());

    expect(pushMock).toHaveBeenCalledWith('/admin/products/p1');
  });
});
