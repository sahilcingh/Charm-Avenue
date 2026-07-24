import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import CategoryManager from './CategoryManager';
import { deleteCategory } from './actions';
import type { DbCategory } from '@/lib/supabase/types';

vi.mock('./actions', () => ({
  deleteCategory: vi.fn(),
}));

let lastModalProps: Record<string, unknown> | null = null;
vi.mock('./CategoryFormModal', () => ({
  default: (props: Record<string, unknown>) => {
    lastModalProps = props;
    if (!props.open) return null;
    return (
      <div data-testid="category-modal">
        <button onClick={() => (props.onSaved as (c: unknown) => void)({ ...NEW_CATEGORY })}>
          fake-save
        </button>
        <button onClick={props.onClose as () => void}>fake-close</button>
      </div>
    );
  },
}));

const NEW_CATEGORY: DbCategory = {
  slug: 'new-cat',
  title: 'New Category',
  subtitle: 'Sub',
  emoji: '✨',
  tag: 'New',
  image: '/img.jpg',
  image_alt: 'New Category',
  tag_bg: '#F6D3D6',
  tag_text: '#1E1712',
  description: 'Desc',
  sort_order: 0,
};

const jewellery: DbCategory = {
  slug: 'jewellery',
  title: 'Anti-Tarnish Jewellery',
  subtitle: 'Rings · Bracelets',
  emoji: '💍',
  tag: 'Best Seller',
  image: '/jewellery.jpg',
  image_alt: 'Jewellery',
  tag_bg: '#E8828F',
  tag_text: '#FFFFFF',
  description: 'Jewellery that stays.',
  sort_order: 1,
};

const hairAccessories: DbCategory = {
  slug: 'hair',
  title: 'Hair Accessories',
  subtitle: 'Clips · Bands',
  emoji: '🎀',
  tag: 'Trending',
  image: '/hair.jpg',
  image_alt: 'Hair Accessories',
  tag_bg: '#D1636F',
  tag_text: '#FFFFFF',
  description: 'Cute hair finds.',
  sort_order: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  lastModalProps = null;
});

describe('CategoryManager', () => {
  it('shows an empty state with no categories', () => {
    render(<CategoryManager categories={[]} productsByCategory={{}} />);
    expect(screen.getByText(/No categories yet/)).toBeInTheDocument();
  });

  it('lists each category with its title, subtitle, and badge', () => {
    render(<CategoryManager categories={[jewellery, hairAccessories]} productsByCategory={{}} />);
    expect(screen.getByText(/Anti-Tarnish Jewellery/)).toBeInTheDocument();
    expect(screen.getByText('Rings · Bracelets')).toBeInTheDocument();
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.getByText(/Hair Accessories/)).toBeInTheDocument();
  });

  it('shows the product count for each category and 0 when unused', () => {
    render(
      <CategoryManager
        categories={[jewellery]}
        productsByCategory={{
          jewellery: [
            { id: 'p1', name: 'Ring' },
            { id: 'p2', name: 'Bracelet' },
          ],
        }}
      />
    );
    expect(screen.getByText('2 products')).toBeInTheDocument();
  });

  it('deletes an unused category after confirming', async () => {
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
    render(<CategoryManager categories={[jewellery]} productsByCategory={{}} />);

    act(() => {
      screen.getByRole('button', { name: /^Delete Anti-Tarnish Jewellery$/i }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'Confirm' }).click();
    });

    await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith('jewellery'));
    await waitFor(() =>
      expect(screen.queryByText(/Anti-Tarnish Jewellery/)).not.toBeInTheDocument()
    );
  });

  it('blocks deleting a category still assigned to products and lists them by name with edit links', () => {
    render(
      <CategoryManager
        categories={[jewellery]}
        productsByCategory={{
          jewellery: [
            { id: 'p1', name: 'Star Ring' },
            { id: 'p2', name: 'Tennis Bracelet' },
          ],
        }}
      />
    );

    expect(
      screen.queryByRole('button', { name: /^Delete Anti-Tarnish Jewellery$/i })
    ).not.toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: /can't delete anti-tarnish jewellery/i }).click();
    });

    expect(screen.getByText(/Can't delete/)).toBeInTheDocument();
    const ringLink = screen.getByRole('link', { name: 'Star Ring' });
    expect(ringLink).toHaveAttribute('href', '/admin/products/p1');
    expect(screen.getByRole('link', { name: 'Tennis Bracelet' })).toHaveAttribute(
      'href',
      '/admin/products/p2'
    );
  });

  it('opens the create modal from "Add Category" and appends the saved category, sorted by sort_order', async () => {
    render(<CategoryManager categories={[hairAccessories]} productsByCategory={{}} />);

    act(() => {
      screen.getByRole('button', { name: 'Add Category' }).click();
    });
    expect(lastModalProps?.open).toBe(true);
    expect(lastModalProps?.category).toBeUndefined();

    await act(async () => {
      screen.getByText('fake-save').click();
    });

    expect(screen.getByText(/✨ New Category/)).toBeInTheDocument();
    // NEW_CATEGORY has sort_order 0, hairAccessories has sort_order 2 — new one sorts first.
    const titles = screen.getAllByText(/^(✨|🎀) /).map((el) => el.textContent);
    expect(titles[0]).toContain('New Category');
  });

  it('opens the edit modal with the selected category when its edit button is clicked', () => {
    render(<CategoryManager categories={[jewellery]} productsByCategory={{}} />);

    act(() => {
      screen.getByRole('button', { name: /edit anti-tarnish jewellery/i }).click();
    });

    expect(lastModalProps?.open).toBe(true);
    expect(lastModalProps?.category).toEqual(jewellery);
  });
});
