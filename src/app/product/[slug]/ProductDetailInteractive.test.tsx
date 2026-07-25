import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import ProductDetailInteractive from './ProductDetailInteractive';
import { CartProvider } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { AdminModeProvider } from '@/lib/admin-mode-context';
import type { DbProductVariant } from '@/lib/supabase/types';

// CartProvider's self-pruning validity check + AdminModeProvider's admin lookup both hit this —
// treat every queried id as valid/active and every user as signed-out/non-admin by default.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          in: (_col: string, ids: string[]) => Promise.resolve({ data: ids.map((id) => ({ id })) }),
          single: () => Promise.resolve({ data: { is_admin: false } }),
        }),
      }),
    }),
  }),
}));

let searchParamsValue = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsValue,
}));

function makeVariant(overrides: Partial<DbProductVariant> = {}): DbProductVariant {
  return {
    id: 'v1',
    product_id: 'p1',
    color: 'Pink',
    size: null,
    sku: null,
    price_override: null,
    original_price_override: null,
    image: null,
    stock_status: null,
    stock_count: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderDetail(
  variants: DbProductVariant[],
  props: Partial<React.ComponentProps<typeof ProductDetailInteractive>> = {}
) {
  return render(
    <ToastProvider>
      <CartProvider>
        <AdminModeProvider>
          <ProductDetailInteractive
            productId="p1"
            productName="Panda Lamp"
            categorySlug="gifts"
            categoryTitle="Gifts & Novelty"
            emoji="🐼"
            rating={4.5}
            reviewCount={10}
            description="A cute lamp."
            price={130}
            originalPrice={null}
            galleryImages={[{ url: '/base.jpg', alt: 'Panda Lamp' }]}
            variants={variants}
            personalizationEnabled={false}
            personalizationLabel={null}
            personalizationRequired={false}
            personalizationMaxLength={null}
            saleStartsAt={null}
            saleEndsAt={null}
            stockStatus={null}
            madeToOrderLeadTime={null}
            lowStockThreshold={null}
            stockCount={null}
            dimensions={null}
            material={null}
            careInstructions={null}
            {...props}
          />
        </AdminModeProvider>
      </CartProvider>
    </ToastProvider>
  );
}

function getColorLabel() {
  return screen.getByText(
    (_, element) =>
      element?.tagName.toLowerCase() === 'p' && (element.textContent?.startsWith('Color:') ?? false)
  );
}

describe('ProductDetailInteractive — initial color from ?color=', () => {
  it('defaults to the first color when there is no ?color= param', () => {
    searchParamsValue = new URLSearchParams();
    renderDetail([
      makeVariant({ id: 'v1', color: 'Pink' }),
      makeVariant({ id: 'v2', color: 'Blue' }),
    ]);
    expect(getColorLabel().textContent).toBe('Color: Pink');
  });

  it('preselects the color named in ?color= when it matches an existing variant', () => {
    searchParamsValue = new URLSearchParams('color=Blue');
    renderDetail([
      makeVariant({ id: 'v1', color: 'Pink', image: '/pink.jpg' }),
      makeVariant({ id: 'v2', color: 'Blue', image: '/blue.jpg' }),
    ]);
    expect(getColorLabel().textContent).toBe('Color: Blue');
    const heroImage = screen.getAllByAltText('Panda Lamp')[0] as HTMLImageElement;
    expect(heroImage.src).toContain('blue.jpg');
  });

  it('falls back to the first color when ?color= does not match any variant', () => {
    searchParamsValue = new URLSearchParams('color=Green');
    renderDetail([
      makeVariant({ id: 'v1', color: 'Pink' }),
      makeVariant({ id: 'v2', color: 'Blue' }),
    ]);
    expect(getColorLabel().textContent).toBe('Color: Pink');
  });

  it('shows the base image and no color selector when the product has no variants', () => {
    searchParamsValue = new URLSearchParams('color=Blue');
    renderDetail([]);
    expect(screen.queryByText(/^Color:/)).not.toBeInTheDocument();
  });

  it(
    'honors an explicit ?color=default from a ProductCard link over auto-selecting the first ' +
      'variant (the bug: a card showing Default linked here with no ?color= at all, which this ' +
      'page read as "no preference" and silently picked the first variant instead)',
    () => {
      searchParamsValue = new URLSearchParams('color=default');
      renderDetail([
        makeVariant({ id: 'v1', color: 'Pink', image: '/pink.jpg' }),
        makeVariant({ id: 'v2', color: 'Blue', image: '/blue.jpg' }),
      ]);
      expect(getColorLabel().textContent).toBe('Color: Default');
      const heroImage = screen.getAllByAltText('Panda Lamp')[0] as HTMLImageElement;
      expect(heroImage.src).toContain('base.jpg');
    }
  );
});

describe('ProductDetailInteractive — switching back to the Default (pre-variant) option', () => {
  it('offers a Default option alongside the real colors', () => {
    searchParamsValue = new URLSearchParams();
    renderDetail([
      makeVariant({ id: 'v1', color: 'Pink' }),
      makeVariant({ id: 'v2', color: 'Blue' }),
    ]);
    expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument();
  });

  it("landing via a color-specific link (e.g. a ProductCard swatch) still lets the shopper switch to Default afterwards — this is the bug that was reported: arriving on a variant's page left no way back to the base product's own details", () => {
    searchParamsValue = new URLSearchParams('color=Blue');
    renderDetail([
      makeVariant({ id: 'v1', color: 'Pink', image: '/pink.jpg' }),
      makeVariant({ id: 'v2', color: 'Blue', image: '/blue.jpg', price_override: 150 }),
    ]);
    expect(getColorLabel().textContent).toBe('Color: Blue');

    act(() => screen.getByRole('button', { name: 'Default' }).click());

    expect(getColorLabel().textContent).toBe('Color: Default');
    expect(screen.getByText('₹130')).toBeInTheDocument();
    const heroImage = screen.getAllByAltText('Panda Lamp')[0] as HTMLImageElement;
    expect(heroImage.src).toContain('base.jpg');
  });

  it("falls back to the base product's own stock status when Default is selected on a product that has variants", () => {
    searchParamsValue = new URLSearchParams('color=Blue');
    renderDetail(
      [
        makeVariant({ id: 'v1', color: 'Pink' }),
        makeVariant({ id: 'v2', color: 'Blue', stock_status: 'out_of_stock' }),
      ],
      { stockStatus: 'in_stock', stockCount: 12 }
    );
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Default' }).click());

    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });
});
