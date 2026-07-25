import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import React from 'react';
import ProductCard from './ProductCard';
import { CartProvider, useCart } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { AdminModeProvider } from '@/lib/admin-mode-context';
import type { Product } from '@/lib/supabase/product-mapper';

const getUserMock = vi.fn();
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
    // queried id as valid/active so it never interferes with these tests.
    // AdminModeProvider queries 'profiles' for is_admin — defaults to non-admin
    // (see beforeEach); the admin-only tests below override it per-case.
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
      // 'profiles'
      return { select: () => ({ eq: () => ({ single: profileIsAdminMock }) }) };
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
  colorVariants: [],
};

function CartProbe() {
  const { itemCount } = useCart();
  return <div data-testid="cart-probe">{itemCount}</div>;
}

function renderCard(overrides: Partial<Product> = {}) {
  return render(
    <ToastProvider>
      <CartProvider>
        <AdminModeProvider>
          <ProductCard product={{ ...product, ...overrides }} />
          <CartProbe />
        </AdminModeProvider>
      </CartProvider>
    </ToastProvider>
  );
}

function mockLoggedOut() {
  getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockLoggedIn() {
  getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
}

function mockLoggedInAsAdmin() {
  getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  profileIsAdminMock.mockResolvedValue({ data: { is_admin: true } });
}

beforeEach(() => {
  window.localStorage.clear();
  getUserMock.mockReset();
  pushMock.mockReset();
  profileIsAdminMock.mockReset();
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
});

describe('ProductCard — color swatches', () => {
  const colorVariants = [
    { id: 'v1', color: 'Pink', image: '/pink.jpg', price: null, originalPrice: null },
    { id: 'v2', color: 'Blue', image: '/blue.jpg', price: 150, originalPrice: 200 },
  ];

  it('renders no swatches when the product has no color variants', () => {
    mockLoggedOut();
    renderCard();
    expect(screen.queryByRole('button', { name: /View Panda Lamp in/i })).not.toBeInTheDocument();
  });

  it('renders one swatch per color variant', () => {
    mockLoggedOut();
    renderCard({ colorVariants });
    expect(screen.getByRole('button', { name: 'View Panda Lamp in Pink' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Panda Lamp in Blue' })).toBeInTheDocument();
  });

  it('caps visible swatches (reserving one slot for the default photo) and shows a "+N" overflow indicator', () => {
    mockLoggedOut();
    const many = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      color: `Color${i}`,
      image: null,
      price: null,
      originalPrice: null,
    }));
    renderCard({ colorVariants: many });
    expect(screen.getAllByRole('button', { name: /^View Panda Lamp in/ })).toHaveLength(4);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  describe('"+N" overflow popover', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      color: `Color${i}`,
      image: null,
      price: null,
      originalPrice: null,
    }));

    it('opens a popover listing the hidden colors instead of navigating (failure case: previously this was a plain span, so any tap on it just opened the product page)', () => {
      mockLoggedOut();
      renderCard({ colorVariants: many });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      act(() => screen.getByRole('button', { name: /Show 3 more colors/i }).click());

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Color4' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Color5' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Color6' })).toBeInTheDocument();
    });

    it('selecting a color from the popover selects that variant and closes the popover', () => {
      mockLoggedOut();
      renderCard({ colorVariants: many });

      act(() => screen.getByRole('button', { name: /Show 3 more colors/i }).click());
      act(() => screen.getByRole('menuitem', { name: 'Color5' }).click());

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp?color=Color5');
    });

    it('closes the popover when clicking outside of it', () => {
      mockLoggedOut();
      renderCard({ colorVariants: many });

      act(() => screen.getByRole('button', { name: /Show 3 more colors/i }).click());
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => {
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('toggles closed when the "+N" button is clicked again', () => {
      mockLoggedOut();
      renderCard({ colorVariants: many });

      const trigger = screen.getByRole('button', { name: /Show 3 more colors/i });
      act(() => trigger.click());
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => trigger.click());
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it("includes a swatch for the product's own default photo alongside the real variants", () => {
    mockLoggedOut();
    renderCard({ colorVariants });
    const defaultSwatch = screen.getByRole('button', { name: 'View Panda Lamp (default)' });
    expect(defaultSwatch).toBeInTheDocument();
    expect(defaultSwatch).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders the selected swatch larger than the unselected ones, and updates as selection changes', () => {
    mockLoggedOut();
    renderCard({ colorVariants });

    const defaultSwatch = screen.getByRole('button', { name: 'View Panda Lamp (default)' });
    const pinkSwatch = screen.getByRole('button', { name: 'View Panda Lamp in Pink' });
    expect(defaultSwatch.className).toContain('scale-125');
    expect(pinkSwatch.className).toContain('scale-100');

    act(() => pinkSwatch.click());

    expect(defaultSwatch.className).toContain('scale-100');
    expect(pinkSwatch.className).toContain('scale-125');
  });

  it('clicking the default swatch after selecting a color reverts the card to the base product', () => {
    mockLoggedOut();
    renderCard({ colorVariants, price: 130, originalPrice: undefined });

    act(() => screen.getByRole('button', { name: 'View Panda Lamp in Blue' }).click());
    expect(screen.getByText('₹150')).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'View Panda Lamp (default)' }).click());

    expect(screen.getByText('₹130')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Panda Lamp (default)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it(
    'links with an explicit ?color=default once a product has variants — so the product page ' +
      "can't fall back to auto-selecting its first variant and silently override the card's " +
      'current selection (the bug: switching back to Default on the card still opened the ' +
      "previously-picked variant's page)",
    () => {
      mockLoggedOut();
      renderCard({ colorVariants });
      expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp?color=default');

      act(() => screen.getByRole('button', { name: 'View Panda Lamp in Blue' }).click());
      expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp?color=Blue');

      act(() => screen.getByRole('button', { name: 'View Panda Lamp (default)' }).click());
      expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp?color=default');
    }
  );

  it('selecting a swatch swaps the displayed image and price without navigating', () => {
    mockLoggedOut();
    renderCard({ colorVariants, price: 130, originalPrice: undefined });

    act(() => screen.getByRole('button', { name: 'View Panda Lamp in Blue' }).click());

    expect(screen.getByText('₹150')).toBeInTheDocument();
    expect(screen.getByText('₹200')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/panda-lamp?color=Blue');
  });

  it('falls back to the base product image/price when the selected variant has no override', () => {
    mockLoggedOut();
    renderCard({ colorVariants });

    act(() => screen.getByRole('button', { name: 'View Panda Lamp in Pink' }).click());

    expect(screen.getByText('₹130')).toBeInTheDocument();
  });

  it('adds the selected variant (not the base product) to the cart via Quick Add', async () => {
    mockLoggedOut();
    renderCard({ colorVariants });

    act(() => screen.getByRole('button', { name: 'View Panda Lamp in Blue' }).click());
    act(() => screen.getByRole('button', { name: /Quick Add/i }).click());

    await waitFor(() => expect(screen.getByTestId('cart-probe')).toHaveTextContent('1'));
    const stored = JSON.parse(window.localStorage.getItem('charm-avenue-cart') ?? '[]');
    expect(stored).toEqual([{ productId: 'p1', variantId: 'v2', quantity: 1 }]);
  });

  it("borders an unselected swatch in the admin's own color name, and switches to the brand rose once selected", () => {
    mockLoggedOut();
    renderCard({ colorVariants });

    const blueSwatch = screen.getByRole('button', { name: 'View Panda Lamp in Blue' });
    expect(blueSwatch).toHaveStyle({ borderColor: 'rgb(0, 0, 255)' });

    act(() => blueSwatch.click());
    expect(blueSwatch.style.border).toBe('2px solid var(--blush-rose)');
  });

  it('never resolves a variant color while server rendering, so the first client paint matches the server HTML exactly (failure case: resolving it during SSR would trigger a React hydration mismatch, since jsdom-based color validation is unavailable in Node)', () => {
    const html = renderToString(
      <ToastProvider>
        <CartProvider>
          <AdminModeProvider>
            <ProductCard product={{ ...product, colorVariants }} />
          </AdminModeProvider>
        </CartProvider>
      </ToastProvider>
    );

    expect(html).not.toContain('solid Pink');
    expect(html).not.toContain('solid Blue');
    expect(html).toContain('solid #FFFFFF');
  });

  it('falls back to a neutral border for a color name that is not valid CSS (e.g. "Rose Gold")', () => {
    mockLoggedOut();
    renderCard({
      colorVariants: [
        { id: 'v3', color: 'Rose Gold', image: '/rg.jpg', price: null, originalPrice: null },
      ],
    });
    expect(screen.getByRole('button', { name: 'View Panda Lamp in Rose Gold' })).toHaveStyle({
      borderColor: '#FFFFFF',
    });
  });

  it('preloads a hidden copy of a variant photo on hover, without rendering one for the currently selected variant', () => {
    mockLoggedOut();
    renderCard({ colorVariants });

    const hiddenPreload = () => document.querySelector('[aria-hidden] img[src*="blue.jpg"]');
    expect(hiddenPreload()).not.toBeInTheDocument();

    act(() => {
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'View Panda Lamp in Blue' }));
    });
    expect(hiddenPreload()).toBeInTheDocument();

    // Once Blue is actually selected it's the visible display, not a hidden preload anymore.
    act(() => screen.getByRole('button', { name: 'View Panda Lamp in Blue' }).click());
    expect(hiddenPreload()).not.toBeInTheDocument();
  });
});

describe('ProductCard — admin edit controls', () => {
  it('does not render the edit control for a regular (non-admin) user', async () => {
    mockLoggedIn();
    renderCard();

    await waitFor(() => expect(profileIsAdminMock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /edit panda lamp/i })).not.toBeInTheDocument();
  });

  it("renders the edit control for an admin, and navigates to that product's edit page when clicked", async () => {
    mockLoggedInAsAdmin();
    renderCard();

    const editButton = await screen.findByRole('button', { name: /edit panda lamp/i });
    act(() => editButton.click());

    expect(pushMock).toHaveBeenCalledWith('/admin/products/p1');
  });
});
