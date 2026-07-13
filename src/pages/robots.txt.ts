import type { APIContext } from "astro";
import { absUrl } from "../config";

export function GET(_context: APIContext) {
  // absUrl() includes the deployment base, so the Sitemap URL points at
  // /apps/periodic-table/sitemap-index.xml (the path Astro actually emits it
  // to) rather than the origin root, where it 404s.
  const body = `User-agent: *
Allow: /

Sitemap: ${absUrl("sitemap-index.xml")}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
