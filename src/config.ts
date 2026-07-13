/**
 * Central tunables — the "go-live" file. Edit these constants to rebrand or
 * deploy; everything else reads from here.
 */
export const SITE = {
  // Origin only (no path). The deployment base path (`/apps/periodic-table/`)
  // lives in `astro.config.mjs` (`base`) and is applied via `absUrl()` below,
  // so canonical/og/JSON-LD URLs come out as `<origin><base><path>`.
  url: "https://smolkin.org",
  name: "Periodic Table",
  shortName: "Elements",
  title: "Interactive Periodic Table — Every Element, Its Own Page",
  description:
    "An interactive periodic table of the 118 elements. Click any element for an embedded article, or open its own dedicated, fully indexable page with structured data, electron configuration, discovery, and uses.",
  author: "Michael Smolkin",
  authorUrl: "https://www.smolkin.org",
  /** Leave blank to omit the analytics beacon. */
  analyticsId: "",
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
