# Elementa

Live: [elementalearn.com](https://elementalearn.com/)

The complete learning app is at [elementalearn.com/study/](https://elementalearn.com/study/):
quizzes with answer explanations, electron-shell and subshell diagrams, trends,
comparisons, printable worksheets, study notes, and portable device-local progress.
Its exported React source is in `companion/`; the reference pages below remain
static HTML. The separate tutor experiment is not part of this deployment.

The public reference and study app run on our own hosting without a Base44 account,
subscription, API key, hosted database, or runtime request. Base44 is a development
tool. Exporting from it and committing here is explicit; GitHub sync is not connected.

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
  coordinate, so that can't happen). Each cell is an ordinary link to its
  element page, available to crawlers and no-JavaScript visitors; normal clicks
  progressively open the info panel while new-tab gestures keep working.
  The grid is fully keyboard-navigable
  (roving tabindex: one tab stop, arrow keys / Home / End move between cells),
  and the live filter matches name, symbol, number, or category, with a match
  count and an explicit "no matches" empty state.
- **More-info panel**: clicking an element opens a slide-in panel that embeds
  *that element's article*, loaded from its own static page. The dedicated page
  is the single source of truth, so the panel never drifts from the indexable
  content. Panel controls (Share, **Show more →**, Close) sit on the **right** of
  the header.
- **Compare view** (`/compare/`): put any two or three elements side by side and
  see their core properties aligned — atomic mass, category, group/period,
  electron configuration, and discovery — with the greatest value in each numeric
  row highlighted. The default trio is prerendered into static HTML (so crawlers
  and no-JS visitors see a real table); the picker then re-renders from the same
  pure logic and keeps a shareable `?ids=iron,gold,oxygen` URL in sync.
- **Per-element pages** (`/element/<slug>/`): hero tile, full article (overview,
  atomic structure, discovery + neighbours), a properties table, prev/next
  navigation, and a **Share** button.
- **Share button**: uses the Web Share API where available, falls back to
  copying the canonical link to the clipboard, with a toast either way.
- **Full SEO**: per-page canonical URLs, Open Graph + Twitter cards, per-page
  JSON-LD (`WebSite` + `ItemList` on indexes, `ChemicalSubstance` +
  `BreadcrumbList` on element pages), a generated sitemap, an RSS feed of all
  elements, and `robots.txt`.
- **Per-element social cards**: every element page ships its own prerendered
  1200×630 PNG Open Graph image (`/og/<slug>.png`) — the element's tile in its
  category colour with its key facts — rasterized at build time with sharp
  (social crawlers don't render SVG `og:image`s, so these are real PNGs).

## Architecture

| Layer | Where | Tested by |
| --- | --- | --- |
| Element dataset (118 elements, accurate core facts + grid positions) | `src/data/elements.ts` | `test/elements.test.ts` |
| Core logic (lookup, category/group/period, grid, share-data, slugs) | `src/lib/elements.ts` | `test/elements.test.ts` |
| Article generation (deterministic prose + facts per element) | `src/lib/article.ts` | `test/article.test.ts` |
| Element comparison (side-by-side rows, numeric-max highlight, slug resolution) | `src/lib/compare.ts` | `test/compare.test.ts` |
| Share logic (Web Share / clipboard / unavailable) | `src/lib/share.ts` | `test/share.test.ts` |
| Keyboard grid navigation (roving tabindex, arrow-key movement) | `src/lib/grid-nav.ts` | `test/grid-nav.test.ts` |
| OG social-card template (SVG rasterized to per-element PNGs) | `src/lib/og-card.ts` | `test/og-card.test.ts` |
| Static build output (per-element pages, SEO, sitemap, RSS) | `dist/` | `test/build-output.test.ts` |
| UI (Astro pages/components + the client scripts) | `src/pages`, `src/components`, `src/scripts` | build + `test/compare-ui.test.ts` (jsdom) + manual |

There are two small client scripts, and everything else ships as static HTML:
`src/scripts/table-ui.ts` (filter, panel, fetch-and-embed article, share) powers
the interactive table, and `src/scripts/compare-ui.ts` progressively enhances the
`/compare/` page (re-render the table from the picks and keep the shareable
`?ids=` URL in sync). Both only enhance content that already renders without JS.

## Develop

```bash
npm ci
npm ci --prefix companion
npm run dev        # local dev server
```

## Build + verify + test

```bash
npm run check      # astro check (types + content)
npm run build      # rasterizes icons, then prerenders dist/
npm run verify     # post-build gate: dead-link + finishing-asset check
npm test           # vitest: unit tests + dist/ integration tests
npm test --prefix companion
npm run lint --prefix companion
npm run preview    # serve dist/ locally
```

`npm test` runs the unit suite always; the `dist/` integration tests in
`test/build-output.test.ts` run only when a build is present (run `npm run build`
first to include them).

## Deploy

Base44 Main is a builder workspace, not the production deployment. Export a
completed Main revision, review changes against the last imported export, retain
this repository's auth-free entry and deployment configuration, and run the checks
below before deploying. Tutor work stays on `chemistry-tutor-journey`.

Base44 branches are snapshots, not automatic followers of Main. Before continuing
tutor work or switching its preview, use **Update branch** to pull Main into it,
resolve conflicts, and verify zero pending Main changes. Export and test the
updated tutor source independently; selecting its preview does not publish it.
See the [Base44 branch documentation](https://docs.base44.com/Building-your-app/working-with-branches).

`bash scripts/deploy-elementa.sh` runs the release checks, backs up the current
domain, and updates its existing static Caddy document root through SSH. It keeps
old hashed assets available for open tabs. The study app's offline cache and
manifest are scoped to `/study/`; updating it does not remove other applications'
caches. Verify the live learner journeys after deploying.

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
