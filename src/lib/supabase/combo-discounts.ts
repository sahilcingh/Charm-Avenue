export interface ComboDefinition {
    id: string;
    name: string;
    discountPercent: number;
    productIds: string[];
}

export interface ComboDiscountMatch {
    combo: ComboDefinition;
    amount: number;
}

/**
 * A combo matches once every one of its products is present in the cart
 * (at least one line, any variant). The discount applies exactly once,
 * computed off one unit's price per combo product — not the full line
 * total — so extra quantity of any combo product never multiplies it.
 *
 * `cartLines` should already be one entry per distinct product id; if a
 * product has more than one line (e.g. two variants), the first entry for
 * that product wins.
 */
export function resolveComboDiscounts(
    cartLines: { productId: string; unitPrice: number }[],
    combos: ComboDefinition[]
): ComboDiscountMatch[] {
    const priceByProduct = new Map<string, number>();
    for (const line of cartLines) {
        if (!priceByProduct.has(line.productId)) priceByProduct.set(line.productId, line.unitPrice);
    }

    return combos
        .filter((combo) => combo.productIds.every((id) => priceByProduct.has(id)))
        .map((combo) => {
            const combinedPrice = combo.productIds.reduce((sum, id) => sum + (priceByProduct.get(id) ?? 0), 0);
            return { combo, amount: Math.round(combinedPrice * (combo.discountPercent / 100)) };
        });
}
