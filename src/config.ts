/**
 * Central tunables — the "go-live" file. Edit these constants to rebrand or
 * deploy; everything else reads from here.
 */
export const SITE = {
  url: "https://elementalearn.com",
  name: "Elementa",
  shortName: "Elementa",
  title: "Elementa — Periodic Table & Chemistry Practice",
  description:
    "Explore an interactive periodic table with all 118 elements, comparisons, electron shells and orbitals, quizzes, and printable chemistry worksheets.",
  author: "Michael Smolkin",
  authorUrl: "https://www.smolkin.org",
  /** Leave blank to omit the analytics beacon. */
  analyticsId: "0ee0e19b-b29b-4c98-b3f6-a92a43b4ba5a",
  themeColor: "#0e1116",
  locale: "en",
} as const;

/**
 * Build an absolute site URL that includes BOTH the origin (`SITE.url`) and the
 * configured deployment base path (Astro's `base`, exposed as
 * `import.meta.env.BASE_URL`, e.g. `/apps/periodic-table/`).
 *
 * Why this exists: `new URL('/element/iron/', SITE.url)` resolves the leading
 * slash against the origin and DROPS the base — emitting
 * `https://smolkin.org/element/iron/` instead of
 * `https://smolkin.org/apps/periodic-table/element/iron/`. That broke every
 * canonical / og:url / og:image / JSON-LD URL under a subpath deployment. Route
 * all in-head / JSON-LD absolute URLs through here so the base is never lost.
 *
 * `path` is treated as site-root-relative; a leading slash is optional. Pass
 * `""` for the site root (home).
 */
export function absUrl(path = ""): string {
  const origin = SITE.url.replace(/\/+$/, "");
  const base = import.meta.env.BASE_URL; // always starts and ends with "/"
  const rel = path.replace(/^\/+/, "");
  return origin + base + rel;
}
