import { describe, it, expect } from "vitest";
import { ELEMENTS, getElementByNumber } from "../src/lib/elements";
import {
  buildArticle,
  formatMass,
  discoveryPhrase,
  highlightFor,
} from "../src/lib/article";

describe("formatMass", () => {
  it("leaves stable element masses unbracketed", () => {
    expect(formatMass(getElementByNumber(26)!)).toBe("55.845"); // Iron
  });
  it("brackets synthetic/unstable element masses with a rounded mass number", () => {
    expect(formatMass(getElementByNumber(118)!)).toBe("[294]"); // Oganesson
    expect(formatMass(getElementByNumber(43)!)).toBe("[98]"); // Technetium
  });
});

describe("discoveryPhrase", () => {
  it("uses 'known since antiquity' for ancient elements", () => {
    expect(discoveryPhrase(getElementByNumber(79)!)).toBe(
      "has been known since antiquity",
    ); // Gold
  });
  it("names the year and discoverer for modern elements", () => {
    const phrase = discoveryPhrase(getElementByNumber(2)!); // Helium
    expect(phrase).toContain("1868");
    expect(phrase).toContain("Pierre Janssen");
  });
});

describe("highlightFor", () => {
  it("returns the curated highlight for a known element", () => {
    expect(highlightFor(getElementByNumber(1)!)).toContain("lightest");
  });
  it("falls back to a generic highlight only if curated text is absent", () => {
    // All 118 are curated, so the fallback should never actually trigger; assert
    // every element has non-empty highlight text.
    for (const el of ELEMENTS) {
      expect(highlightFor(el).length).toBeGreaterThan(5);
    }
  });
});

describe("buildArticle", () => {
  it("produces a summary, three sections, and a facts table for every element", () => {
    for (const el of ELEMENTS) {
      const article = buildArticle(el);
      expect(article.summary.length).toBeGreaterThan(40);
      expect(article.sections).toHaveLength(3);
      for (const s of article.sections) {
        expect(s.heading.length).toBeGreaterThan(0);
        expect(s.body.length).toBeGreaterThan(30);
      }
      expect(article.facts.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("is deterministic — same element yields identical output", () => {
    const a = buildArticle(getElementByNumber(8)!);
    const b = buildArticle(getElementByNumber(8)!);
    expect(a).toEqual(b);
  });

  it("summary contains the element name, symbol, and number", () => {
    const fe = getElementByNumber(26)!;
    const { summary } = buildArticle(fe);
    expect(summary).toContain("Iron");
    expect(summary).toContain("Fe");
    expect(summary).toContain("26");
  });

  it("overview section mentions phase and category", () => {
    const hg = getElementByNumber(80)!; // Mercury, liquid
    const overview = buildArticle(hg).sections[0]!.body;
    expect(overview).toContain("liquid");
    expect(overview).toContain("transition metal");
  });

  it("atomic-structure section reports the correct proton/electron count and configuration", () => {
    const o = getElementByNumber(8)!;
    const structure = buildArticle(o).sections[1]!.body;
    expect(structure).toContain("8 proton");
    expect(structure).toContain("8 electron");
    expect(structure).toContain("[He] 2s2 2p4");
  });

  it("uses singular 'proton'/'electron' for hydrogen", () => {
    const h = getElementByNumber(1)!;
    const structure = buildArticle(h).sections[1]!.body;
    expect(structure).toContain("1 proton in");
    expect(structure).toContain("1 electron");
    expect(structure).not.toContain("1 protons");
  });

  it("notes synthetic isotopes in the structure section", () => {
    const og = getElementByNumber(118)!;
    const structure = buildArticle(og).sections[1]!.body;
    expect(structure).toContain("no stable isotope");
  });

  it("discovery section relates an element to its neighbours by symbol", () => {
    const fe = buildArticle(getElementByNumber(26)!).sections[2]!.body;
    expect(fe).toContain("Manganese (Mn)");
    expect(fe).toContain("Cobalt (Co)");
  });

  it("handles the first element (no previous neighbour)", () => {
    const h = buildArticle(getElementByNumber(1)!).sections[2]!.body;
    expect(h).toContain("first element");
    expect(h).toContain("Helium (He)");
  });

  it("handles the last element (no next neighbour)", () => {
    const og = buildArticle(getElementByNumber(118)!).sections[2]!.body;
    expect(og).toContain("Tennessine (Ts)");
    expect(og).toContain("heaviest element");
  });

  it("facts table includes the canonical fields", () => {
    const labels = buildArticle(getElementByNumber(6)!).facts.map((f) => f.label);
    expect(labels).toContain("Atomic number");
    expect(labels).toContain("Electron configuration");
    expect(labels).toContain("Phase at STP");
    expect(labels).toContain("Discovered");
  });
});
