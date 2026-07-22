export interface DbProfile {
    id: string;
    email: string;
    name: string | null;
    is_admin: boolean;
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
