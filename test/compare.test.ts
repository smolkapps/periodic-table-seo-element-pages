import { describe, it, expect } from "vitest";
import { getElementByNumber } from "../src/lib/elements";
import {
  buildComparison,
  resolveComparisonSlugs,
  DEFAULT_COMPARE_SLUGS,
  COMPARE_OPTIONS,
  MIN_COMPARE,
  MAX_COMPARE,
} from "../src/lib/compare";

const iron = getElementByNumber(26)!;
const gold = getElementByNumber(79)!;
const oxygen = getElementByNumber(8)!;

describe("buildComparison", () => {
  it("returns the elements it was given, in order", () => {
    const cmp = buildComparison([iron, gold, oxygen]);
    expect(cmp.elements.map((e) => e.symbol)).toEqual(["Fe", "Au", "O"]);
  });

  it("emits one value per element on every row", () => {
    const cmp = buildComparison([iron, gold, oxygen]);
    for (const row of cmp.rows) {
      expect(row.values).toHaveLength(3);
    }
  });

  it("renders the core properties with the same formatting as the fact table", () => {
    const cmp = buildComparison([iron, gold]);
    const byLabel = Object.fromEntries(cmp.rows.map((r) => [r.label, r.values]));
    expect(byLabel["Atomic number"]).toEqual(["26", "79"]);
    expect(byLabel["Symbol"]).toEqual(["Fe", "Au"]);
    expect(byLabel["Atomic mass"]).toEqual(["55.845", "196.97"]);
    expect(byLabel["Category"]).toEqual(["Transition metal", "Transition metal"]);
    expect(byLabel["Period"]).toEqual(["4", "6"]);
  });

  it("brackets synthetic masses in the comparison too", () => {
    const og = getElementByNumber(118)!;
    const cmp = buildComparison([iron, og]);
    const mass = cmp.rows.find((r) => r.label === "Atomic mass")!;
    expect(mass.values).toEqual(["55.845", "[294]"]);
  });

  it("flags the greatest value in numeric rows via maxIndex", () => {
    const cmp = buildComparison([iron, gold, oxygen]);
    const number = cmp.rows.find((r) => r.label === "Atomic number")!;
    // Gold (79) is the largest atomic number of the three.
    expect(number.maxIndex).toBe(1);
    const mass = cmp.rows.find((r) => r.label === "Atomic mass")!;
    expect(mass.maxIndex).toBe(1); // gold is heaviest
  });

  it("leaves non-numeric rows without a maxIndex", () => {
    const cmp = buildComparison([iron, gold, oxygen]);
    const symbol = cmp.rows.find((r) => r.label === "Symbol")!;
    expect(symbol.maxIndex).toBeNull();
    const category = cmp.rows.find((r) => r.label === "Category")!;
    expect(category.maxIndex).toBeNull();
  });

  it("reports no winner (null) when the maximum is tied", () => {
    // Two copies of the same element ⇒ every numeric max is a tie.
    const cmp = buildComparison([iron, iron]);
    const number = cmp.rows.find((r) => r.label === "Atomic number")!;
    expect(number.maxIndex).toBeNull();
  });

  it("treats 'known since antiquity' discovery as the earliest date", () => {
    // Gold is ancient (year null); iron here is modern-dated in the dataset? Use
    // a clearly modern element to make the ordering explicit.
    const helium = getElementByNumber(2)!; // 1868
    const cmp = buildComparison([gold, helium]);
    const discovered = cmp.rows.find((r) => r.label === "Discovered")!;
    expect(discovered.values[0]).toBe("Antiquity");
    expect(discovered.values[1]).toBe("1868");
    // Antiquity ranks as earliest, so helium (1868) is the "greatest" year.
    expect(discovered.maxIndex).toBe(1);
  });

  it("does not compute a maxIndex for a single element", () => {
    const cmp = buildComparison([iron]);
    for (const row of cmp.rows) {
      expect(row.maxIndex).toBeNull();
    }
  });
});

describe("resolveComparisonSlugs", () => {
  it("resolves valid slugs to elements in order", () => {
    const els = resolveComparisonSlugs(["gold", "iron"]);
    expect(els.map((e) => e.symbol)).toEqual(["Au", "Fe"]);
  });

  it("drops unknown slugs", () => {
    const els = resolveComparisonSlugs(["iron", "unobtanium", "gold"]);
    expect(els.map((e) => e.symbol)).toEqual(["Fe", "Au"]);
  });

  it("de-duplicates repeated slugs", () => {
    const els = resolveComparisonSlugs(["iron", "iron", "gold"]);
    expect(els.map((e) => e.symbol)).toEqual(["Fe", "Au"]);
  });

  it("is case-insensitive and trims whitespace", () => {
    const els = resolveComparisonSlugs([" IRON ", "Gold"]);
    expect(els.map((e) => e.symbol)).toEqual(["Fe", "Au"]);
  });

  it("caps the result at MAX_COMPARE", () => {
    const els = resolveComparisonSlugs([
      "hydrogen",
      "helium",
      "lithium",
      "beryllium",
    ]);
    expect(els).toHaveLength(MAX_COMPARE);
    expect(els.map((e) => e.symbol)).toEqual(["H", "He", "Li"]);
  });

  it("falls back to the default trio when nothing resolves", () => {
    const els = resolveComparisonSlugs(["nope", "also-nope"]);
    expect(els.map((e) => e.slug)).toEqual([...DEFAULT_COMPARE_SLUGS]);
  });

  it("falls back to the default trio for an empty input", () => {
    const els = resolveComparisonSlugs([]);
    expect(els.map((e) => e.slug)).toEqual([...DEFAULT_COMPARE_SLUGS]);
  });
});

describe("compare constants", () => {
  it("exposes all 118 elements as pickable options", () => {
    expect(COMPARE_OPTIONS).toHaveLength(118);
  });

  it("has a sane compare range and a resolvable default trio", () => {
    expect(MIN_COMPARE).toBe(2);
    expect(MAX_COMPARE).toBe(3);
    expect(DEFAULT_COMPARE_SLUGS).toHaveLength(3);
    const resolved = resolveComparisonSlugs([...DEFAULT_COMPARE_SLUGS]);
    expect(resolved).toHaveLength(3);
  });
});
