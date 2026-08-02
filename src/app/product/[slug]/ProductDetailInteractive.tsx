'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ProductGallery from './ProductGallery';
import GalleryThumbnails from './GalleryThumbnails';
import AddToCartButton from './AddToCartButton';
import AdminEditLink from './AdminEditLink';
import type { DbProductVariant, ProductStockStatus } from '@/lib/supabase/types';
import type { GalleryImage } from '@/lib/supabase/product-gallery';
import { resolveVariantDisplay, STOCK_STATUS_LABELS } from '@/lib/supabase/product-variants';
import { isSaleWindowActive } from '@/lib/supabase/sale-window';
import { isPlaceholderText } from '@/lib/placeholder-text';

interface ProductDetailInteractiveProps {
  productId: string;
  productName: string;
  categorySlug: string;
  categoryTitle: string;
  emoji: string;
  rating: number;
  reviewCount: number;
  description: string;
  price: number;
  originalPrice: number | null;
  tag?: string;
  tagBg?: string;
  tagText?: string;
  galleryImages: GalleryImage[];
  variants: DbProductVariant[];
  personalizationEnabled: boolean;
  personalizationLabel: string | null;
  personalizationRequired: boolean;
  personalizationMaxLength: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  stockStatus: ProductStockStatus | null;
  madeToOrderLeadTime: string | null;
  lowStockThreshold: number | null;
  stockCount: number | null;
  dimensions: string | null;
  material: string | null;
  careInstructions: string | null;
}

