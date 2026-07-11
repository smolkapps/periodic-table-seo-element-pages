/**
 * Per-element Open Graph card — the SVG template rasterized to a 1200×630 PNG
 * at build time (src/pages/og/[slug].png.ts).
 *
 * Most social crawlers (Facebook, X/Twitter, Slack, iMessage) refuse SVG
 * og:images, so every element page gets its own prerendered PNG card: the
 * element's tile in its category colour, its name, classification, and the
 * curated highlight. Pure string-building lives here so the layout is
 * unit-testable without rasterizing anything.
 */

import { type Element, CATEGORY_META, categoryLabel } from "./elements";
import { formatMass, highlightFor } from "./article";
import { SITE } from "../config";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Escape a string for safe interpolation into SVG/XML text content. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Greedy word-wrap into at most `maxLines` lines of roughly `maxChars`
 * characters. The final line is ellipsised if the text doesn't fit. Words
 * longer than a line are placed on their own line rather than split.
 */
export function wrapText(
  text: string,
  maxChars: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const lines: string[] = [];
  let line = "";
  let truncated = false;
  for (const word of words) {
    const candidate = line.length === 0 ? word : `${line} ${word}`;
    if (candidate.length <= maxChars || line.length === 0) {
      line = candidate;
    } else if (lines.length < maxLines - 1) {
      lines.push(line);
      line = word;
    } else {
      truncated = true;
      break;
    }
  }
  if (line.length > 0) lines.push(line);
  if (truncated && lines.length > 0) {
    lines[lines.length - 1] =
      lines[lines.length - 1]!.replace(/[\s.,;:]*$/, "") + "…";
  }
  return lines;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

/** Build the 1200×630 SVG markup for one element's social card. */
export function ogCardSvg(element: Element): string {
  const accent = CATEGORY_META[element.category].hex;
  const name = escapeXml(element.name);
  // Long names (Rutherfordium, Praseodymium…) get a smaller display size so
  // they never overflow the right-hand column.
  const nameSize = element.name.length > 11 ? 66 : 84;
  const highlight = capitalize(highlightFor(element)) + ".";
  const highlightLines = wrapText(highlight, 46, 3);
  const groupText =
    element.group !== null ? `Group ${element.group}` : "f-block";
  const factLine = escapeXml(
    `Element ${element.number} · ${groupText} · Period ${element.period}`,
  );
  const host = new URL(SITE.url).host;

  const highlightTspans = highlightLines
    .map(
      (line, i) =>
        `<text x="520" y="${408 + i * 44}" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#aeb8c4">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#161b22"/>
      <stop offset="1" stop-color="#0e1116"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#0e1116"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>

  <!-- Element tile -->
  <rect x="80" y="135" width="360" height="360" rx="24" fill="#1c232d" stroke="${accent}" stroke-width="6"/>
  <text x="112" y="200" font-family="DejaVu Sans, sans-serif" font-size="44" fill="#7a8694">${element.number}</text>
  <text x="260" y="368" font-family="DejaVu Sans, sans-serif" font-size="150" font-weight="800" fill="#e9edf2" text-anchor="middle">${escapeXml(element.symbol)}</text>
  <text x="260" y="452" font-family="DejaVu Sans Mono, monospace" font-size="34" fill="#aeb8c4" text-anchor="middle">${escapeXml(formatMass(element))}</text>

  <!-- Element name + classification -->
  <text x="520" y="238" font-family="DejaVu Sans, sans-serif" font-size="${nameSize}" font-weight="800" fill="#e9edf2">${name}</text>
  <text x="520" y="298" font-family="DejaVu Sans, sans-serif" font-size="38" font-weight="600" fill="${accent}">${escapeXml(categoryLabel(element.category))}</text>
  <text x="520" y="350" font-family="DejaVu Sans, sans-serif" font-size="32" fill="#aeb8c4">${factLine}</text>
  ${highlightTspans}

  <!-- Footer -->
  <text x="520" y="566" font-family="DejaVu Sans, sans-serif" font-size="27" fill="#4f9dff">${escapeXml(host)} — ${escapeXml(SITE.name)}</text>
</svg>`;
}
