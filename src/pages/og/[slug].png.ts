/**
 * Build-time rasterization of the per-element Open Graph cards.
 *
 * Emits /og/<slug>.png (1200×630) for all 118 elements. Runs only at build —
 * the deployed site serves plain PNG files, so this stays fully static and
 * keyless. The SVG layout itself lives in ../../lib/og-card.ts where it is
 * unit-tested.
 */
import type { APIRoute } from "astro";
import sharp from "sharp";
import { ELEMENTS, type Element } from "../../lib/elements";
import { ogCardSvg } from "../../lib/og-card";

export function getStaticPaths() {
  return ELEMENTS.map((element) => ({
    params: { slug: element.slug },
    props: { element },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const element = (props as { element: Element }).element;
  const png = await sharp(Buffer.from(ogCardSvg(element))).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
