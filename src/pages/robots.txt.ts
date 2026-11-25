import type { APIContext } from "astro";
import { absUrl } from "../config";

export function GET(_context: APIContext) {
  // absUrl() includes the deployment base, so the Sitemap URL points at
  // /apps/periodic-table/sitemap-index.xml (the path Astro actually emits it
  // to) rather than the origin root, where it 404s.
  const body = `User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${absUrl("sitemap-index.xml")}
# LLMs: ${absUrl("llms.txt")}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
