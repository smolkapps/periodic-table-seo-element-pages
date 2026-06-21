import type { APIContext } from "astro";
import { SITE } from "../config";

export function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE.url);
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL("sitemap-index.xml", site).href}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
