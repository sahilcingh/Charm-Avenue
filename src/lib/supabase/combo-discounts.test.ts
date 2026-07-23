import { describe, it, expect } from 'vitest';
import { resolveComboDiscounts, type ComboDefinition } from './combo-discounts';

const earringsNecklaceCombo: ComboDefinition = {
    id: 'combo-1',
    name: 'Earrings + Necklace',
    discountPercent: 10,
    productIds: ['earrings', 'necklace'],
};

describe('resolveComboDiscounts', () => {
    it('returns no matches when the cart has none of a combo\'s products', () => {
        const matches = resolveComboDiscounts([{ productId: 'ring', unitPrice: 100 }], [earringsNecklaceCombo]);
        expect(matches).toEqual([]);
    });

    it('returns no match when only some of the combo\'s products are present', () => {
        const matches = resolveComboDiscounts([{ productId: 'earrings', unitPrice: 200 }], [earringsNecklaceCombo]);
        expect(matches).toEqual([]);
    });

    it('matches and computes the discount once every combo product is present', () => {
        const matches = resolveComboDiscounts(
            [
                { productId: 'earrings', unitPrice: 200 },
                { productId: 'necklace', unitPrice: 300 },
            ],
            [earringsNecklaceCombo]
        );
        // 10% of (200 + 300) = 50
        expect(matches).toEqual([{ combo: earringsNecklaceCombo, amount: 50 }]);
    });

    it('applies once regardless of extra quantity — uses one unit\'s price per product, not the full line total', () => {
        // Simulates 3 units of earrings and 2 of necklace already collapsed to one
        // "this product is present at this price" entry per product (the caller's job).
        const matches = resolveComboDiscounts(
            [
                { productId: 'earrings', unitPrice: 200 },
                { productId: 'necklace', unitPrice: 300 },
            ],
            [earringsNecklaceCombo]
        );
        expect(matches[0].amount).toBe(50);
    });

    it('ignores an inactive/disabled combo entirely (caller filters is_active before calling)', () => {
        const matches = resolveComboDiscounts(
            [
                { productId: 'earrings', unitPrice: 200 },
                { productId: 'necklace', unitPrice: 300 },
            ],
            []
        );
        expect(matches).toEqual([]);
    });

    it('matches multiple independent combos at once', () => {
        const braceletRingCombo: ComboDefinition = {
            id: 'combo-2',
            name: 'Bracelet + Ring',
            discountPercent: 20,
            productIds: ['bracelet', 'ring'],
        };
        const matches = resolveComboDiscounts(
            [
                { productId: 'earrings', unitPrice: 200 },
                { productId: 'necklace', unitPrice: 300 },
                { productId: 'bracelet', unitPrice: 150 },
                { productId: 'ring', unitPrice: 100 },
            ],
            [earringsNecklaceCombo, braceletRingCombo]
        );
        expect(matches).toHaveLength(2);
        expect(matches.find((m) => m.combo.id === 'combo-1')?.amount).toBe(50);
        expect(matches.find((m) => m.combo.id === 'combo-2')?.amount).toBe(50);
    });

    it('uses the first cart entry for a product when it appears more than once (e.g. two variant lines)', () => {
        const matches = resolveComboDiscounts(
            [
                { productId: 'earrings', unitPrice: 200 },
                { productId: 'earrings', unitPrice: 999 },
                { productId: 'necklace', unitPrice: 300 },
            ],
            [earringsNecklaceCombo]
        );
        expect(matches[0].amount).toBe(50);
    });

    it('rounds the discount amount to the nearest rupee', () => {
        const oddCombo: ComboDefinition = { id: 'combo-3', name: 'Odd', discountPercent: 15, productIds: ['a', 'b'] };
        const matches = resolveComboDiscounts(
            [
                { productId: 'a', unitPrice: 99 },
                { productId: 'b', unitPrice: 50 },
            ],
            [oddCombo]
        );
        // 15% of 149 = 22.35 -> rounds to 22
        expect(matches[0].amount).toBe(22);
    });
});
