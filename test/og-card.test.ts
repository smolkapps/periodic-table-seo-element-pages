/**
 * Unit tests for the Open Graph card template (src/lib/og-card.ts) — the SVG
 * that gets rasterized into each element's /og/<slug>.png social image.
 */
import { describe, it, expect } from "vitest";
import {
  ogCardSvg,
  wrapText,
  escapeXml,
  OG_WIDTH,
  OG_HEIGHT,
} from "../src/lib/og-card";
import { ELEMENTS, getElementBySlug, CATEGORY_META } from "../src/lib/elements";

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });
});

describe("wrapText", () => {
  it("wraps at word boundaries within the character budget", () => {
    expect(wrapText("one two three four", 9, 5)).toEqual([
      "one two",
      "three",
      "four",
    ]);
  });

  it("returns a single line when the text fits", () => {
    expect(wrapText("short", 20, 3)).toEqual(["short"]);
  });

  it("truncates with an ellipsis when the text exceeds maxLines", () => {
    const lines = wrapText("aaa bbb ccc ddd eee fff", 7, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]!.endsWith("…")).toBe(true);
  });

  it("never emits more than maxLines lines for any element highlight", () => {
    for (const el of ELEMENTS) {
      const lines = wrapText(`${el.name} placeholder text`, 46, 3);
      expect(lines.length).toBeLessThanOrEqual(3);
    }
  });

  it("puts an over-long word on its own line rather than looping", () => {
    expect(wrapText("supercalifragilistic yes", 10, 3)).toEqual([
      "supercalifragilistic",
      "yes",
    ]);
  });
});

describe("ogCardSvg", () => {
  it("renders a 1200x630 card for every element with its core facts", () => {
    for (const el of ELEMENTS) {
      const svg = ogCardSvg(el);
      expect(svg).toContain(`width="${OG_WIDTH}"`);
      expect(svg).toContain(`height="${OG_HEIGHT}"`);
      expect(svg).toContain(`>${escapeXml(el.symbol)}</text>`);
      expect(svg).toContain(escapeXml(el.name));
      expect(svg).toContain(`Element ${el.number}`);
      // Category accent colour is applied.
      expect(svg).toContain(CATEGORY_META[el.category].hex);
    }
  });

  it("brackets the mass for synthetic elements", () => {
    const og = getElementBySlug("oganesson")!;
    expect(ogCardSvg(og)).toContain("[294]");
  });

  it("shows f-block instead of a group for lanthanides/actinides", () => {
    const ce = getElementBySlug("cerium")!;
    expect(ogCardSvg(ce)).toContain("f-block");
    const fe = getElementBySlug("iron")!;
    expect(ogCardSvg(fe)).toContain("Group 8");
  });

  it("produces well-formed XML for every element (no raw ampersands)", () => {
    for (const el of ELEMENTS) {
      const svg = ogCardSvg(el);
      // Any & must be part of a known entity.
      const stray = svg.replace(/&(amp|lt|gt|quot|apos);/g, "");
      expect(stray.includes("&"), `stray & in ${el.slug}`).toBe(false);
    }
  });
});
