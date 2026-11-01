import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Rocket,
  AlertTriangle,
  Code2,
  Globe,
  Smartphone,
  Copy,
  Check,
  Layers,
} from "lucide-react";

const PATCH_SNIPPETS = [
  {
    id: "periodic-table-astro",
    file: "src/components/PeriodicTable.astro",
    summary:
      "Merges pending commit 5b0c592 (crawlable <a href> cells) with origin/main 800162f (roving tabindex role='group', data-x/data-y coords, and live category search).",
    code: [
      "---",
      'import { buildGrid, CATEGORY_META, type Element } from "../lib/elements";',
      "",
      "const grid = buildGrid();",
      "",
      "function cellStyle(el: Element): string {",
      "  const accent = CATEGORY_META[el.category].cssVar;",
      "  return `--x:${el.xpos};--y:${el.ypos};--cell-accent:var(${accent});`;",
      "}",
      "---",
      "",
      '<div class="pt-scroll">',
      '  <div class="periodic-table js-periodic-table" role="group" aria-label="Periodic table of the elements">',
      "    {",
      "      grid.map(({ element }) => (",
      "        <a",
      "          href={`/element/${element.slug}/`}",
      '          class="pt-cell js-cell"',
      "          style={cellStyle(element)}",
      "          data-slug={element.slug}",
      "          data-symbol={element.symbol}",
      "          data-number={element.number}",
      "          data-name={element.name}",
      "          data-x={element.xpos}",
      "          data-y={element.ypos}",
      "          data-search={`${element.name} ${element.symbol} ${element.number} ${CATEGORY_META[element.category].label}`.toLowerCase()}",
      "          aria-label={`${element.name}, symbol ${element.symbol}, atomic number ${element.number}. Open details.`}",
      "        >",
      '          <span class="num">{element.number}</span>',
      '          <span class="sym">{element.symbol}</span>',
      '          <span class="nm">{element.name}</span>',
      "        </a>",
      "      ))",
      "    }",
      '    <div class="pt-placeholder" style="--x:3;--y:6;" aria-hidden="true">57–71</div>',
      '    <div class="pt-placeholder" style="--x:3;--y:7;" aria-hidden="true">89–103</div>',
      '    <div class="fblock-spacer" style="grid-row:8;" aria-hidden="true"></div>',
      "  </div>",
      "</div>",
    ].join("\n"),
  },
  {
    id: "table-ui-ts",
    file: "src/scripts/table-ui.ts (Cell wiring & Roving Tabindex)",
    summary:
      "Queries HTMLAnchorElement('.js-cell'), preserves roving tabindex & Escape-to-clear filter from 800162f, and intercepts only unmodified primary clicks to open the slide-in panel while letting Cmd/Ctrl/middle-click open the static element page.",
    code: [
      "  const cells = Array.from(",
      '    document.querySelectorAll<HTMLAnchorElement>(".js-cell"),',
      "  );",
      "  // ... roving tabindex & applyFilter() remain intact ...",
      "  for (const cell of cells) {",
      '    cell.addEventListener("click", (event) => {',
      "      if (",
      "        event.button !== 0 ||",
      "        event.metaKey ||",
      "        event.ctrlKey ||",
      "        event.shiftKey ||",
      "        event.altKey",
      "      ) {",
      "        return;",
      "      }",
      "      event.preventDefault();",
      "      openPanel(",
      "        {",
      '          slug: cell.dataset.slug ?? "",',
      '          symbol: cell.dataset.symbol ?? "",',
      '          name: cell.dataset.name ?? "",',
      '          number: cell.dataset.number ?? "",',
      "        },",
      "        cell,",
      "      );",
      "    });",
      "  }",
    ].join("\n"),
  },
  {
    id: "config-ts",
    file: "src/config.ts & astro.config.mjs (Dedicated Elementa Domain Launch)",
    summary:
      "Switches generic 'Periodic Table' branding and subpath '/apps/periodic-table/' to standalone Elementa brand & root base '/' once the dedicated domain is provisioned.",
    code: [
      "// astro.config.mjs",
      "export default defineConfig({",
      '  site: "https://elementa.smolkin.org", // or dedicated domain e.g. https://elementa.chem',
      '  base: "/",',
      '  trailingSlash: "always",',
      '  output: "static",',
      '  build: { format: "directory" },',
      '  prefetch: { prefetchAll: true, defaultStrategy: "hover" },',
      "  integrations: [sitemap()],",
      "});",
      "",
      "// src/config.ts",
      "export const SITE = {",
      '  url: "https://elementa.smolkin.org",',
      '  name: "Elementa",',
      '  shortName: "Elementa",',
      '  title: "Elementa — Interactive Periodic Table, Atomic Trends & Chemistry Reference",',
      "  description:",
      '    "Explore all 118 chemical elements with verified IUPAC/NIST data, non-repetitive chemical profiles, Bohr shell diagrams, side-by-side comparison, and active-recall mastery.",',
      '  author: "Michael Smolkin",',
      '  authorUrl: "https://www.smolkin.org",',
      '  copyright: "Copyright 2025 Smolk Apps",',
      '  themeColor: "#0e1116",',
      '  locale: "en",',
      "} as const;",
    ].join("\n"),
  },
];

