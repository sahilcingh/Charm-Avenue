export const BENTO_COLUMNS = 3;

export interface BentoSpan {
  colSpan: number;
  rowSpan: number;
}

/**
 * Mirrors CSS Grid's default (sparse, row-major, non-dense) auto-placement
 * algorithm so the position it computes for the final tile matches exactly
 * where the browser will actually place it. Returns the colSpan the final
 * tile needs so it swallows any trailing empty cells in its row — since
 * nothing renders after it, an unfilled cell there would otherwise be a
 * permanent gap, not a temporary one a later tile could backfill.
 */
export function computeFinalTileColSpan(
  spans: BentoSpan[],
  columns: number = BENTO_COLUMNS
): number {
  if (spans.length === 0) return columns;

  const occupied: boolean[][] = [];
  const ensureRow = (r: number) => {
    while (occupied.length <= r) occupied.push(new Array(columns).fill(false));
  };
  const fits = (r: number, c: number, colSpan: number, rowSpan: number) => {
    if (c + colSpan > columns) return false;
    ensureRow(r + rowSpan - 1);
    for (let dr = 0; dr < rowSpan; dr++) {
      for (let dc = 0; dc < colSpan; dc++) {
        if (occupied[r + dr][c + dc]) return false;
      }
    }
    return true;
  };
  const place = (colSpan: number, rowSpan: number) => {
    let r = 0;
    for (;;) {
      ensureRow(r);
      for (let c = 0; c < columns; c++) {
        if (fits(r, c, colSpan, rowSpan)) return { r, c };
      }
      r++;
    }
  };
  const occupy = (r: number, c: number, colSpan: number, rowSpan: number) => {
    ensureRow(r + rowSpan - 1);
    for (let dr = 0; dr < rowSpan; dr++) {
      for (let dc = 0; dc < colSpan; dc++) {
        occupied[r + dr][c + dc] = true;
      }
    }
  };

  let lastPos = { r: 0, c: 0 };
  let lastColSpan = 1;
  spans.forEach(({ colSpan, rowSpan }, i) => {
    const pos = place(colSpan, rowSpan);
    occupy(pos.r, pos.c, colSpan, rowSpan);
    if (i === spans.length - 1) {
      lastPos = pos;
      lastColSpan = colSpan;
    }
  });

  let expanded = lastColSpan;
  for (let c = lastPos.c + lastColSpan; c < columns; c++) {
    if (occupied[lastPos.r]?.[c]) break;
    expanded++;
  }
  return expanded;
}
