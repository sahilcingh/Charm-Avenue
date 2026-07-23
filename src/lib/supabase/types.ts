export interface DbProfile {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    is_admin: boolean;
    created_at: string;
}

export type OrderStatus = 'pending_whatsapp' | 'pending_payment' | 'paid' | 'cancelled';

export interface DbOrder {
    id: string;
    user_id: string;
    guest_name: string;
    guest_phone: string;
    guest_address: string;
    status: OrderStatus;
    subtotal: number;
    payment_gateway_order_id: string | null;
    payment_gateway_payment_id: string | null;
    created_at: string;
    updated_at: string;
    // Phase 7 — how much of `subtotal` (the final total) came from a combo
    // discount. Snapshotted at order time, same as everything in order_items.
    discount_total: number;
}

export interface DbOrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    // Phase 5 — snapshotted at order time, same principle as product_name/unit_price above:
    // the variant row itself can be edited or deleted later, but the order must forever
    // reflect what was actually ordered.
    variant_id: string | null;
    variant_label: string | null;
    variant_image: string | null;
    personalization_text: string | null;
}

export interface DbTag {
    slug: string;
    label: string;
    created_at: string;
}

// Phase 7 — a discount rule across 2+ independently-sold products (not a
// bundle product with its own fulfillment). See products-phase7-migration.sql.
export interface DbCombo {
    id: string;
    name: string;
    description: string | null;
    discount_percent: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbComboProduct {
    combo_id: string;
    product_id: string;
}

export interface DbProductVariant {
    id: string;
    product_id: string;
    color: string | null;
    size: string | null;
    sku: string | null;
    price_override: number | null;
    original_price_override: number | null;
    image: string | null;
    stock_status: ProductStockStatus | null;
    stock_count: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbProductImage {
    id: string;
    product_id: string;
    url: string;
    alt: string;
    sort_order: number;
    created_at: string;
}

export interface DbCategory {
    slug: string;
    title: string;
    subtitle: string;
    emoji: string;
    tag: string;
    image: string;
    image_alt: string;
    tag_bg: string;
    tag_text: string;
    description: string;
    sort_order: number;
}

export type ProductStockStatus = 'in_stock' | 'out_of_stock' | 'made_to_order' | 'discontinued';

export interface DbProduct {
    id: string;
    slug: string;
    name: string;
    category_slug: string;
    price: number;
    original_price: number | null;
    image: string;
    image_alt: string;
    tag: string | null;
    tag_bg: string | null;
    tag_text: string | null;
    emoji: string;
    description: string;
    rating: number;
    review_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Phase 1 — all optional/unset for a product that doesn't use the feature.
    sale_starts_at: string | null;
    sale_ends_at: string | null;
    dimensions: string | null;
    material: string | null;
    care_instructions: string | null;
    stock_status: ProductStockStatus | null;
    made_to_order_lead_time: string | null;
    low_stock_threshold: number | null;
    personalization_enabled: boolean;
    personalization_label: string | null;
    personalization_required: boolean;
    personalization_max_length: number | null;
    // Phase 6 — only meaningful for a product with zero variants; once any
    // variant exists, variant-level stock_count is authoritative instead.
    stock_count: number | null;
}

/** Preset badge styles the admin form offers, instead of raw hex color inputs. */
export const TAG_STYLES = {
    none: { label: 'No badge', tagBg: null, tagText: null },
    rose: { label: 'Rose (Best Seller / Hot)', tagBg: '#E8828F', tagText: '#FFFFFF' },
    deepRose: { label: 'Deep Rose (Trending / Premium)', tagBg: '#D1636F', tagText: '#FFFFFF' },
    blush: { label: 'Light Blush (New In)', tagBg: '#F6D3D6', tagText: '#1E1712' },
} as const;

export type TagStyleKey = keyof typeof TAG_STYLES;

export function tagStyleKeyFor(tagBg: string | null): TagStyleKey {
    const entry = Object.entries(TAG_STYLES).find(([, v]) => v.tagBg === tagBg);
    return (entry?.[0] as TagStyleKey) ?? 'none';
}
