/**
 * Element-comparison logic — the testable heart of the compare feature.
 *
 * Everything the /compare page renders (server-side for the default trio, and
 * client-side when the user changes the selection) is derived from these pure
 * functions, so the side-by-side comparison is fully covered by unit tests
 * without a browser and never drifts between the static page and the live UI.
 */

import {
  ELEMENTS,
  type Element,
  categoryLabel,
  getElementBySlug,
} from "./elements";
import { formatMass, discoveryPhrase } from "./article";

/** How many elements can be compared at once (min 2 for a meaningful diff). */
export const MIN_COMPARE = 2;
export const MAX_COMPARE = 3;

/** The trio shown when the page is opened with no explicit selection. */
export const DEFAULT_COMPARE_SLUGS: readonly string[] = [
  "iron",
  "gold",
  "oxygen",
];

/** One property row of the comparison table. */
export interface ComparisonRow {
  label: string;
  /** Rendered value per element, aligned to the comparison's element order. */
  values: string[];
  /**
   * Index of the element holding the greatest value for numeric rows, so the UI
   * can highlight it. `null` for non-numeric rows or when the max is tied.
   */
  maxIndex: number | null;
}

export interface Comparison {
  elements: Element[];
  rows: ComparisonRow[];
}

/** Numeric extractor per element, or null when the row isn't numerically rankable. */
type Numeric = ((el: Element) => number) | null;

interface RowSpec {
  label: string;
  value: (el: Element) => string;
  numeric: Numeric;
}

const ROW_SPECS: RowSpec[] = [
  { label: "Atomic number", value: (e) => String(e.number), numeric: (e) => e.number },
  { label: "Symbol", value: (e) => e.symbol, numeric: null },
  { label: "Atomic mass", value: (e) => formatMass(e), numeric: (e) => e.atomicMass },
  { label: "Category", value: (e) => categoryLabel(e.category), numeric: null },
  { label: "Group", value: (e) => (e.group !== null ? String(e.group) : "—"), numeric: null },
  { label: "Period", value: (e) => String(e.period), numeric: (e) => e.period },
  { label: "Phase at STP", value: (e) => capitalize(e.phase), numeric: null },
  { label: "Electron configuration", value: (e) => e.electronConfig, numeric: null },
  {
    label: "Discovered",
    value: (e) =>
      e.discoveredYear !== null ? String(e.discoveredYear) : "Antiquity",
    numeric: (e) => e.discoveredYear ?? -Infinity,
  },
  { label: "Notability", value: (e) => sentenceCase(discoveryPhrase(e)), numeric: null },
];

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function sentenceCase(s: string): string {
  return capitalize(s) + (s.endsWith(".") ? "" : ".");
}

/**
 * Index of the single maximum in `nums`, or null when the list is empty or the
 * maximum is shared by more than one element (a tie has no clear "winner").
 */
function argMax(nums: number[]): number | null {
  if (nums.length === 0) return null;
  let best = 0;
  let ties = 0;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i]! > nums[best]!) {
      best = i;
      ties = 0;
    } else if (nums[i]! === nums[best]!) {
      ties++;
    }
  }
  return ties > 0 ? null : best;
}

/**
 * Build the side-by-side comparison for a list of elements. Deterministic: the
 * same elements (in the same order) always produce the same rows, so the static
 * page and the interactive re-render agree exactly.
 */
export function buildComparison(elements: Element[]): Comparison {
  const rows: ComparisonRow[] = ROW_SPECS.map((spec) => {
    const values = elements.map(spec.value);
    const maxIndex =
      spec.numeric && elements.length > 1
        ? argMax(elements.map(spec.numeric))
        : null;
    return { label: spec.label, values, maxIndex };
  });
  return { elements, rows };
}

/**
 * Resolve a list of URL-supplied slugs into a valid, de-duplicated element list,
 * capped at MAX_COMPARE. Unknown slugs are dropped. If nothing valid resolves,
 * falls back to the default trio so the page always renders a comparison.
 */
export function resolveComparisonSlugs(slugs: string[]): Element[] {
  const seen = new Set<string>();
  const out: Element[] = [];
  for (const raw of slugs) {
    const el = getElementBySlug(raw.trim());
    if (!el || seen.has(el.slug)) continue;
    seen.add(el.slug);
    out.push(el);
    if (out.length >= MAX_COMPARE) break;
  }
  if (out.length === 0) {
    return DEFAULT_COMPARE_SLUGS.map((s) => getElementBySlug(s)!).filter(
      Boolean,
    );
  }
  return out;
}

/** All elements ordered by atomic number — used to populate the pickers. */
export const COMPARE_OPTIONS: readonly Element[] = ELEMENTS;
