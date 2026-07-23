import type { DbCategory, DbProduct, ProductStockStatus } from './types';

export interface Category {
    slug: string;
    title: string;
    subtitle: string;
    emoji: string;
    tag: string;
    image: string;
    imageAlt: string;
    tagBg: string;
    tagText: string;
    description: string;
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    categorySlug: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    imageAlt: string;
    tag?: string;
    tagBg?: string;
    tagText?: string;
    emoji: string;
    description: string;
    rating: number;
    reviewCount: number;
    // Phase 5 — checkout needs these to know whether to show a personalization field.
    personalizationEnabled: boolean;
    personalizationLabel: string | null;
    personalizationRequired: boolean;
    personalizationMaxLength: number | null;
    // Phase 6 — sale window (gates whether originalPrice/discount badge
    // displays — see isSaleWindowActive), product-level stock (authoritative
    // only when the product has no active variants), and free-text details.
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

export function mapCategoryRow(row: DbCategory): Category {
    return {
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle,
        emoji: row.emoji,
        tag: row.tag,
        image: row.image,
        imageAlt: row.image_alt,
        tagBg: row.tag_bg,
        tagText: row.tag_text,
        description: row.description,
    };
}

/**
 * `categoryTitle` comes from a joined `categories` row rather than living on
 * the product row itself — passed in separately so this stays a pure,
 * dependency-free mapper testable without a database.
 */
export function mapProductRow(row: DbProduct, categoryTitle: string | undefined): Product {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        categorySlug: row.category_slug,
        category: categoryTitle ?? row.category_slug,
        price: row.price,
        originalPrice: row.original_price ?? undefined,
        image: row.image,
        imageAlt: row.image_alt,
        tag: row.tag ?? undefined,
        tagBg: row.tag_bg ?? undefined,
        tagText: row.tag_text ?? undefined,
        emoji: row.emoji,
        description: row.description,
        rating: row.rating,
        reviewCount: row.review_count,
        personalizationEnabled: row.personalization_enabled,
        personalizationLabel: row.personalization_label,
        personalizationRequired: row.personalization_required,
        personalizationMaxLength: row.personalization_max_length,
        saleStartsAt: row.sale_starts_at,
        saleEndsAt: row.sale_ends_at,
        stockStatus: row.stock_status,
        madeToOrderLeadTime: row.made_to_order_lead_time,
        lowStockThreshold: row.low_stock_threshold,
        stockCount: row.stock_count,
        dimensions: row.dimensions,
        material: row.material,
        careInstructions: row.care_instructions,
    };
}
