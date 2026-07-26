import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Header from './Header';

let mockPathname = '/shop';
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/cart-context', () => ({
  useCart: () => ({ itemCount: 0 }),
}));

vi.mock('@/lib/admin-mode-context', () => ({
  useAdminMode: () => ({ isAdmin: false, user: null }),
}));

vi.mock('@/lib/use-live-product-search', () => ({
  useLiveProductSearch: () => ({ results: [], loading: false }),
}));

describe('Header — Shop/New Arrivals/Best Sellers highlight exactly one at a time', () => {
  it('only highlights "Shop" on the plain /shop page with no filter', () => {
    mockPathname = '/shop';
    mockSearchParams = new URLSearchParams();
    render(<Header />);

    const active = screen.getAllByRole('link', { name: /^(Shop|New Arrivals|Best Sellers)$/ });
    const activeLabels = active
      .filter((el) => (el as HTMLElement).style.color === 'var(--blush-rose)')
      .map((el) => el.textContent);

    expect(activeLabels).toEqual(['Shop']);
  });

  it('only highlights "New Arrivals" on /shop?filter=new, not Shop or Best Sellers', () => {
    mockPathname = '/shop';
    mockSearchParams = new URLSearchParams('filter=new');
    render(<Header />);

    const active = screen
      .getAllByRole('link', { name: /^(Shop|New Arrivals|Best Sellers)$/ })
      .filter((el) => (el as HTMLElement).style.color === 'var(--blush-rose)')
      .map((el) => el.textContent);

    expect(active).toEqual(['New Arrivals']);
  });

  it('only highlights "Best Sellers" on /shop?filter=bestseller, and it links to a distinct URL from Shop', () => {
    mockPathname = '/shop';
    mockSearchParams = new URLSearchParams('filter=bestseller');
    render(<Header />);

    const active = screen
      .getAllByRole('link', { name: /^(Shop|New Arrivals|Best Sellers)$/ })
      .filter((el) => (el as HTMLElement).style.color === 'var(--blush-rose)')
      .map((el) => el.textContent);
    expect(active).toEqual(['Best Sellers']);

    const bestSellersLinks = screen.getAllByRole('link', { name: 'Best Sellers' });
    const shopLinks = screen.getAllByRole('link', { name: 'Shop' });
    expect(bestSellersLinks[0]).toHaveAttribute('href', '/shop?filter=bestseller');
    expect(shopLinks[0]).toHaveAttribute('href', '/shop');
  });

  it('highlights "Shop" (not New Arrivals/Best Sellers) when browsing a category page', () => {
    mockPathname = '/shop/hair';
    mockSearchParams = new URLSearchParams();
    render(<Header />);

    const active = screen
      .getAllByRole('link', { name: /^(Shop|New Arrivals|Best Sellers)$/ })
      .filter((el) => (el as HTMLElement).style.color === 'var(--blush-rose)')
      .map((el) => el.textContent);

    expect(active).toEqual(['Shop']);
  });
});
