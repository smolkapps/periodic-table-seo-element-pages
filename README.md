# Periodic Table — SEO element pages

An interactive periodic table of all 118 elements, where **every element gets
its own dedicated, fully indexable static page** — plus the element's article is
embedded back into the main table's slide-in "more info" panel.

This is the SEO/static-rendering enhancement of an earlier client-rendered
periodic-table web app. Where the original was rendered in the browser (and so
served crawlers an empty shell, needing something like prerender.io), this
version is **statically generated with Astro**: each of the 118 element pages is
prerendered HTML containing the full article text and structured data, so search
engines see complete content with zero JavaScript.

## What it does

- **Interactive table** (`/`): an 18-column periodic grid. Every element is a
  full, correctly sized cell — including the lanthanide/actinide rows and the
  group-2/group-3 gap (the original app rendered Oganesson and Actinium tiny
  because the spacers collapsed their cells; here each cell has an explicit grid
  coordinate, so that can't happen).
- **More-info panel**: clicking an element opens a slide-in panel that embeds
  *that element's article*, loaded from its own static page. The dedicated page
  is the single source of truth, so the panel never drifts from the indexable
  content. Panel controls (Share, **Show more →**, Close) sit on the **right** of
  the header.
- **Per-element pages** (`/element/<slug>/`): hero tile, full article (overview,
  atomic structure, discovery + neighbours), a properties table, prev/next
  navigation, and a **Share** button.
- **Share button**: uses the Web Share API where available, falls back to
  copying the canonical link to the clipboard, with a toast either way.
- **Full SEO**: per-page canonical URLs, Open Graph + Twitter cards, per-page
  JSON-LD (`ItemList` on indexes, `ChemicalSubstance` + `BreadcrumbList` on
  element pages), a generated sitemap, an RSS feed of all elements, and
  `robots.txt`.

## Architecture

| Layer | Where | Tested by |
| --- | --- | --- |
| Element dataset (118 elements, accurate core facts + grid positions) | `src/data/elements.ts` | `test/elements.test.ts` |
| Core logic (lookup, category/group/period, grid, share-data, slugs) | `src/lib/elements.ts` | `test/elements.test.ts` |
| Article generation (deterministic prose + facts per element) | `src/lib/article.ts` | `test/article.test.ts` |
| Share logic (Web Share / clipboard / unavailable) | `src/lib/share.ts` | `test/share.test.ts` |
| Static build output (per-element pages, SEO, sitemap, RSS) | `dist/` | `test/build-output.test.ts` |
| UI (Astro pages/components + the one client script) | `src/pages`, `src/components`, `src/scripts` | build + manual |

The interactive table's only client JavaScript is `src/scripts/table-ui.ts`
(filter, panel, fetch-and-embed article, share). Everything else ships as static
HTML.

## Develop

```bash
npm install
npm run dev        # local dev server
```

## Build + verify + test

```bash
npm run check      # astro check (types + content)
npm run build      # rasterizes icons, then prerenders dist/
npm run verify     # post-build gate: dead-link + finishing-asset check
npm test           # vitest: unit tests + dist/ integration tests
npm run preview    # serve dist/ locally
```

`npm test` runs the unit suite always; the `dist/` integration tests in
`test/build-output.test.ts` run only when a build is present (run `npm run build`
first to include them).

## Deploy

`dist/` is a plain static bundle — deploy it to any static host (Cloudflare
Pages, Netlify, GitHub Pages, S3, a Caddy box, …). Set the canonical domain in
`src/config.ts` (`SITE.url`) and `astro.config.mjs` (`site`) before building.

## Data sources

Element data is drawn from public-domain references: IUPAC standard atomic
weights (2021) and NIST. Masses in brackets (e.g. `[294]`) are the mass number
of the most stable / commonly produced isotope for elements with no stable
isotope.

## License

MIT — see [LICENSE](./LICENSE).
