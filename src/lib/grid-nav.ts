/**
 * Keyboard navigation over the periodic-table grid — pure logic, unit-tested.
 *
 * The table renders 118 buttons; without arrow-key support that is 118 tab
 * stops. table-ui.ts applies the roving-tabindex pattern using these helpers:
 * one cell is the tab stop, and arrow keys move focus between cells.
 *
 * Movement semantics:
 *  - Left/Right: previous/next cell in atomic-number order (the cells array is
 *    ordered by atomic number), skipping filtered-out cells. This walks rows
 *    naturally and crosses the s/d-block ↔ f-block boundary the way reading
 *    order does (…Ba → La… even though La renders in the detached row).
 *  - Up/Down: nearest cell in the same rendered column (same x, closest y),
 *    skipping filtered-out cells.
 *  - Home/End: first/last visible cell.
 */

export interface NavCell {
  /** Rendered grid column (1–18). */
  x: number;
  /** Rendered grid row (1–10; 9/10 are the detached f-block rows). */
  y: number;
  /** True when the cell is filtered out and should be skipped. */
  hidden: boolean;
}

export const NAV_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export function isNavKey(key: string): key is NavKey {
  return (NAV_KEYS as readonly string[]).includes(key);
}

/** Index of the first visible cell, or null when everything is filtered out. */
export function firstVisibleIndex(cells: NavCell[]): number | null {
  const i = cells.findIndex((c) => !c.hidden);
  return i === -1 ? null : i;
}

function lastVisibleIndex(cells: NavCell[]): number | null {
  for (let i = cells.length - 1; i >= 0; i--) {
    if (!cells[i]!.hidden) return i;
  }
  return null;
}

function step(cells: NavCell[], from: number, dir: 1 | -1): number | null {
  for (let i = from + dir; i >= 0 && i < cells.length; i += dir) {
    if (!cells[i]!.hidden) return i;
  }
  return null;
}

/** Nearest visible cell in the same column, above (-1) or below (+1). */
function vertical(cells: NavCell[], from: number, dir: 1 | -1): number | null {
  const { x, y } = cells[from]!;
  let best: number | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]!;
    if (c.hidden || c.x !== x) continue;
    const dist = (c.y - y) * dir;
    if (dist > 0 && dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * The cell index that should receive focus after pressing `key` on the cell at
 * `current`, or null when there is nowhere to move (edge of the table, or no
 * visible cells).
 */
export function nextCellIndex(
  cells: NavCell[],
  current: number,
  key: NavKey,
): number | null {
  if (current < 0 || current >= cells.length) return firstVisibleIndex(cells);
  switch (key) {
    case "ArrowLeft":
      return step(cells, current, -1);
    case "ArrowRight":
      return step(cells, current, 1);
    case "ArrowUp":
      return vertical(cells, current, -1);
    case "ArrowDown":
      return vertical(cells, current, 1);
    case "Home":
      return firstVisibleIndex(cells);
    case "End":
      return lastVisibleIndex(cells);
  }
}
