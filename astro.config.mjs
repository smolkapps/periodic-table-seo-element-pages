import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static-generated build: every element gets its own prerendered HTML page so
// crawlers see full content without needing prerender.io. This is the core of
// the SEO enhancement (replaces the old client-rendered Tomcat-served app).
export default defineConfig({
  // Deployed under a subpath of the main site, not a dedicated subdomain:
  //   https://www.smolkin.org/apps/periodic-table/
  // `site` is the ORIGIN only; `base` is the subpath. Astro prefixes every
  // internal link/asset with `base`, and absolute in-head/JSON-LD URLs are
  // composed as `<site><base><path>` via `absUrl()` in src/config.ts. Keep
  // `site` bare `smolkin.org` (no `www`) to match the deployed canonical host.
  site: "https://smolkin.org",
  base: "/apps/periodic-table/",
  // Directory format + always-trailing-slash keeps canonical, og:url, JSON-LD
  // URLs, and the on-disk path all consistent (/element/iron/).
  trailingSlash: "always",
  output: "static",
  build: { format: "directory" },
  // Hover-prefetch internal links (still fully static — just fetches the next
  // page's HTML early) so moving between element pages feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [sitemap()],
});
