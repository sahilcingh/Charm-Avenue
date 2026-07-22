import type { DbCategory, DbProduct } from './types';

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
    };
}
