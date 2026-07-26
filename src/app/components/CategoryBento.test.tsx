import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CategoryBento from './CategoryBento';
import type { Category } from '@/lib/supabase/product-mapper';

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

function makeCategory(overrides: Partial<Category>): Category {
  return {
    slug: 'default-slug',
    title: 'Title',
    subtitle: 'Subtitle',
    emoji: '✨',
    tag: 'Tag',
    image: '/img.jpg',
    imageAlt: 'alt',
    tagBg: '#fff',
    tagText: '#000',
    description: 'desc',
    ...overrides,
  };
}

describe('CategoryBento — auto-adjusting grid (no reserved empty space when the last tile is alone in its row)', () => {
  it('stretches the last tile across the full row instead of leaving empty space beside it (reproduces the reported gap next to "Keycuties")', () => {
    // Same shape as the live site: 4 default tiles + hair(hero) + gifts-novelty(wide), last one an unmapped default slug
    const categories = [
      makeCategory({ slug: 'makeup-magic', title: 'Makeup Magic' }),
      makeCategory({ slug: 'hair', title: 'Hair Essentials' }),
      makeCategory({ slug: 'trendy-picks', title: 'Trendy Picks' }),
      makeCategory({ slug: 'bags-organisers', title: 'Bags and Organisers' }),
      makeCategory({ slug: 'gifts-novelty', title: 'Gifts & Novelty' }),
      makeCategory({ slug: 'keycuties', title: 'Keycuties' }),
    ];
    render(<CategoryBento categories={categories} />);

    const lastLink = screen.getByRole('link', { name: /Keycuties/ });
    expect(lastLink.className).toContain('md:col-span-3');
  });

  it('adding one more category after that only needs to close the remaining gap, not stretch full-width', () => {
    const categories = [
      makeCategory({ slug: 'makeup-magic', title: 'Makeup Magic' }),
      makeCategory({ slug: 'hair', title: 'Hair Essentials' }),
      makeCategory({ slug: 'trendy-picks', title: 'Trendy Picks' }),
      makeCategory({ slug: 'bags-organisers', title: 'Bags and Organisers' }),
      makeCategory({ slug: 'gifts-novelty', title: 'Gifts & Novelty' }),
      makeCategory({ slug: 'keycuties', title: 'Keycuties' }),
      makeCategory({ slug: 'new-finds', title: 'New Finds' }),
    ];
    render(<CategoryBento categories={categories} />);

    const keycuties = screen.getByRole('link', { name: /Keycuties/ });
    const newFinds = screen.getByRole('link', { name: /New Finds/ });
    expect(keycuties.className).toContain('md:col-span-1');
    expect(newFinds.className).toContain('md:col-span-2');
  });

  it('leaves every tile at its normal size once a full row of categories exists (no unnecessary stretching)', () => {
    const categories = [
      makeCategory({ slug: 'alpha', title: 'Alpha Cove' }),
      makeCategory({ slug: 'bravo', title: 'Bravo Nook' }),
      makeCategory({ slug: 'charlie', title: 'Charlie Nest' }),
    ];
    render(<CategoryBento categories={categories} />);

    for (const title of ['Alpha Cove', 'Bravo Nook', 'Charlie Nest']) {
      expect(screen.getByRole('link', { name: new RegExp(title) }).className).toContain(
        'md:col-span-1'
      );
    }
  });
});