export default function ProductDetailInteractive({
  productId,
  productName,
  categorySlug,
  categoryTitle,
  emoji,
  rating,
  reviewCount,
  description,
  price,
  originalPrice,
  tag,
  tagBg,
  tagText,
  galleryImages,
  variants,
  personalizationEnabled,
  personalizationLabel,
  personalizationRequired,
  personalizationMaxLength,
  saleStartsAt,
  saleEndsAt,
  stockStatus,
  madeToOrderLeadTime,
  lowStockThreshold,
  stockCount,
  dimensions,
  material,
  careInstructions,
}: ProductDetailInteractiveProps) {
  const [personalizationText, setPersonalizationText] = useState('');
  const searchParams = useSearchParams();
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))),
    [variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))),
    [variants]
  );

  // A ProductCard swatch links here with ?color=<name> (a specific variant) or
  // ?color=default (the card's own "default photo" option, explicitly) — the two must never
  // disagree about what's currently shown, which is why "default" is a real, explicit value
  // here rather than just the absence of a ?color= param. A bare link with no ?color= at all
  // (an organic/search link that predates variants, or one that just doesn't care) still
  // falls back to the first color, same as before this option existed.
  const requestedColor = searchParams.get('color');
  const [selectedColor, setSelectedColor] = useState<string | null>(() => {
    if (requestedColor === null) return colors[0] ?? null;
    if (requestedColor === 'default') return null;
    return colors.includes(requestedColor) ? requestedColor : (colors[0] ?? null);
  });

  // Sizes are scoped to whichever color is currently selected — a color+size combo with no
  // matching variant row must never be reachable through the UI, since picking one silently
  // resolved to the base product with no indication the combination didn't actually exist.
  const sizesForColor = (color: string | null) =>
    Array.from(
      new Set(
        variants
          .filter((v) => color === null || v.color === color)
          .map((v) => v.size)
          .filter((s): s is string => Boolean(s))
      )
    );

  const [selectedSize, setSelectedSize] = useState<string | null>(
    () => sizesForColor(selectedColor)[0] ?? null
  );

  const availableSizes = sizesForColor(selectedColor);

  // A plain extra product photo (no color of its own) can be previewed in the gallery without
  // touching the selected color — this tracks that one-off override; any real color change
  // (via a pill or a color-tagged thumbnail) clears it so the highlight goes back to following
  // whichever color is actually selected.
  const [manualGalleryIndex, setManualGalleryIndex] = useState<number | null>(null);

  const handleSelectColor = (color: string | null) => {
    setSelectedColor(color);
    setManualGalleryIndex(null);
    const nextSizes = sizesForColor(color);
    if (nextSizes.length > 0 && !nextSizes.includes(selectedSize ?? '')) {
      setSelectedSize(nextSizes[0]);
    }
  };

  const selectedVariant =
    variants.find(
      (v) =>
        (colors.length === 0 || v.color === selectedColor) &&
        (sizes.length === 0 || v.size === selectedSize)
    ) ?? null;

  const resolved = resolveVariantDisplay(
    { price, originalPrice, image: galleryImages[0]?.url ?? '' },
    selectedVariant
  );
  const showDiscount =
    Boolean(resolved.originalPrice) && isSaleWindowActive(saleStartsAt, saleEndsAt, new Date());
  const discountPct =
    showDiscount && resolved.originalPrice
      ? Math.round(((resolved.originalPrice - resolved.price) / resolved.originalPrice) * 100)
      : null;

  // Every color gets its own thumbnail (tagged with its color, and always present even when
  // that color has no dedicated photo of its own — it falls back to the base photo) so a
  // shopper can browse and pick any option directly in the gallery, with no separate color-pill
  // list needed. This list is built in a FIXED order (base/"Default" photo, then each color in
  // the same order every time) and never reorders itself around the current selection — only
  // `activeGalleryIndex` below changes, moving the highlight/hero to the right spot in place
  // (previously, the selected variant's photo was always spliced to the front of the array,
  // which visually yanked whichever thumbnail you'd just clicked to the first position instead
  // of leaving it where it was).
  const baseImage: GalleryImage = {
    ...(galleryImages[0] ?? { url: '', alt: productName }),
    label: colors.length > 0 ? 'Default' : undefined,
    isDefaultOption: colors.length > 0,
  };
  // Color thumbnails are never deduped against the base photo or each other by URL — a color
  // with no photo of its own intentionally reuses the base image, but still needs its own
  // clickable, labeled thumbnail so every color stays selectable without a separate pill list.
  const colorPhotos: GalleryImage[] = colors.map((c) => {
    const variant = variants.find((v) => v.color === c && v.image);
    return {
      url: variant?.image ?? baseImage.url,
      alt: variant?.image ? `${productName}, ${c}` : baseImage.alt,
      color: c,
      label: c,
    };
  });

  const seenExtraUrls = new Set([baseImage.url]);
  const extraGalleryPhotos = galleryImages.filter((img) => {
    if (seenExtraUrls.has(img.url)) return false;
    seenExtraUrls.add(img.url);
    return true;
  });

  const displayImages: GalleryImage[] =
    colors.length > 0 ? [baseImage, ...colorPhotos, ...extraGalleryPhotos] : galleryImages;

  const colorDrivenIndex =
    selectedColor === null
      ? 0
      : Math.max(
          0,
          displayImages.findIndex((img) => img.color === selectedColor)
        );
  const activeGalleryIndex = manualGalleryIndex ?? colorDrivenIndex;

  // A specific variant's stock is fully authoritative while one is selected (no fallback to
  // the product's own stock fields) — but the "Default" option is deliberately the base
  // product's own state, so it falls back to the product's fields just like a product with
  // no variants at all does.
  const effectiveStockStatus = selectedVariant ? selectedVariant.stock_status : stockStatus;
  const effectiveStockCount = selectedVariant ? selectedVariant.stock_count : stockCount;
  const stockLabel = effectiveStockStatus ? STOCK_STATUS_LABELS[effectiveStockStatus] : null;
  const canAddToCart =
    effectiveStockStatus !== 'out_of_stock' && effectiveStockStatus !== 'discontinued';
  const lowStock =
    effectiveStockStatus === 'in_stock' &&
    effectiveStockCount != null &&
    effectiveStockCount <= (lowStockThreshold ?? 2) &&
    effectiveStockCount > 0;

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14">
      <ProductGallery
        images={displayImages}
        activeIndex={activeGalleryIndex}
        onSelectIndex={setManualGalleryIndex}
        onSelectColor={handleSelectColor}
        onSelectDefault={() => handleSelectColor(null)}
        tag={tag}
        tagBg={tagBg}
        tagText={tagText}
      />

      <div className="flex flex-col">
        <Link
          href={`/shop/${categorySlug}`}
          className="text-sm font-bold uppercase tracking-widest mb-2 hover:underline"
          style={{ color: 'var(--blush-rose)' }}
        >
          {emoji} {categoryTitle}
        </Link>
        <h1
          className="font-elegant-serif text-3xl md:text-4xl tracking-tight mb-3"
          style={{ color: 'var(--blush-text)' }}
        >
          {productName}
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="StarIcon"
                size={16}
                variant="solid"
                style={{
                  color: i < Math.round(rating) ? 'var(--blush-rose)' : 'var(--blush-border)',
                }}
              />
            ))}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--blush-muted)' }}>
            {rating} ({reviewCount} reviews)
          </span>
        </div>

        {/* Desktop only — on mobile these same thumbnails render instead under the photo (see
            ProductGallery), where a swipeable row fits the layout better than sitting here. */}
        <GalleryThumbnails
          images={displayImages}
          activeIndex={activeGalleryIndex}
          onSelectIndex={setManualGalleryIndex}
          onSelectColor={handleSelectColor}
          onSelectDefault={() => handleSelectColor(null)}
          className="hidden md:flex mb-4"
        />

        <AdminEditLink productId={productId} />

        {(colors.length > 0 || sizes.length > 0) && (
          <div className="flex flex-col gap-3 mb-5">
            {colors.length > 0 && (
              // The color pill list used to duplicate what's now shown directly under each
              // gallery thumbnail (see ProductGallery) — selecting a color happens there now;
              // this just confirms the current selection in text.
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: 'var(--blush-muted)' }}
              >
                Color:{' '}
                <span style={{ color: 'var(--blush-text)' }}>{selectedColor ?? 'Default'}</span>
              </p>
            )}
            {availableSizes.length > 0 && (
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Size: <span style={{ color: 'var(--blush-text)' }}>{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors"
                      style={
                        s === selectedSize
                          ? {
                              borderColor: 'var(--blush-rose)',
                              background: 'var(--blush-bg)',
                              color: 'var(--blush-text)',
                            }
                          : { borderColor: 'var(--blush-border)', color: 'var(--blush-muted)' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {personalizationEnabled && (
          <div className="mb-5">
            <label
              className={'text-xs font-bold uppercase tracking-wide mb-1.5 block'}
              style={{ color: 'var(--blush-muted)' }}
            >
              {personalizationLabel || 'Personalization'}
              {personalizationRequired ? ' *' : ' (optional)'}
            </label>
            <input
              type="text"
              value={personalizationText}
              onChange={(e) => setPersonalizationText(e.target.value)}
              maxLength={personalizationMaxLength ?? 50}
              className="w-full max-w-sm rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]"
              style={{ color: 'var(--blush-text)' }}
              placeholder={`Up to ${personalizationMaxLength ?? 50} characters`}
            />
          </div>
        )}

        <div className="flex items-center flex-wrap gap-3 mb-2">
          <span
            className="font-elegant-serif font-bold text-3xl"
            style={{ color: 'var(--blush-rose)' }}
          >
            ₹{resolved.price}
          </span>
          {showDiscount && (
            <>
              <span className="text-lg line-through" style={{ color: 'var(--blush-muted)' }}>
                ₹{resolved.originalPrice}
              </span>
              <span
                className="badge-pill"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-rose)' }}
              >
                {discountPct}% off
              </span>
            </>
          )}
        </div>

        <div className="mb-6">
          {stockLabel && (
            <span
              data-testid="stock-badge"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: stockLabel.bg, color: stockLabel.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stockLabel.color }} />
              {lowStock ? `Only ${effectiveStockCount} left` : stockLabel.label}
            </span>
          )}
          {!selectedVariant && stockStatus === 'made_to_order' && madeToOrderLeadTime && (
            <span className="block text-xs mt-1.5" style={{ color: 'var(--blush-muted)' }}>
              {madeToOrderLeadTime}
            </span>
          )}
        </div>

        {!isPlaceholderText(description) && (
          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: 'var(--blush-text)', opacity: 0.8 }}
          >
            {description}
          </p>
        )}

        {(dimensions || material || careInstructions) && (
          <div className="flex flex-col gap-1.5 mb-8 rounded-2xl bg-white p-4 card-bubble">
            {dimensions && (
              <p className="text-sm" style={{ color: 'var(--blush-text)' }}>
                <span className="font-bold">Dimensions:</span> {dimensions}
              </p>
            )}
            {material && (
              <p className="text-sm" style={{ color: 'var(--blush-text)' }}>
                <span className="font-bold">Material:</span> {material}
              </p>
            )}
            {careInstructions && (
              <p className="text-sm" style={{ color: 'var(--blush-text)' }}>
                <span className="font-bold">Care:</span> {careInstructions}
              </p>
            )}
          </div>
        )}

        <AddToCartButton
          productId={productId}
          productName={productName}
          variantId={selectedVariant?.id}
          personalizationText={personalizationEnabled ? personalizationText : undefined}
          personalizationRequired={personalizationEnabled && personalizationRequired}
          disabled={!canAddToCart}
          disabledLabel={stockLabel?.label}
        />

        {/* Trust row */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 card-bubble">
            <span className="text-lg">✨</span>
            <p className="text-xs font-bold leading-tight" style={{ color: 'var(--blush-text)' }}>
              Quality Checked
              <br />
              <span className="font-medium" style={{ color: 'var(--blush-muted)' }}>
                100% Guaranteed
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 card-bubble">
            <span className="text-lg">🚀</span>
            <p className="text-xs font-bold leading-tight" style={{ color: 'var(--blush-text)' }}>
              Fast Shipping
              <br />
              <span className="font-medium" style={{ color: 'var(--blush-muted)' }}>
                Pan India 2–5 days
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
