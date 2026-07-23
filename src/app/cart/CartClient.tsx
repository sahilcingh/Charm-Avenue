'use client';
import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useWishlistToggle } from '@/lib/use-wishlist-toggle';
import { createClient } from '@/lib/supabase/client';
import { mapProductRow, type Product } from '@/lib/supabase/product-mapper';
import type { DbCategory, DbProduct, DbProductVariant } from '@/lib/supabase/types';
import { resolveVariantDisplay, formatVariantLabel } from '@/lib/supabase/product-variants';
import { resolveComboDiscounts, type ComboDefinition } from '@/lib/supabase/combo-discounts';
import { validateContactDetails, type ContactDetailsErrors } from '@/lib/checkout-validation';
import { createWhatsAppEnquiry, type CartLineItem } from './actions';

type ProductRowWithCategory = DbProduct & { category: Pick<DbCategory, 'title'> | null };
type ComboRow = {
  id: string;
  name: string;
  discount_percent: number;
  combo_products: { product_id: string }[];
};

const inputClass =
  'w-full rounded-2xl px-4 py-2.5 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] focus:ring-2 focus:ring-[var(--blush-rose)]/15 transition-all duration-200';
const labelClass = 'text-xs font-bold uppercase tracking-wide mb-1.5 block';

export default function CartClient() {
  const router = useRouter();
  const { lines, hydrated, adjustQuantity, removeFromCart, clearCart } = useCart();
  const { isInWishlist, toggleWithFeedback } = useWishlistToggle();
  const [productsById, setProductsById] = useState<Record<string, Product> | null>(null);
  const [variantsById, setVariantsById] = useState<Record<string, DbProductVariant>>({});
  const [combos, setCombos] = useState<ComboDefinition[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactErrors, setContactErrors] = useState<ContactDetailsErrors>({});
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derived keys, not the `lines` array itself — the fetch effect below should
  // only re-run when the SET of product/variant ids actually changes, not on
  // every quantity tick.
  const productIdsKey = lines
    .map((l) => l.productId)
    .sort()
    .join(',');
  const variantIdsKey = lines
    .map((l) => l.variantId ?? '')
    .sort()
    .join(',');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('combos')
      .select('id, name, discount_percent, combo_products(product_id)')
      .eq('is_active', true)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as ComboRow[];
        setCombos(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            discountPercent: row.discount_percent,
            productIds: row.combo_products.map((cp) => cp.product_id),
          }))
        );
      });
  }, []);

  useEffect(() => {
    // Wait for the cart to finish reading localStorage before deciding anything —
    // otherwise a non-empty cart briefly reads as `lines.length === 0` on the very
    // first pass and flashes an incorrect "your bag is empty" state.
    if (!hydrated) return;

    if (lines.length === 0) {
      setProductsById({});
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('products')
      .select('*, category:categories!products_category_slug_fkey(title)')
      .in(
        'id',
        lines.map((l) => l.productId)
      )
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, Product> = {};
        ((data ?? []) as unknown as ProductRowWithCategory[]).forEach((row) => {
          map[row.id] = mapProductRow(row, row.category?.title);
        });
        setProductsById(map);
      });

    const variantIds = lines.map((l) => l.variantId).filter((id): id is string => Boolean(id));
    if (variantIds.length > 0) {
      supabase
        .from('product_variants')
        .select('*')
        .in('id', variantIds)
        .then(({ data }) => {
          if (cancelled) return;
          const map: Record<string, DbProductVariant> = {};
          ((data ?? []) as DbProductVariant[]).forEach((row) => {
            map[row.id] = row;
          });
          setVariantsById(map);
        });
    } else {
      setVariantsById({});
    }

    return () => {
      cancelled = true;
    };
    // Re-fetch only when the set of product/variant ids in the cart actually changes, not on every quantity tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, productIdsKey, variantIdsKey]);

  if (productsById === null) {
    return (
      <section className="w-full px-4 md:px-10 py-20">
        <div
          className="max-w-screen-md mx-auto text-center"
          style={{ color: 'var(--blush-muted)' }}
        >
          Loading your bag…
        </div>
      </section>
    );
  }

  const items = lines
    .map((line) => {
      const product = productsById[line.productId];
      if (!product) return null;
      const variant = line.variantId ? (variantsById[line.variantId] ?? null) : null;
      const resolved = resolveVariantDisplay(
        {
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          image: product.image,
        },
        variant
      );
      return {
        line,
        product,
        variant,
        effectivePrice: resolved.price,
        effectiveImage: resolved.image,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const subtotal = items.reduce(
    (sum, { line, effectivePrice }) => sum + effectivePrice * line.quantity,
    0
  );

  const priceByProduct = new Map<string, number>();
  items.forEach(({ product, effectivePrice }) => {
    if (!priceByProduct.has(product.id)) priceByProduct.set(product.id, effectivePrice);
  });
  const comboMatches = resolveComboDiscounts(
    Array.from(priceByProduct, ([productId, unitPrice]) => ({ productId, unitPrice })),
    combos
  );
  const discountTotal = comboMatches.reduce((sum, m) => sum + m.amount, 0);
  const total = subtotal - discountTotal;

  const lineItems: CartLineItem[] = items.map(
    ({ line, product, variant, effectivePrice, effectiveImage }) => ({
      productId: product.id,
      productName: product.name,
      unitPrice: effectivePrice,
      quantity: line.quantity,
      variantId: variant?.id,
      variantLabel: variant ? (formatVariantLabel(variant) ?? undefined) : undefined,
      variantImage: variant ? effectiveImage : undefined,
      personalizationText: line.personalizationText,
    })
  );

  function handleEnquiry() {
    setEnquiryError(null);
    const contact = { name, phone, address };
    const fieldErrors = validateContactDetails(contact);
    setContactErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    startTransition(async () => {
      const result = await createWhatsAppEnquiry(lineItems, contact, discountTotal);
      if (result.error || !result.orderId || !result.whatsappUrl) {
        setEnquiryError(result.error ?? 'Something went wrong. Please try again.');
        return;
      }
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
      clearCart();
      router.push(`/order/${result.orderId}`);
    });
  }

  if (items.length === 0) {
    return (
      <section className="w-full px-4 md:px-10 py-20">
        <div className="max-w-screen-md mx-auto text-center">
          <span className="text-5xl block mb-4">🛍️</span>
          <h2 className="font-elegant-serif text-2xl mb-2" style={{ color: 'var(--blush-text)' }}>
            Your bag is empty
          </h2>
          <p className="mb-8" style={{ color: 'var(--blush-muted)' }}>
            Looks like you haven&apos;t added anything cute yet.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'var(--blush-rose)',
              boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
            }}
          >
            <Icon name="ShoppingBagIcon" size={16} />
            Start Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 md:px-10 py-14">
      <div className="max-w-screen-2xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Line items */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {items.map(({ line, product, variant, effectivePrice, effectiveImage }) => {
            const lineOptions = {
              variantId: line.variantId,
              personalizationText: line.personalizationText,
            };
            const variantLabel = variant ? formatVariantLabel(variant) : null;
            return (
              <div
                key={`${product.id}:${line.variantId ?? ''}:${line.personalizationText ?? ''}`}
                className="flex gap-4 bg-white rounded-3xl p-4 card-bubble"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0"
                >
                  <AppImage
                    src={effectiveImage}
                    alt={product.imageAlt}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </Link>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <p
                      className="text-xs font-medium mb-0.5"
                      style={{ color: 'var(--blush-muted)' }}
                    >
                      {product.category}
                    </p>
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-bold text-sm sm:text-base hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--blush-text)' }}
                    >
                      {product.name}
                    </Link>
                    {variantLabel && (
                      <p
                        className="text-xs font-medium mt-0.5"
                        style={{ color: 'var(--blush-muted)' }}
                      >
                        {variantLabel}
                      </p>
                    )}
                    {line.personalizationText && (
                      <p
                        className="text-xs font-medium mt-0.5 italic"
                        style={{ color: 'var(--blush-muted)' }}
                      >
                        &ldquo;{line.personalizationText}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div
                      className="flex items-center gap-1 rounded-full p-1"
                      style={{ background: 'var(--blush-bg)' }}
                    >
                      <button
                        onClick={() => adjustQuantity(product.id, -1, lineOptions)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-bold hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--blush-rose)' }}
                      >
                        −
                      </button>
                      <span
                        className="w-6 text-center text-sm font-bold"
                        style={{ color: 'var(--blush-text)' }}
                      >
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => adjustQuantity(product.id, 1, lineOptions)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-bold hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--blush-rose)' }}
                      >
                        +
                      </button>
                    </div>
                    <span
                      className="font-elegant-serif font-bold text-base sm:text-lg"
                      style={{ color: 'var(--blush-rose)' }}
                    >
                      ₹{effectivePrice * line.quantity}
                    </span>
                  </div>
                </div>
                <div className="self-start flex flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleWithFeedback(product.id, product.name)}
                    aria-label={
                      isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                  >
                    <Icon
                      name="HeartIcon"
                      variant={isInWishlist(product.id) ? 'solid' : 'outline'}
                      size={16}
                      style={{
                        color: isInWishlist(product.id)
                          ? 'var(--blush-rose)'
                          : 'var(--blush-muted)',
                      }}
                    />
                  </button>
                  <button
                    onClick={() => removeFromCart(product.id, lineOptions)}
                    aria-label="Remove item"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--blush-muted)' }}
                  >
                    <Icon name="XMarkIcon" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-6 card-bubble md:sticky md:top-24">
            <h2 className="font-elegant-serif text-lg mb-4" style={{ color: 'var(--blush-text)' }}>
              Order Summary
            </h2>
            <div
              className="flex items-center justify-between text-sm mb-2"
              style={{ color: 'var(--blush-text)', opacity: 0.8 }}
            >
              <span>Subtotal ({items.reduce((n, i) => n + i.line.quantity, 0)} items)</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
            {comboMatches.map(({ combo, amount }) => (
              <div
                key={combo.id}
                className="flex items-center justify-between text-sm mb-2"
                style={{ color: 'var(--blush-rose)' }}
              >
                <span>
                  🎁 {combo.name} — {combo.discountPercent}% off
                </span>
                <span className="font-bold">−₹{amount}</span>
              </div>
            ))}
            <p className="text-xs mb-4" style={{ color: 'var(--blush-muted)' }}>
              Final pricing & delivery confirmed over WhatsApp.
            </p>
            <div
              className="flex items-center justify-between pt-4 pb-4 border-t"
              style={{ borderColor: 'var(--blush-border)' }}
            >
              <span className="font-bold" style={{ color: 'var(--blush-text)' }}>
                Total
              </span>
              <span
                className="font-elegant-serif font-bold text-xl"
                style={{ color: 'var(--blush-rose)' }}
              >
                ₹{total}
              </span>
            </div>

            <div
              className="flex flex-col gap-3 pt-4 border-t"
              style={{ borderColor: 'var(--blush-border)' }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: 'var(--blush-muted)' }}
              >
                Your Details
              </p>
              <div>
                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  style={{ color: 'var(--blush-text)' }}
                  placeholder="Your name"
                />
                {contactErrors.name && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>
                    {contactErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  style={{ color: 'var(--blush-text)' }}
                  placeholder="98765 43210"
                />
                {contactErrors.phone && (
                  <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>
                    {contactErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--blush-text)' }}>
                  Delivery Address (optional)
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  style={{ color: 'var(--blush-text)' }}
                  placeholder="We can also get this over WhatsApp"
                />
              </div>
            </div>

            {enquiryError && (
              <p className="text-sm font-medium mt-4" style={{ color: 'var(--blush-rose-dark)' }}>
                {enquiryError}
              </p>
            )}
            <button
              type="button"
              onClick={handleEnquiry}
              disabled={isPending}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
            >
              <Icon name="ChatBubbleLeftRightIcon" size={18} />
              {isPending ? 'Sending your enquiry…' : 'Enquire on WhatsApp'}
            </button>
            <Link
              href="/shop"
              className="mt-3 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
