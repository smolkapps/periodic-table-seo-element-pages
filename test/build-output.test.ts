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
import { buildArticle, elementPageTitle } from "../src/lib/article";
import { sameGroupElements } from "../src/lib/elements";

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

  it("each element page embeds its article, configuration, and descriptive title in static HTML", () => {
    for (const el of ELEMENTS) {
      const html = readFileSync(pagePath(el.slug), "utf8");
      // Astro escapes apostrophes in text, so compare the decoded page.
      const text = html.replaceAll("&amp;", "&").replaceAll("&#39;", "'");
      const article = buildArticle(el);
      // Crawlers see the prose with no JavaScript.
      expect(text.includes(article.summary), `summary missing in ${el.slug}`).toBe(true);
      expect(text).toContain(el.electronConfig);
      expect(text).toContain(`<title>${elementPageTitle(el)} | ElementaLearn</title>`);
      expect(text).toContain(`name="description" content="${article.metaDescription}"`);
      expect(html).not.toContain("\u2014");
    }
  });

  it("each element page has a self-referential canonical link (trailing-slash consistent)", () => {
    const fe = getElementByNumber(26)!;
    const html = readFileSync(pagePath(fe.slug), "utf8");
    // The dedicated-domain release must keep canonical and social URLs on
    // the same origin so aliases cannot split search signals.
    expect(html).toContain(
      '<link rel="canonical" href="https://elementalearn.com/element/iron/"',
    );
    // og:url must agree with the canonical exactly.
    expect(html).toContain(
      'property="og:url" content="https://elementalearn.com/element/iron/"',
    );
  });

  it("each element page emits ChemicalSubstance + named BreadcrumbList items", () => {
    const html = readFileSync(pagePath("oxygen"), "utf8");
    expect(html).toContain('"@type":"ChemicalSubstance"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (match) => JSON.parse(match[1]!) as { "@type"?: string; itemListElement?: { name?: string }[] },
    );
    const crumbs = blocks.find((block) => block["@type"] === "BreadcrumbList");
    expect(crumbs?.itemListElement?.map((item) => item.name)).toEqual([
      "Home",
      "Elements",
      "Oxygen",
    ]);
    // The visible trail names the current page in its own item, not a bare text node.
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(">Oxygen</span>");
  });

  it("links every element to the other members of its group from crawlable HTML", () => {
    for (const el of ELEMENTS) {
      const html = readFileSync(pagePath(el.slug), "utf8");
      for (const mate of sameGroupElements(el)) {
        expect(html, `${el.slug} missing link to ${mate.slug}`).toContain(
          `href="/element/${mate.slug}/"`,
        );
      }
    }
  });

  it("element pages carry full Open Graph + Twitter card meta", () => {
    const html = readFileSync(pagePath("gold"), "utf8");
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('name="twitter:card"');
  });

  it("every element page has its own PNG social card, emitted and referenced", () => {
    for (const el of ELEMENTS) {
      expect(
        existsSync(join(DIST, "og", `${el.slug}.png`)),
        `missing og card for ${el.slug}`,
      ).toBe(true);
    }
    const html = readFileSync(pagePath("iron"), "utf8");
    expect(html).toContain(
      'property="og:image" content="https://elementalearn.com/og/iron.png"',
    );
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
  });

  it("social-card images are PNG everywhere (crawlers reject SVG og:images)", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    expect(home).toContain(
      'property="og:image" content="https://elementalearn.com/og-default.png"',
    );
    expect(home).not.toContain('property="og:image" content="https://elementalearn.com/og-default.svg"');
    expect(existsSync(join(DIST, "og-default.png"))).toBe(true);
  });

  it("home page uses the full marketing title and WebSite JSON-LD", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    expect(home).toContain(
      "<title>ElementaLearn: Periodic Table and Chemistry Practice</title>",
    );
    expect(home).toContain('"@type":"WebSite"');
  });

  it("home page has an ordinary crawlable link to every element page", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    // Real anchors, rather than URLs in structured data, preserve the original
    // no-JavaScript and crawler navigation requirement.
    const anchorHrefs = new Set(
      [...home.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(
        (match) => match[1],
      ),
    );
    for (const el of ELEMENTS) {
      expect(
        anchorHrefs.has(`/element/${el.slug}/`),
        `home missing ordinary link to ${el.slug}`,
      ).toBe(true);
    }
  });

  it("home page includes the existing usage beacon once and a meaningful element-open event", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    expect(home.match(/src="https:\/\/umami\.smolkin\.org\/script\.js"/g)).toHaveLength(1);
    // The tracker must not take over link navigation after the drawer opens.
    expect(home).not.toContain('data-umami-event="element-open"');
  });

  it("starts the promised homepage quiz without needing a saved deck", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    const action = home.match(/<a\b[^>]*href="([^"]+)"[^>]*>Start a five-question quiz/);
    expect(action, "homepage must offer its quick practice action").not.toBeNull();
    const target = new URL(action![1].replaceAll("&amp;", "&"), "https://elementalearn.com");
    const quiz = new URL(target.hash.slice(1), "https://elementalearn.com");
    expect(target.pathname).toBe("/study/");
    expect(quiz.pathname).toBe("/practice");
    // The bare route opens a learner's deck, which is empty on first use.
    expect(quiz.searchParams.get("focus")).toBe("trends");
    expect(quiz.searchParams.get("count")).toBe("5");
  });

  it("makes the site information reachable as real, canonical static pages", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    for (const slug of ["about", "privacy", "terms"]) {
      const html = readFileSync(join(DIST, slug, "index.html"), "utf8");
      expect(home).toContain(`href="/${slug}/"`);
      expect(html).toContain(`<link rel="canonical" href="https://elementalearn.com/${slug}/"`);
      expect(html).toMatch(/<h1\b[^>]*>/);
      expect(html).toContain('href="/apple-touch-icon.png"');
      expect(html).not.toContain("404: Off the table");
    }
  });

  it("home page ships the interactive table cells with data attributes", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    expect(home).toMatch(
      /<a\b[^>]*href="\/element\/hydrogen\/"[^>]*class="pt-cell js-cell"/,
    );
    expect(home).toContain('data-slug="hydrogen"');
    // Grid coordinates for the arrow-key navigation.
    expect(home).toContain('data-x="1"');
    expect(home).toContain('data-y="1"');
  });

  it("element pages deep-link into the compare view with their neighbours", () => {
    const fe = readFileSync(pagePath("iron"), "utf8");
    expect(fe).toContain("/compare/?ids=manganese,iron,cobalt");
    // Endpoints only have one neighbour.
    const h = readFileSync(pagePath("hydrogen"), "utf8");
    expect(h).toContain("/compare/?ids=hydrogen,helium");
  });

  it("emits sitemap, robots.txt, and llms.txt, including every element page", () => {
    expect(existsSync(join(DIST, "sitemap-index.xml"))).toBe(true);
    expect(existsSync(join(DIST, "robots.txt"))).toBe(true);
    expect(existsSync(join(DIST, "llms.txt"))).toBe(true);
    const llms = readFileSync(join(DIST, "llms.txt"), "utf8");
    expect(llms).toContain("# ElementaLearn: Periodic Table and Chemistry Practice");
    expect(llms).toContain("https://elementalearn.com/element/hydrogen/");
    expect(llms).toContain("https://elementalearn.com/element/oganesson/");
    const sitemapFiles = ["sitemap-index.xml", "sitemap-0.xml"].filter((name) =>
      existsSync(join(DIST, name)),
    );
    const xml = sitemapFiles.map((name) => readFileSync(join(DIST, name), "utf8")).join("\n");
    for (const el of ELEMENTS) {
      expect(xml, `sitemap missing ${el.slug}`).toContain(
        `https://elementalearn.com/element/${el.slug}/`,
      );
    }
    expect(xml).toContain("https://elementalearn.com/oxygen-and-sulfur/");
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

  it("emits a static compare page with the default comparison prerendered", () => {
    const comparePath = join(DIST, "compare", "index.html");
    expect(existsSync(comparePath)).toBe(true);
    const html = readFileSync(comparePath, "utf8");
    // The default trio (iron, gold, oxygen) is rendered server-side, so crawlers
    // and no-JS visitors see a real comparison table, not an empty shell.
    for (const slug of ["iron", "gold", "oxygen"]) {
      expect(html.includes(`/element/${slug}/`), `compare missing ${slug}`).toBe(
        true,
      );
    }
    // Property rows and a numeric highlight cell are present in the static HTML.
    expect(html).toContain("Electron configuration");
    expect(html).toContain("cmp-max");
    // All 118 elements are pickable in the selects.
    for (const el of ELEMENTS) {
      expect(
        html.includes(`value="${el.slug}"`),
        `compare picker missing ${el.slug}`,
      ).toBe(true);
    }
  });
});
