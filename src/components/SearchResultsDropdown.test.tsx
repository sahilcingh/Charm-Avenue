import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchResultsDropdown from './SearchResultsDropdown';

describe('SearchResultsDropdown', () => {
  it('shows a searching state while loading with no results yet', () => {
    render(<SearchResultsDropdown query="panda" results={[]} loading onNavigate={vi.fn()} />);
    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('shows a no-results message for an empty, settled result set', () => {
    render(
      <SearchResultsDropdown query="keychain" results={[]} loading={false} onNavigate={vi.fn()} />
    );
    expect(screen.getByText(/No products match "keychain"/)).toBeInTheDocument();
  });

  it('lists each matching product with its name and price, linking to its product page', () => {
    render(
      <SearchResultsDropdown
        query="panda"
        results={[
          {
            id: 'p1',
            slug: 'panda-lamp',
            name: 'Panda Lamp',
            image: '/img.jpg',
            imageAlt: 'alt',
            price: 130,
          },
        ]}
        loading={false}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Panda Lamp')).toBeInTheDocument();
    expect(screen.getByText('₹130')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Panda Lamp/ })).toHaveAttribute(
      'href',
      '/product/panda-lamp'
    );
  });

  it('always renders a "view all results" link to the dedicated search page', () => {
    render(
      <SearchResultsDropdown query="panda" results={[]} loading={false} onNavigate={vi.fn()} />
    );
    expect(screen.getByRole('link', { name: /view all results/i })).toHaveAttribute(
      'href',
      '/search?q=panda'
    );
  });

  it('calls onNavigate when a result link is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <SearchResultsDropdown
        query="panda"
        results={[
          {
            id: 'p1',
            slug: 'panda-lamp',
            name: 'Panda Lamp',
            image: '/img.jpg',
            imageAlt: 'alt',
            price: 130,
          },
        ]}
        loading={false}
        onNavigate={onNavigate}
      />
    );
    screen.getByRole('link', { name: /Panda Lamp/ }).click();
    expect(onNavigate).toHaveBeenCalled();
  });
});
