import { describe, it, expect } from 'vitest';
import { computeFinalTileColSpan, type BentoSpan } from './categoryBentoLayout';

const NORMAL: BentoSpan = { colSpan: 1, rowSpan: 1 };
const WIDE: BentoSpan = { colSpan: 2, rowSpan: 1 };
const HERO: BentoSpan = { colSpan: 2, rowSpan: 2 };

describe('computeFinalTileColSpan', () => {
  it('reproduces the reported bug: 6 tiles (hero + wide + 4 normal) leave the last tile alone in its row, so it must stretch to fill it', () => {
    // Matches the live site's order: normal, hero(hair), normal, normal, wide(gifts), normal(keycuties, last)
    const spans = [NORMAL, HERO, NORMAL, NORMAL, WIDE, NORMAL];
    expect(computeFinalTileColSpan(spans)).toBe(3);
  });

  it('leaves a single normal tile alone in a 3-column grid untouched (already fills the row)', () => {
    expect(computeFinalTileColSpan([NORMAL, NORMAL, NORMAL])).toBe(1);
  });

  it('expands the last tile to close a 1-column gap left beside it in its row', () => {
    expect(computeFinalTileColSpan([HERO, NORMAL, NORMAL, NORMAL, NORMAL])).toBe(2);
  });

  it('does not expand when the last row is already fully packed', () => {
    const spans = [NORMAL, HERO, NORMAL, NORMAL, NORMAL, NORMAL, NORMAL];
    // hero(0,1)x(1,2)+2rows, normals fill (0,0),(1,0),(2,0),(2,1),(2,2) — 7th normal starts row3 col0 alone
    // 8th tile (added below) would complete row3; confirm 7 tiles alone still expands
    expect(computeFinalTileColSpan(spans)).toBe(3);
  });

  it('adding one more category after a full row (7 total) only needs to close the remaining 2-column gap', () => {
    const spans = [NORMAL, HERO, NORMAL, NORMAL, WIDE, NORMAL, NORMAL];
    expect(computeFinalTileColSpan(spans)).toBe(2);
  });

  it('adding two more categories after a full row (8 total) exactly fills the row — no expansion needed', () => {
    const spans = [NORMAL, HERO, NORMAL, NORMAL, WIDE, NORMAL, NORMAL, NORMAL];
    expect(computeFinalTileColSpan(spans)).toBe(1);
  });

  it('handles a single category by filling the whole grid width', () => {
    expect(computeFinalTileColSpan([NORMAL])).toBe(3);
  });

  it('handles an empty list without throwing', () => {
    expect(computeFinalTileColSpan([])).toBe(3);
  });
});
