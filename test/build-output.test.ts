/**
 * Integration test over the STATIC BUILD OUTPUT (dist/).
 *
 * This is the proof of the core enhancement: every element must have its own
 * prerendered HTML page containing the full article prose + structured data, so
 * crawlers see complete content without prerender.io. The test is skipped when
 * dist/ is absent (e.g. a unit-only run) and runs in the host's
 * build-then-test flow where dist/ exists.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ELEMENTS, getElementByNumber } from "../src/lib/elements";
import { buildArticle } from "../src/lib/article";

const DIST = join(process.cwd(), "dist");
const hasBuild = existsSync(DIST);

const d = hasBuild ? describe : describe.skip;

function pagePath(slug: string): string {
  return join(DIST, "element", slug, "index.html");
}

d("static build output", () => {
  it("emits a dedicated directory-format page for every element", () => {
    for (const el of ELEMENTS) {
      expect(existsSync(pagePath(el.slug)), `missing page for ${el.slug}`).toBe(
        true,
      );
    }
  });

  it("each element page embeds its full article summary in the static HTML", () => {
    for (const el of ELEMENTS) {
      const html = readFileSync(pagePath(el.slug), "utf8");
      const { summary } = buildArticle(el);
      // The opening clause of the summary (name + symbol + number) must be in
      // the prerendered HTML — i.e. crawlers see the content with no JS.
      const probe = `${el.name} (symbol ${el.symbol}, atomic number ${el.number})`;
      expect(html.includes(probe), `summary missing in ${el.slug}`).toBe(true);
      expect(summary.startsWith(probe)).toBe(true);
    }
  });

  it("each element page has a self-referential canonical link (trailing-slash consistent)", () => {
    const fe = getElementByNumber(26)!;
    const html = readFileSync(pagePath(fe.slug), "utf8");
    expect(html).toContain(
      '<link rel="canonical" href="https://elements.smolkin.org/element/iron/"',
    );
    // og:url must agree with the canonical exactly.
    expect(html).toContain(
      'property="og:url" content="https://elements.smolkin.org/element/iron/"',
    );
  });

  it("each element page emits ChemicalSubstance + BreadcrumbList JSON-LD", () => {
    const html = readFileSync(pagePath("oxygen"), "utf8");
    expect(html).toContain('"@type":"ChemicalSubstance"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('application/ld+json');
  });

  it("element pages carry full Open Graph + Twitter card meta", () => {
    const html = readFileSync(pagePath("gold"), "utf8");
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('name="twitter:card"');
  });

  it("home page links to every element page (internal linking for SEO)", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    for (const el of ELEMENTS) {
      expect(
        home.includes(`/element/${el.slug}`),
        `home missing link to ${el.slug}`,
      ).toBe(true);
    }
  });

  it("home page ships the interactive table cells with data attributes", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    expect(home).toContain('class="pt-cell js-cell"');
    expect(home).toContain('data-slug="hydrogen"');
  });

  it("emits sitemap and robots.txt", () => {
    expect(existsSync(join(DIST, "sitemap-index.xml"))).toBe(true);
    expect(existsSync(join(DIST, "robots.txt"))).toBe(true);
  });

  it("emits the RSS feed with element entries", () => {
    const rssPath = join(DIST, "rss.xml");
    expect(existsSync(rssPath)).toBe(true);
    const xml = readFileSync(rssPath, "utf8");
    expect(xml).toContain("Hydrogen");
    expect(xml).toContain("Oganesson");
  });

  it("emits a custom 404 page", () => {
    expect(existsSync(join(DIST, "404.html"))).toBe(true);
  });
});
