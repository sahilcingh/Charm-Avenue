'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ProductGallery from './ProductGallery';
import AddToCartButton from './AddToCartButton';
import AdminEditLink from './AdminEditLink';
import type { DbProductVariant, ProductStockStatus } from '@/lib/supabase/types';
import type { GalleryImage } from '@/lib/supabase/product-gallery';
import { resolveVariantDisplay, STOCK_STATUS_LABELS } from '@/lib/supabase/product-variants';
import { isSaleWindowActive } from '@/lib/supabase/sale-window';

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
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))),
    [variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))),
    [variants]
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null);

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

  // The variant's own photo becomes the gallery hero when set — everything else in the
  // gallery (the main photo plus any additional ones) stays available as thumbnails.
  const displayImages: GalleryImage[] = selectedVariant?.image
    ? [
        { url: selectedVariant.image, alt: galleryImages[0]?.alt ?? productName },
        ...galleryImages.filter((img) => img.url !== selectedVariant.image),
      ]
    : galleryImages;

  // Once a product has ≥1 variant, variant-level stock is fully authoritative
  // (no fallback to the product's own stock fields) — matches the same rule
  // already applied to price/image above.
  const hasVariants = variants.length > 0;
  const effectiveStockStatus = hasVariants ? (selectedVariant?.stock_status ?? null) : stockStatus;
  const effectiveStockCount = hasVariants ? (selectedVariant?.stock_count ?? null) : stockCount;
  const stockLabel = effectiveStockStatus ? STOCK_STATUS_LABELS[effectiveStockStatus] : null;
  const lowStock =
    effectiveStockStatus === 'in_stock' &&
    effectiveStockCount != null &&
    effectiveStockCount <= (lowStockThreshold ?? 2) &&
    effectiveStockCount > 0;

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14">
      <ProductGallery images={displayImages} tag={tag} tagBg={tagBg} tagText={tagText} />

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

        <AdminEditLink productId={productId} />

        {(colors.length > 0 || sizes.length > 0) && (
          <div className="flex flex-col gap-3 mb-5">
            {colors.length > 0 && (
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Color: <span style={{ color: 'var(--blush-text)' }}>{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors"
                      style={
                        c === selectedColor
                          ? {
                              borderColor: 'var(--blush-rose)',
                              background: 'var(--blush-bg)',
                              color: 'var(--blush-text)',
                            }
                          : { borderColor: 'var(--blush-border)', color: 'var(--blush-muted)' }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sizes.length > 0 && (
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: 'var(--blush-muted)' }}
                >
                  Size: <span style={{ color: 'var(--blush-text)' }}>{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
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
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: stockLabel.bg, color: stockLabel.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stockLabel.color }} />
              {lowStock ? `Only ${effectiveStockCount} left` : stockLabel.label}
            </span>
          )}
          {!hasVariants && stockStatus === 'made_to_order' && madeToOrderLeadTime && (
            <span className="block text-xs mt-1.5" style={{ color: 'var(--blush-muted)' }}>
              {madeToOrderLeadTime}
            </span>
          )}
        </div>

        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: 'var(--blush-text)', opacity: 0.8 }}
        >
          {description}
        </p>

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
