import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminBottomNav from './AdminBottomNav';

const pathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}));

describe('AdminBottomNav', () => {
  it('renders a tab for each admin section', () => {
    pathnameMock.mockReturnValue('/admin/products');
    render(<AdminBottomNav />);

    ['Products', 'Categories', 'Orders', 'Tags', 'Combos'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
  });

  it('marks the tab matching the current path as current', () => {
    pathnameMock.mockReturnValue('/admin/categories');
    render(<AdminBottomNav />);

    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Products' })).not.toHaveAttribute('aria-current');
  });

  it('marks a tab current for a nested path (e.g. an order detail page)', () => {
    pathnameMock.mockReturnValue('/admin/orders/abc-123');
    render(<AdminBottomNav />);

    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
  });

  it('links each tab to its section', () => {
    pathnameMock.mockReturnValue('/admin/products');
    render(<AdminBottomNav />);

    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'href',
      '/admin/products'
    );
    expect(screen.getByRole('link', { name: 'Combos' })).toHaveAttribute('href', '/admin/combos');
  });
});
