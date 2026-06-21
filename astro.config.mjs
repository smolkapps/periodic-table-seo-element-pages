import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static-generated build: every element gets its own prerendered HTML page so
// crawlers see full content without needing prerender.io. This is the core of
// the SEO enhancement (replaces the old client-rendered Tomcat-served app).
export default defineConfig({
  site: "https://elements.smolkin.org",
  // Directory format + always-trailing-slash keeps canonical, og:url, JSON-LD
  // URLs, and the on-disk path all consistent (/element/iron/).
  trailingSlash: "always",
  output: "static",
  build: { format: "directory" },
  integrations: [sitemap()],
});