export default function LaunchBlueprint() {
  const [copiedId, setCopiedId] = useState(null);

  const copyCode = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-br from-[#161e2e] via-[#121824] to-[#0d1118] border border-[#2c374b] p-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[#ffd43b]">
            <Rocket className="w-4 h-4" />
            <span>Owner Documentation — Strategy, SEO Launch &amp; Astro Reintegration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Elementa Owner Documentation: Diagnosis, Launch Plan &amp; Astro 5 Patches
          </h1>
          <p className="text-sm text-[#aeb8c4] max-w-4xl leading-relaxed">
            Grounded in a complete audit of all 51 tracked files from canonical GitHub commit{" "}
            <code className="font-mono text-white">800162f741c30c34afcd2ad9a7d70794671f151c</code> and pending local
            crawlability commit <code className="font-mono text-white">5b0c592</code>. Distinguishes sourced facts,
            testable market hypotheses, and unverified estimates.
          </p>
        </section>

        {/* 1. Diagnosis: Sourced Facts vs. Hypotheses */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ffa94d]" />
            <span>1. Product &amp; Technical Diagnosis (Evidence Audit)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#4dabf7]/15 text-[#4dabf7]">
                Sourced Facts (Verified in Repo)
              </span>
              <ul className="text-xs text-[#aeb8c4] space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Canonical Source (<code className="text-white">800162f</code>):</strong> Astro 5 static build
                  emitting 118 directory-format element pages, 1200×630 PNG OG cards via Sharp, JSON-LD, RSS, sitemap,
                  roving-tabindex keyboard grid nav, and <code className="text-white">/compare/?ids=</code>.
                </li>
                <li>
                  <strong>Repetitive Prose Defect:</strong> In <code className="text-white">src/lib/article.ts</code>,{" "}
                  <code className="text-white">summary</code> and <code className="text-white">overview</code> repeat
                  the exact same classification, group/period, and highlight clause verbatim, while{" "}
                  <code className="text-white">structure</code> restates numbers already in the facts table with zero
                  external scientific citations.
                </li>
                <li>
                  <strong>Split Origin / Crawlability Defect:</strong> Live aliases (
                  <code className="text-white">periodic-table-seo-element-pages.smolkapps.com</code> and{" "}
                  <code className="text-white">.apps.smolkin.org</code>) render <code className="text-white">&lt;button&gt;</code>{" "}
                  cells instead of <code className="text-white">&lt;a href&gt;</code> links, while{" "}
                  <code className="text-white">astro.config.mjs</code> hardcodes{" "}
                  <code className="text-white">site: &quot;https://smolkin.org&quot;</code> with{" "}
                  <code className="text-white">base: &quot;/apps/periodic-table/&quot;</code> and{" "}
                  <code className="text-white">og-default.svg</code> references unprovisioned{" "}
                  <code className="text-white">elements.smolkin.org</code>.
                </li>
                <li>
                  <strong>Patch <code className="text-white">5b0c592</code> Conflict:</strong> Directly applying{" "}
                  <code className="text-white">5b0c592</code> would overwrite <code className="text-white">800162f</code>
                  &apos;s newer roving-tabindex keyboard nav and live filter status unless merged carefully.
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#ffd43b]/15 text-[#ffd43b]">
                Competitor &amp; Demand Hypotheses
              </span>
              <ul className="text-xs text-[#aeb8c4] space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Incumbent Landscape:</strong> Ptable.com, RSC Visual Elements, PubChem, and WebElements
                  dominate generic single-element head terms (<code className="text-white">&quot;iron periodic table&quot;</code>).
                </li>
                <li>
                  <strong>Where Incumbents Are Weak:</strong> Incumbents either serve dense raw data tables (PubChem,
                  WebElements) or lack an integrated{" "}
                  <strong>Compare → Explainable Trend → Active Recall Quiz → Saved Study Deck</strong> loop on mobile.
                </li>
                <li>
                  <strong>High-Intent Search Wedge:</strong> Students and teachers frequently search comparative and
                  explanatory queries (<code className="text-white">&quot;iron vs gold properties&quot;</code>,{" "}
                  <code className="text-white">&quot;why is chromium [Ar] 3d5 4s1&quot;</code>,{" "}
                  <code className="text-white">&quot;period 2 electronegativity trend&quot;</code>) where Elementa&apos;s
                  shareable comparison and trend cards directly answer the query.
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-[#131822] border border-[#242c38] p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#69db7c]/15 text-[#69db7c]">
                Retain vs. Cut &amp; Revenue Path
              </span>
              <ul className="text-xs text-[#aeb8c4] space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Retain:</strong> Astro 5 static HTML generation, 18-col explicit CSS grid (preventing the
                  Oganesson/Actinium collapse bug), build-time PNG OG cards, <code className="text-white">verify-build.mjs</code>{" "}
                  gate, and Vitest suite.
                </li>
                <li>
                  <strong>Cut / Avoid:</strong> Do NOT generate 6,903 thin programmatic pair pages ({" "}
                  <code className="text-white">118 × 117 / 2</code>) — search engines penalize near-duplicate thin
                  combinatorial pages. Keep <code className="text-white">/compare/?ids=</code> dynamic and index only
                  118 rich element pages + 10 curated category/comparison hubs.
                </li>
                <li>
                  <strong>First Achievable Revenue Path:</strong> Keep core reference 100% free and ad-light. Monetize
                  via <strong>Elementa Study &amp; Classroom Pack</strong> (printable PDF quiz/worksheet generator with
                  answer keys for teachers + AP/IB/GCSE exam study decks + cloud mastery sync). No live payment provider
                  is wired in this private prototype per project boundaries.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Hybrid Architecture: Astro Static SEO + Companion App */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#4f9dff]" />
            <span>2. Architecture Boundary: What Stays in Astro vs. Companion Flows</span>
          </h2>
          <div className="rounded-xl bg-[#131822] border border-[#242c38] overflow-hidden">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#161c27] border-b border-[#242c38] text-[#8b98a9] font-mono text-xs">
                  <th className="py-3 px-4">Surface / Feature</th>
                  <th className="py-3 px-4">Owner Layer</th>
                  <th className="py-3 px-4">Why &amp; Least-Cost Integration Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242c38] text-xs">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">
                    <code>/</code>, <code>/elements/</code>, <code>/element/[slug]/</code>, <code>/og/[slug].png</code>,{" "}
                    <code>sitemap</code>, <code>rss.xml</code>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#69db7c]">Astro 5 Static Build</td>
                  <td className="py-3 px-4 text-[#aeb8c4]">
                    Zero-JS crawlability, instant TTFB on CDN, prerendered <code>ChemicalSubstance</code> JSON-LD and
                    Sharp PNG social cards. Never replace this public surface with a client-only SPA.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">
                    Bohr Shell &amp; Subshell Visualizer + Period/Group Trend Charts
                  </td>
                  <td className="py-3 px-4 font-mono text-[#7bb6ff]">Shared Pure TS/JS Module</td>
                  <td className="py-3 px-4 text-[#aeb8c4]">
                    Deterministic pure functions (<code>parseShellsAndSubshells(electronConfig)</code>) can render
                    static SVG at build time inside <code>ArticleBody.astro</code> AND hydrate interactively in the
                    companion app.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">
                    Active-Recall Quiz, Spaced Mastery, Personal Notes &amp; Teacher Worksheet Generator
                  </td>
                  <td className="py-3 px-4 font-mono text-[#ffd43b]">Companion App / Island</td>
                  <td className="py-3 px-4 text-[#aeb8c4]">
                    Stateful user-specific flows live in the companion app (or mount at <code>/study/</code> /{" "}
                    <code>app.elementa...</code>) using <code>localStorage</code> first + optional cloud entity sync.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Dedicated Domain Launch Checklist & PWA vs Native Evaluation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#4f9dff]" />
              <span>3. Dedicated Domain Launch &amp; Redirect Plan</span>
            </h2>
            <ol className="text-xs text-[#aeb8c4] space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                <strong>Single Canonical Origin:</strong> Set <code className="text-white">site</code> in{" "}
                <code className="text-white">astro.config.mjs</code> and <code className="text-white">SITE.url</code> in{" "}
                <code className="text-white">src/config.ts</code> to the single chosen root origin, with{" "}
                <code className="text-white">base: &quot;/&quot;</code>. Re-run{" "}
                <code className="text-white">npm run build &amp;&amp; npm run verify</code> so all 118 canonicals,{" "}
                <code className="text-white">og:url</code>, <code className="text-white">og:image</code>, JSON-LD, and{" "}
                <code className="text-white">sitemap-index.xml</code> match 100%.
              </li>
              <li>
                <strong>301 Redirects from Legacy Aliases:</strong> Configure 301 permanent redirects preserving path
                and query string (<code className="text-white">$request_uri</code>) from{" "}
                <code className="text-white">periodic-table-seo-element-pages.smolkapps.com/*</code>,{" "}
                <code className="text-white">periodic-table-seo-element-pages.apps.smolkin.org/*</code>, and{" "}
                <code className="text-white">smolkin.org/apps/periodic-table/*</code> to the new canonical origin. Update
                the portfolio link on <code className="text-white">smolkapps.com</code>.
              </li>
              <li>
                <strong>Search Console &amp; Attribution:</strong> Submit <code className="text-white">/sitemap-index.xml</code>{" "}
                in Google Search Console, inspect 5 representative element URLs (H, O, Fe, Au, Og), and track
                non-PII activation events (<code className="text-white">quiz_completed</code>,{" "}
                <code className="text-white">worksheet_printed</code>, <code className="text-white">compare_shared</code>).
              </li>
            </ol>
          </section>

          <section className="rounded-xl bg-[#131822] border border-[#242c38] p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#69db7c]" />
              <span>4. Installable Offline-First PWA vs. Native iOS/Android</span>
            </h2>
            <ul className="text-xs text-[#aeb8c4] space-y-2.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Why Offline-First PWA Wins Now:</strong> The entire 118-element dataset + article generator +
                Bohr SVG visualizer is under 120 KB gzipped. With <code className="text-white">site.webmanifest</code>{" "}
                (already present in <code className="text-white">public/</code>) + a static Service Worker precaching
                HTML/JS/CSS and <code className="text-white">localStorage</code> study progress, students get 100%
                offline classroom/exam-prep access on iOS, Android, Chromebook, and desktop at $0 store cost.
              </li>
              <li>
                <strong>Native Store Realities &amp; Costs:</strong> Apple App Store ($99/yr developer fee + Mac/Xcode build
                signing + Guideline 4.2 Minimum Functionality review which rejects thin web wrappers) and Google Play
                ($25 fee + 14-day closed testing requirement + SDK maintenance) add ongoing overhead.
              </li>
              <li>
                <strong>Recommended Gate:</strong> Ship the installable offline PWA first; package via Capacitor/native
                only after verifying organic search retention and paid Study Pack conversion on web.
              </li>
            </ul>
          </section>
        </div>

        {/* 4. Copyable Astro Reintegration Code Patches */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#7bb6ff]" />
            <span>5. Drop-In Astro 5 Reintegration Patches (Ready to Apply)</span>
          </h2>
          <div className="space-y-4">
            {PATCH_SNIPPETS.map((snip) => (
              <div key={snip.id} className="rounded-xl bg-[#131822] border border-[#242c38] overflow-hidden">
                <div className="px-4 py-3 bg-[#161c27] border-b border-[#242c38] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <code className="text-xs font-mono font-bold text-[#7bb6ff]">{snip.file}</code>
                    <p className="text-xs text-[#8b98a9] mt-0.5">{snip.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(snip.id, snip.code)}
                    className="px-3 py-1.5 rounded-lg bg-[#1c232d] border border-[#2a323d] hover:border-[#4f9dff] text-xs font-medium text-white flex items-center gap-1.5"
                  >
                    {copiedId === snip.id ? <Check className="w-3.5 h-3.5 text-[#69db7c]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === snip.id ? "Copied" : "Copy Patch"}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-[#e9edf2] overflow-x-auto bg-[#0b0e14] leading-relaxed">
                  {snip.code}
                </pre>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}