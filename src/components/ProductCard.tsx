'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';
import { useAdminMode } from '@/lib/admin-mode-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Product, ProductColorVariant } from '@/lib/supabase/product-mapper';
import { isSaleWindowActive } from '@/lib/supabase/sale-window';
import { resolveCssColor } from '@/lib/css-color';

const MAX_VISIBLE_SWATCHES = 5;
const CARD_IMAGE_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw';

interface ProductCardProps {
  product: Product;
  transitionDelay?: number;
  className?: string;
}

export default function ProductCard(props: ProductCardProps) {
  return (
    <ErrorBoundary fallback={<ProductCardFallback className={props.className} />}>
      <ProductCardContent {...props} />
    </ErrorBoundary>
  );
}

/** Keeps the grid from visually collapsing around a single failed card. */
function ProductCardFallback({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden card-bubble aspect-square ${className}`}
      style={{ background: 'var(--blush-bg)' }}
    />
  );
}

function ProductCardContent({ product, transitionDelay = 0, className = '' }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant | null>(null);
  const [preloadedVariantIds, setPreloadedVariantIds] = useState<Set<string>>(new Set());
  // resolveCssColor needs a real DOM to validate a color name, which doesn't exist during
  // server rendering — resolving it immediately would render a different border server-side
  // vs. client-side and trigger a hydration mismatch. Stay on the neutral fallback for the
  // very first client render (identical to the server's output), then resolve real colors
  // right after mount, once client and server are already in agreement.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isAdmin } = useAdminMode();
  const router = useRouter();

  const displayImage = selectedVariant?.image ?? product.image;
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const showDiscount =
    Boolean(displayOriginalPrice) &&
    isSaleWindowActive(product.saleStartsAt, product.saleEndsAt, new Date());
  const href = selectedVariant
    ? `/product/${product.slug}?color=${encodeURIComponent(selectedVariant.color)}`
    : `/product/${product.slug}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product.id, 1, selectedVariant ? { variantId: selectedVariant.id } : undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
    showToast(`${product.name} added to your bag`, { href: '/cart', actionLabel: 'View Bag' });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/admin/products/${product.id}`);
  };

  const handleSelectVariant = (e: React.MouseEvent, variant: ProductColorVariant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  /** Warms the browser's (and Next's image-optimizer) cache for a variant's photo before it's
   * actually selected, so the swap on click is instant instead of a visible pop-in. */
  const handlePreloadVariant = (variantId: string) => {
    setPreloadedVariantIds((prev) => (prev.has(variantId) ? prev : new Set(prev).add(variantId)));
  };

  // Switching to a color variant needs a way back — a swatch for the product's own,
  // original photo (how it looked before any variants existed) sits alongside the
  // real variants, selecting it just clears selectedVariant back to the base display.
  const handleSelectBase = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(null);
  };

  const hasColorVariants = product.colorVariants.length > 0;
  const visibleColorVariants = product.colorVariants.slice(0, MAX_VISIBLE_SWATCHES - 1);
  const hiddenSwatchCount = product.colorVariants.length - visibleColorVariants.length;

  return (
    <Link
      href={href}
      className={`block relative bg-white rounded-3xl overflow-hidden card-bubble transition-all duration-300 hover:-translate-y-1 cursor-pointer ${className}`}
      style={{ transitionDelay: `${transitionDelay}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-3xl">
        <AppImage
          src={displayImage}
          alt={
            selectedVariant ? `${product.imageAlt} — ${selectedVariant.color}` : product.imageAlt
          }
          fill
          className={`object-cover transition-transform duration-500 ${hovered ? 'scale-110' : 'scale-100'}`}
          sizes={CARD_IMAGE_SIZES}
        />
        {/* Hover-preloaded variant photos — invisible but real <Image>s so the browser (and
            Next's image optimizer) already have the swap target cached by the time it's clicked. */}
        {product.colorVariants
          .filter((v) => preloadedVariantIds.has(v.id) && v.id !== selectedVariant?.id && v.image)
          .map((v) => (
            <div
              key={v.id}
              aria-hidden
              className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
            >
              <AppImage src={v.image as string} alt="" fill sizes={CARD_IMAGE_SIZES} />
            </div>
          ))}
        {product.tag && (
          <span
            className="absolute top-2 left-2 badge-pill text-xs shadow-sm"
            style={{ background: product.tagBg, color: product.tagText }}
          >
            {product.tag}
          </span>
        )}
        {isAdmin && (
          <button
            onClick={handleEdit}
            aria-label={`Edit ${product.name}`}
            className="absolute top-2 right-2 w-8 h-8 rounded-full glass-white flex items-center justify-center z-10 transition-transform hover:scale-110"
          >
            <Icon name="PencilSquareIcon" size={15} style={{ color: '#FFFFFF' }} />
          </button>
        )}
        {hasColorVariants && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
            <button
              onClick={handleSelectBase}
              aria-label={`View ${product.name} (default)`}
              aria-pressed={selectedVariant === null}
              className={`w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm transition-transform duration-200 ${
                selectedVariant === null ? 'scale-125' : 'scale-100 hover:scale-110'
              }`}
              style={{
                border: `2px solid ${selectedVariant === null ? 'var(--blush-rose)' : '#FFFFFF'}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt="" className="w-full h-full object-cover" />
            </button>
            {visibleColorVariants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={(e) => handleSelectVariant(e, variant)}
                  onMouseEnter={() => handlePreloadVariant(variant.id)}
                  aria-label={`View ${product.name} in ${variant.color}`}
                  aria-pressed={isSelected}
                  className={`w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm transition-transform duration-200 ${
                    isSelected ? 'scale-125' : 'scale-100 hover:scale-110'
                  }`}
                  style={{
                    border: `2px solid ${
                      isSelected
                        ? 'var(--blush-rose)'
                        : mounted
                          ? resolveCssColor(variant.color, '#FFFFFF')
                          : '#FFFFFF'
                    }`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={variant.image ?? product.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
            {hiddenSwatchCount > 0 && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.5625rem] font-bold shadow-sm"
                style={{ background: '#FFFFFF', color: 'var(--blush-text)' }}
              >
                +{hiddenSwatchCount}
              </span>
            )}
          </div>
        )}
        {/* Quick add overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(30,23,18,0.45)' }}
        >
          <button
            onClick={handleQuickAdd}
            className="px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
            style={{ background: '#FFFFFF', color: 'var(--blush-rose)' }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = 'var(--blush-rose)';
              btn.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = '#FFFFFF';
              btn.style.color = 'var(--blush-rose)';
            }}
          >
            <Icon name={added ? 'CheckIcon' : 'ShoppingBagIcon'} size={14} />
            {added ? 'Added!' : 'Quick Add'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium mb-0.5 truncate" style={{ color: 'var(--blush-muted)' }}>
          {product.category}
        </p>
        <p
          className="font-bold text-sm leading-tight mb-1.5 truncate"
          style={{ color: 'var(--blush-text)' }}
        >
          {product.name}
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="font-elegant-serif font-bold text-base"
            style={{ color: 'var(--blush-rose)' }}
          >
            ₹{displayPrice}
          </span>
          {showDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--blush-muted)' }}>
              ₹{displayOriginalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
