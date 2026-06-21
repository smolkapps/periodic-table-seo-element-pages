/**
 * Core element logic — the testable heart of the app.
 *
 * Everything UI-facing (the Astro pages, the interactive table, the share
 * button) is built on top of these pure functions so the behaviour is covered
 * by unit tests without a browser.
 */

import { ELEMENT_TUPLES, type Category, type Phase } from "../data/elements";

export type { Category, Phase };

export interface Element {
  number: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: Category;
  /** Column 1–18 in the standard 18-column layout. */
  xpos: number;
  /** Row 1–10; rows 9/10 are the detached lanthanide/actinide blocks. */
  ypos: number;
  electronConfig: string;
  phase: Phase;
  discoveredYear: number | null;
  discoveredBy: string | null;
  /** IUPAC group number (1–18), or null for the f-block (lanthanides/actinides). */
  group: number | null;
  /** Period (principal quantum row) the element actually belongs to: 1–7. */
  period: number;
  /** Stable URL slug, e.g. "hydrogen". */
  slug: string;
  /** Whether the standard atomic weight is the mass number of a synthetic/unstable isotope. */
  synthetic: boolean;
}

/** Synthetic elements: those with no stable isotope (Tc, Pm, and everything ≥ 84 except none). */
const SYNTHETIC_NUMBERS = new Set<number>([
  43, 61, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
  116, 117, 118,
]);

/**
 * Convert an element name to a URL-safe slug.
 * Handles spaces and any stray punctuation; lowercases. Pure + deterministic.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derive the IUPAC group (1–18) for a d/p/s-block element from its grid column.
 * f-block elements (lanthanides ypos 9, actinides ypos 10) have no group → null.
 */
export function groupForElement(xpos: number, ypos: number): number | null {
  if (ypos === 9 || ypos === 10) return null;
  return xpos;
}

/**
 * Derive the true period (1–7) an element belongs to. The lanthanides really
 * belong to period 6 and actinides to period 7, even though they render in the
 * detached rows 9 and 10.
 */
export function periodForElement(ypos: number): number {
  if (ypos === 9) return 6;
  if (ypos === 10) return 7;
  return ypos;
}

function buildElement(t: (typeof ELEMENT_TUPLES)[number]): Element {
  const [
    number,
    symbol,
    name,
    atomicMass,
    category,
    xpos,
    ypos,
    electronConfig,
    phase,
    discoveredYear,
    discoveredBy,
  ] = t;
  return {
    number,
    symbol,
    name,
    atomicMass,
    category,
    xpos,
    ypos,
    electronConfig,
    phase,
    discoveredYear,
    discoveredBy,
    group: groupForElement(xpos, ypos),
    period: periodForElement(ypos),
    slug: slugify(name),
    synthetic: SYNTHETIC_NUMBERS.has(number),
  };
}

/** All 118 elements, ordered by atomic number. Frozen to prevent mutation. */
export const ELEMENTS: readonly Element[] = Object.freeze(
  ELEMENT_TUPLES.map(buildElement),
);

const BY_SLUG = new Map(ELEMENTS.map((e) => [e.slug, e]));
const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol.toLowerCase(), e]));
const BY_NUMBER = new Map(ELEMENTS.map((e) => [e.number, e]));

/** Look up an element by its URL slug (e.g. "iron"). */
export function getElementBySlug(slug: string): Element | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** Look up an element by chemical symbol, case-insensitively (e.g. "fe" or "Fe"). */
export function getElementBySymbol(symbol: string): Element | undefined {
  return BY_SYMBOL.get(symbol.toLowerCase());
}

/** Look up an element by atomic number. */
export function getElementByNumber(n: number): Element | undefined {
  return BY_NUMBER.get(n);
}

export interface CategoryMeta {
  label: string;
  /** CSS custom-property name used for the category's accent colour. */
  cssVar: string;
}

/** Display metadata for each category (label + the CSS variable that colours it). */
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "alkali metal": { label: "Alkali metal", cssVar: "--cat-alkali" },
  "alkaline earth metal": { label: "Alkaline earth metal", cssVar: "--cat-alkaline" },
  "transition metal": { label: "Transition metal", cssVar: "--cat-transition" },
  "post-transition metal": { label: "Post-transition metal", cssVar: "--cat-post-transition" },
  metalloid: { label: "Metalloid", cssVar: "--cat-metalloid" },
  nonmetal: { label: "Reactive nonmetal", cssVar: "--cat-nonmetal" },
  halogen: { label: "Halogen", cssVar: "--cat-halogen" },
  "noble gas": { label: "Noble gas", cssVar: "--cat-noble" },
  lanthanide: { label: "Lanthanide", cssVar: "--cat-lanthanide" },
  actinide: { label: "Actinide", cssVar: "--cat-actinide" },
};

/** The display label for a category, e.g. "Noble gas". */
export function categoryLabel(category: Category): string {
  return CATEGORY_META[category].label;
}

export interface GridCell {
  element: Element;
  xpos: number;
  ypos: number;
}

/**
 * Build the 18-column × 10-row grid placement. Returns a flat list of cells
 * with explicit CSS-grid coordinates. This is the layout that fixes the
 * original app's "Oganesson/Actinium rendered tiny" bug — every element gets an
 * explicit column/row instead of relying on document flow, so the spacer gaps
 * (between groups 2 and 3, and the detached f-block) never collapse a cell.
 */
export function buildGrid(): GridCell[] {
  return ELEMENTS.map((element) => ({
    element,
    xpos: element.xpos,
    ypos: element.ypos,
  }));
}

/** Number of columns / rows in the rendered grid. */
export const GRID_COLS = 18;
export const GRID_ROWS = 10;

/**
 * Build a canonical, absolute URL for an element page given a site origin.
 * Used both for `<link rel="canonical">`/JSON-LD and for the share button.
 * Trailing slashes are normalised away from the origin.
 */
export function elementUrl(slug: string, origin: string): string {
  const base = origin.replace(/\/+$/, "");
  // Trailing slash to match the directory-format canonical URL exactly, so
  // shared links resolve to the canonical page with no redirect.
  return `${base}/element/${slug}/`;
}

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Build the payload passed to the Web Share API (or copied to clipboard as a
 * fallback) for a given element. Pure so the share text is unit-testable.
 */
export function buildShareData(element: Element, origin: string): ShareData {
  return {
    title: `${element.name} (${element.symbol}) — Periodic Table`,
    text: `${element.name}: element ${element.number}, ${categoryLabel(
      element.category,
    ).toLowerCase()}, atomic mass ${element.atomicMass}.`,
    url: elementUrl(element.slug, origin),
  };
}

/**
 * Group elements by category, preserving the canonical category order. Useful
 * for the legend and for category landing sections.
 */
export function elementsByCategory(): Map<Category, Element[]> {
  const order = Object.keys(CATEGORY_META) as Category[];
  const map = new Map<Category, Element[]>();
  for (const cat of order) map.set(cat, []);
  for (const el of ELEMENTS) map.get(el.category)!.push(el);
  return map;
}

/**
 * Find the previous and next element by atomic number for prev/next navigation
 * on a detail page. Returns undefined at the ends.
 */
export function adjacentElements(n: number): {
  prev: Element | undefined;
  next: Element | undefined;
} {
  return { prev: getElementByNumber(n - 1), next: getElementByNumber(n + 1) };
}
