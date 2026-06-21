import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../config";
import { ELEMENTS } from "../lib/elements";
import { buildArticle } from "../lib/article";

export function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE.url);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site,
    items: ELEMENTS.map((el) => ({
      title: `${el.number}. ${el.name} (${el.symbol})`,
      description: buildArticle(el).summary,
      link: `/element/${el.slug}`,
    })),
  });
}
