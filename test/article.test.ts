import { describe, it, expect } from "vitest";
import { ELEMENTS, getElementByNumber } from "../src/lib/elements";
import {
  buildArticle,
  formatMass,
  discoveryPhrase,
  highlightFor,
  elementPageTitle,
  metaDescriptionFor,
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
  it("produces a summary, three sections, trend facts, and sources for every element", () => {
    for (const el of ELEMENTS) {
      const article = buildArticle(el);
      expect(article.summary.length).toBeGreaterThan(20);
      expect(article.sections).toHaveLength(3);
      for (const s of article.sections) {
        expect(s.heading.length).toBeGreaterThan(0);
        expect(s.body.length).toBeGreaterThan(30);
      }
      expect(article.facts.length).toBeGreaterThanOrEqual(12);
      expect(article.citations).toHaveLength(4);
      expect(article.metaDescription.length).toBeGreaterThan(40);
      expect(article.metaDescription.length).toBeLessThanOrEqual(160);
      // Public copy must not use an em dash.
      const blob = `${article.summary} ${article.metaDescription} ${article.sections
        .map((s) => s.body)
        .join(" ")} ${article.facts.map((f) => f.value).join(" ")}`;
      expect(blob).not.toContain("\u2014");
    }
  });

  it("is deterministic: the same element yields identical output", () => {
    const a = buildArticle(getElementByNumber(8)!);
    const b = buildArticle(getElementByNumber(8)!);
    expect(a).toEqual(b);
  });

  it("states the curated use once, not again in the body", () => {
    for (const el of ELEMENTS) {
      const article = buildArticle(el);
      const highlight = highlightFor(el);
      const prose = [article.summary, ...article.sections.map((s) => s.body)].join(" ");
      const occurrences = prose.split(highlight).length - 1;
      expect(occurrences).toBe(1);
      expect(article.summary).toContain(el.name);
      expect(article.summary).not.toContain(el.electronConfig);
    }
  });

  it("uses a descriptive title and a config-led meta description", () => {
    const fe = getElementByNumber(26)!;
    expect(elementPageTitle(fe)).toBe(
      "Iron (Fe): Electron Configuration, Properties & Quiz",
    );
    const meta = metaDescriptionFor(fe);
    expect(meta).toContain("[Ar] 3d6 4s2");
    expect(meta).toContain("1.83");
    expect(meta).toContain("762.5");
    expect(meta.endsWith(".")).toBe(true);
  });

  it("place section mentions phase, category, and neighbours", () => {
    const hg = getElementByNumber(80)!; // Mercury, liquid
    const place = buildArticle(hg).sections[0]!.body;
    expect(place).toContain("liquid");
    expect(place).toContain("transition metal");
    expect(place).toContain("Gold (Au)");
    expect(place).toContain("Thallium (Tl)");
  });

  it("electron section reports the proton count, configuration, and recorded trends", () => {
    const cl = getElementByNumber(17)!;
    const structure = buildArticle(cl).sections[1]!.body;
    expect(structure).toContain("17 protons");
    expect(structure).toContain("17 electrons");
    expect(structure).toContain("[Ne] 3s2 3p5");
    expect(structure).toContain("3.16");
    expect(structure).toContain("1251.2 kJ/mol");
    expect(structure).toContain("102 pm");
    expect(structure).not.toContain("Aufbau exception");
  });

  it("uses singular 'proton'/'electron' for hydrogen", () => {
    const h = getElementByNumber(1)!;
    const structure = buildArticle(h).sections[1]!.body;
    expect(structure).toContain("1 proton");
    expect(structure).toContain("1 electron");
    expect(structure).not.toContain("1 protons");
    expect(structure).not.toContain("1 electrons");
  });

  it("notes real Aufbau exceptions without inventing one for iron", () => {
    const cr = buildArticle(getElementByNumber(24)!).sections[1]!.body;
    expect(cr).toContain("[Ar] 3d5 4s1");
    expect(cr).toContain("Aufbau exception");
    const cu = buildArticle(getElementByNumber(29)!).sections[1]!.body;
    expect(cu).toContain("[Ar] 3d10 4s1");
    expect(cu).toContain("Aufbau exception");
    const fe = buildArticle(getElementByNumber(26)!).sections[1]!.body;
    expect(fe).toContain("[Ar] 3d6 4s2");
    expect(fe).not.toContain("Aufbau exception");
  });

  it("says superheavy phases are predicted and gives no invented trend value", () => {
    const og = getElementByNumber(118)!;
    const article = buildArticle(og);
    expect(article.sections[0]!.body).toContain("prediction");
    expect(article.sections[2]!.body).toContain("no standard atomic weight");
    const en = article.facts.find((f) => f.label === "Pauling electronegativity")!;
    expect(en.value).toBe("Not established");
    const phase = article.facts.find((f) => f.label === "Phase at STP")!;
    expect(phase.value).toContain("predicted");
  });

  it("keeps CIAAW weights for thorium instead of a bracketed mass number", () => {
    const th = getElementByNumber(90)!;
    expect(formatMass(th)).toBe("232.04");
    const discovery = buildArticle(th).sections[2]!.body;
    expect(discovery).toContain("no stable isotopes");
    expect(discovery).toContain("232.04");
    expect(discovery).not.toContain("[232]");
  });

  it("place section relates an element to its neighbours by symbol", () => {
    const fe = buildArticle(getElementByNumber(26)!).sections[0]!.body;
    expect(fe).toContain("Manganese (Mn)");
    expect(fe).toContain("Cobalt (Co)");
  });

  it("handles the first element (no previous neighbour)", () => {
    const h = buildArticle(getElementByNumber(1)!).sections[0]!.body;
    expect(h).toContain("first element");
    expect(h).toContain("Helium (He)");
  });

  it("handles the last element (no next neighbour)", () => {
    const og = buildArticle(getElementByNumber(118)!).sections[0]!.body;
    expect(og).toContain("Tennessine (Ts)");
    expect(og).toContain("heaviest element");
  });

  it("facts table includes the canonical fields and recorded iron trends", () => {
    const facts = buildArticle(getElementByNumber(26)!).facts;
    const byLabel = Object.fromEntries(facts.map((f) => [f.label, f.value]));
    expect(byLabel["Atomic number"]).toBe("26");
    expect(byLabel["Electron configuration"]).toBe("[Ar] 3d6 4s2");
    expect(byLabel["Phase at STP"]).toBe("Solid");
    expect(byLabel["Pauling electronegativity"]).toBe("1.83");
    expect(byLabel["First ionization energy"]).toBe("762.5 kJ/mol");
    expect(byLabel["Covalent radius"]).toBe("132 pm");
    expect(byLabel["Discovered"]).toBe("Antiquity");
  });
});
