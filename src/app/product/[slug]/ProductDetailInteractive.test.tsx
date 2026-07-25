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

function getSizeLabel() {
  return screen.getByText(
    (_, element) =>
      element?.tagName.toLowerCase() === 'p' && (element.textContent?.startsWith('Size:') ?? false)
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
    const heroImage = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
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
      const heroImage = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
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
    const heroImage = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
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

describe('ProductDetailInteractive — placeholder description text', () => {
  it(
    'hides the description entirely when it is a literal placeholder like "N/A" instead of ' +
      'rendering it verbatim (failure case: catalog rows with no real copy yet stored the ' +
      'string "N/A", which rendered as unlabeled placeholder text right on the product page)',
    () => {
      searchParamsValue = new URLSearchParams();
      renderDetail([], { description: 'N/A' });
      expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    }
  );

  it('still shows a real description as normal', () => {
    searchParamsValue = new URLSearchParams();
    renderDetail([], { description: 'Soft and good for hairs.' });
    expect(screen.getByText('Soft and good for hairs.')).toBeInTheDocument();
  });
});

describe('ProductDetailInteractive — gallery reset on variant switch', () => {
  it(
    "resets the gallery back to the new variant's own photo when switching color, instead of " +
      "leaving a stale thumbnail highlighted from the previous variant's photo array (failure " +
      'case: the gallery kept its own internal "active thumbnail" state across a color switch, ' +
      'so the ring could end up marking a position that no longer matched what was on screen)',
    () => {
      searchParamsValue = new URLSearchParams('color=Pink');
      renderDetail(
        [
          makeVariant({ id: 'v1', color: 'Pink', image: '/pink.jpg' }),
          makeVariant({ id: 'v2', color: 'Blue', image: '/blue.jpg' }),
        ],
        {
          galleryImages: [
            { url: '/base.jpg', alt: 'Panda Lamp' },
            { url: '/base-2.jpg', alt: 'Panda Lamp' },
          ],
        }
      );

      // Stable gallery order: [base.jpg, pink.jpg (Pink), blue.jpg (Blue), base-2.jpg].
      act(() => screen.getByRole('button', { name: 'Show photo 4' }).click());
      expect(screen.getByTestId('gallery-hero-image')).toHaveAttribute(
        'src',
        expect.stringContaining('base-2.jpg')
      );

      // Switch to Blue via the color pill — the highlight/hero must follow Blue's own thumbnail
      // wherever it sits in the (unchanged) order, not reset to index 0.
      act(() => screen.getByRole('button', { name: 'Blue' }).click());
      const hero = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
      expect(hero.src).toContain('blue.jpg');
    }
  );

  it(
    "includes every color variant's own photo as a gallery thumbnail, not just the currently " +
      'selected one plus a single generic group shot (failure case reported live: a product with ' +
      "6 real colors only ever showed 2 gallery thumbnails — the selected color's photo and the " +
      "base product's one shared photo — so there was no way to preview any other color's photo " +
      'without using the color pills)',
    () => {
      searchParamsValue = new URLSearchParams('color=Black');
      renderDetail(
        [
          makeVariant({ id: 'v1', color: 'Black', image: '/black.jpg' }),
          makeVariant({ id: 'v2', color: 'White', image: '/white.jpg' }),
          makeVariant({ id: 'v3', color: 'Brown', image: '/brown.jpg' }),
        ],
        { galleryImages: [{ url: '/group-shot.jpg', alt: 'Panda Lamp' }] }
      );

      expect(screen.getByRole('button', { name: 'Show Black' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show White' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show Brown' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show photo 1' })).toBeInTheDocument();
    }
  );

  it(
    'keeps every gallery thumbnail in the same fixed position (base photo, then each color in ' +
      'the same order as the color pills) no matter which color is selected — only the ' +
      'highlight/hero moves, the thumbnails themselves never jump to the front (failure case ' +
      'reported live: selecting the 2nd or 3rd color thumbnail made that photo jump to the ' +
      'first position instead of staying where it was and just gaining the highlight ring)',
    () => {
      searchParamsValue = new URLSearchParams('color=Black bow');
      renderDetail([
        makeVariant({ id: 'v1', color: 'Red bow', image: '/red-bow.jpg' }),
        makeVariant({ id: 'v2', color: 'Black bow', image: '/black-bow.jpg' }),
      ]);

      const orderBefore = screen
        .getAllByRole('button')
        .filter((b) => /^Show /.test(b.getAttribute('aria-label') ?? ''))
        .map((b) => b.getAttribute('aria-label'));
      expect(orderBefore).toEqual(['Show photo 1', 'Show Red bow', 'Show Black bow']);

      act(() => screen.getByRole('button', { name: 'Show Red bow' }).click());

      const orderAfter = screen
        .getAllByRole('button')
        .filter((b) => /^Show /.test(b.getAttribute('aria-label') ?? ''))
        .map((b) => b.getAttribute('aria-label'));
      expect(orderAfter).toEqual(orderBefore);
      expect(getColorLabel().textContent).toBe('Color: Red bow');
    }
  );

  it(
    "clicking another color's gallery thumbnail switches the active color (and its price), " +
      'keeping the gallery, the color pill, and the price/stock in agreement — rather than only ' +
      'changing which thumbnail is highlighted while the rest of the page still shows the ' +
      'previously selected color',
    () => {
      searchParamsValue = new URLSearchParams('color=Black');
      renderDetail([
        makeVariant({ id: 'v1', color: 'Black', image: '/black.jpg', price_override: 100 }),
        makeVariant({ id: 'v2', color: 'White', image: '/white.jpg', price_override: 150 }),
      ]);

      act(() => screen.getByRole('button', { name: 'Show White' }).click());

      expect(getColorLabel().textContent).toBe('Color: White');
      expect(screen.getByText('₹150')).toBeInTheDocument();
      const hero = screen.getByTestId('gallery-hero-image') as HTMLImageElement;
      expect(hero.src).toContain('white.jpg');
    }
  );
});

describe('ProductDetailInteractive — color+size cross-filtering (no invalid combos)', () => {
  // Red/S, Red/M, Blue/S exist — Blue/M does not.
  const crossAxisVariants = [
    makeVariant({ id: 'v1', color: 'Red', size: 'S', price_override: 100 }),
    makeVariant({ id: 'v2', color: 'Red', size: 'M', price_override: 100 }),
    makeVariant({ id: 'v3', color: 'Blue', size: 'S', price_override: 100 }),
  ];

  it("only offers sizes that actually exist for the selected color, so a shopper can't pick a combination with no matching variant", () => {
    searchParamsValue = new URLSearchParams('color=Red');
    renderDetail(crossAxisVariants);

    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Blue' }).click());

    expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'M' })).not.toBeInTheDocument();
  });

  it('auto-corrects the selected size to one that actually exists when switching to a color that lacks the current size, instead of silently falling back to the base product with no warning', () => {
    searchParamsValue = new URLSearchParams('color=Red');
    renderDetail(crossAxisVariants);

    act(() => screen.getByRole('button', { name: 'M' }).click());
    expect(getSizeLabel().textContent).toBe('Size: M');

    act(() => screen.getByRole('button', { name: 'Blue' }).click());

    // Blue/M doesn't exist — the size selection must move to Blue's real size (S),
    // not stay on the now-invalid "M" and silently resolve to the base product.
    expect(getSizeLabel().textContent).toBe('Size: S');
    expect(screen.getByText('₹100')).toBeInTheDocument();
  });
});
