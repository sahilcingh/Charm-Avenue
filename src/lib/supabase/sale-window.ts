/**
 * Whether a sale's original-price/discount badge should currently display.
 * Price itself is never touched by this — it's always the actual charged
 * price, updated manually by the admin (see Phase 1 decision). A product
 * with neither bound set has no window at all, so the discount always shows,
 * matching the pre-Phase-1 behavior every existing product still relies on.
 */
export function isSaleWindowActive(saleStartsAt: string | null, saleEndsAt: string | null, now: Date): boolean {
    if (saleStartsAt && now < new Date(saleStartsAt)) return false;
    if (saleEndsAt && now > new Date(saleEndsAt)) return false;
    return true;
}
