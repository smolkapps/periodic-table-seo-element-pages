import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE, absUrl } from "../config";
import { ELEMENTS } from "../lib/elements";
import { buildArticle } from "../lib/article";

export function GET(_context: APIContext) {
  // Use the origin+base as the RSS `site` and keep item links relative (no
  // leading slash) so @astrojs/rss resolves them UNDER /apps/periodic-table/
  // rather than at the origin root. (context.site is the origin only and would
  // drop the base.)
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: absUrl(),
    items: ELEMENTS.map((el) => ({
      title: `${el.number}. ${el.name} (${el.symbol})`,
      description: buildArticle(el).summary,
      link: `element/${el.slug}/`,
    })),
  });
}
