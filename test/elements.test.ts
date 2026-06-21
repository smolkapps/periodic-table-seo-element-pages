import { describe, it, expect } from "vitest";
import {
  ELEMENTS,
  GRID_COLS,
  GRID_ROWS,
  getElementBySlug,
  getElementBySymbol,
  getElementByNumber,
  slugify,
  groupForElement,
  periodForElement,
  categoryLabel,
  CATEGORY_META,
  buildGrid,
  elementUrl,
  buildShareData,
  elementsByCategory,
  adjacentElements,
} from "../src/lib/elements";

describe("ELEMENTS dataset integrity", () => {
  it("contains exactly 118 elements", () => {
    expect(ELEMENTS).toHaveLength(118);
  });

  it("is ordered by atomic number 1..118 with no gaps", () => {
    ELEMENTS.forEach((el, i) => {
      expect(el.number).toBe(i + 1);
    });
  });

  it("has unique symbols", () => {
    const symbols = new Set(ELEMENTS.map((e) => e.symbol));
    expect(symbols.size).toBe(118);
  });

  it("has unique slugs", () => {
    const slugs = new Set(ELEMENTS.map((e) => e.slug));
    expect(slugs.size).toBe(118);
  });

  it("has unique names", () => {
    const names = new Set(ELEMENTS.map((e) => e.name));
    expect(names.size).toBe(118);
  });

  it("every element has a positive atomic mass", () => {
    for (const el of ELEMENTS) {
      expect(el.atomicMass).toBeGreaterThan(0);
    }
  });

  it("every element has a known category", () => {
    const cats = new Set(Object.keys(CATEGORY_META));
    for (const el of ELEMENTS) {
      expect(cats.has(el.category)).toBe(true);
    }
  });

  it("every element has a valid 1-2 char symbol starting uppercase", () => {
    for (const el of ELEMENTS) {
      expect(el.symbol).toMatch(/^[A-Z][a-z]?$/);
    }
  });

  it("grid positions are within bounds", () => {
    for (const el of ELEMENTS) {
      expect(el.xpos).toBeGreaterThanOrEqual(1);
      expect(el.xpos).toBeLessThanOrEqual(GRID_COLS);
      expect(el.ypos).toBeGreaterThanOrEqual(1);
      expect(el.ypos).toBeLessThanOrEqual(GRID_ROWS);
    }
  });

  it("no two elements occupy the same grid cell", () => {
    const seen = new Set<string>();
    for (const el of ELEMENTS) {
      const key = `${el.xpos},${el.ypos}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("places the lanthanides in row 9 and actinides in row 10 (fixes spacer-collapse bug)", () => {
    const lan = ELEMENTS.filter((e) => e.category === "lanthanide");
    const act = ELEMENTS.filter((e) => e.category === "actinide");
    expect(lan).toHaveLength(15);
    expect(act).toHaveLength(15);
    expect(lan.every((e) => e.ypos === 9)).toBe(true);
    expect(act.every((e) => e.ypos === 10)).toBe(true);
  });

  it("keeps Oganesson and Actinium as full cells (regression: original app rendered them tiny)", () => {
    const og = getElementByNumber(118)!;
    const ac = getElementByNumber(89)!;
    // Oganesson is group 18, period 7, top main grid row 7 (not collapsed).
    expect(og.symbol).toBe("Og");
    expect(og.xpos).toBe(18);
    expect(og.ypos).toBe(7);
    // Actinium leads the actinide row at column 3.
    expect(ac.symbol).toBe("Ac");
    expect(ac.xpos).toBe(3);
    expect(ac.ypos).toBe(10);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hydrogen")).toBe("hydrogen");
  });
  it("handles names with spaces", () => {
    expect(slugify("Some Element")).toBe("some-element");
  });
  it("strips leading/trailing punctuation and collapses runs", () => {
    expect(slugify("  --Foo & Bar--  ")).toBe("foo-bar");
  });
  it("matches the slug stored on each element", () => {
    expect(slugify("Iron")).toBe(getElementByNumber(26)!.slug);
  });
});

describe("getElementBySlug", () => {
  it("finds an element by exact slug", () => {
    expect(getElementBySlug("iron")?.symbol).toBe("Fe");
  });
  it("is case-insensitive", () => {
    expect(getElementBySlug("IRON")?.number).toBe(26);
  });
  it("returns undefined for an unknown slug", () => {
    expect(getElementBySlug("unobtanium")).toBeUndefined();
  });
  it("returns undefined for an empty string", () => {
    expect(getElementBySlug("")).toBeUndefined();
  });
});

describe("getElementBySymbol", () => {
  it("finds by exact symbol", () => {
    expect(getElementBySymbol("Fe")?.name).toBe("Iron");
  });
  it("is case-insensitive (lowercase)", () => {
    expect(getElementBySymbol("fe")?.number).toBe(26);
  });
  it("is case-insensitive (uppercase)", () => {
    expect(getElementBySymbol("FE")?.number).toBe(26);
  });
  it("returns undefined for an unknown symbol", () => {
    expect(getElementBySymbol("Zz")).toBeUndefined();
  });
});

describe("getElementByNumber", () => {
  it("finds the first and last elements", () => {
    expect(getElementByNumber(1)?.symbol).toBe("H");
    expect(getElementByNumber(118)?.symbol).toBe("Og");
  });
  it("returns undefined below range", () => {
    expect(getElementByNumber(0)).toBeUndefined();
  });
  it("returns undefined above range", () => {
    expect(getElementByNumber(119)).toBeUndefined();
  });
});

describe("groupForElement", () => {
  it("returns the column for d/p/s-block elements", () => {
    expect(groupForElement(1, 1)).toBe(1); // H
    expect(groupForElement(18, 1)).toBe(18); // He
  });
  it("returns null for the f-block rows 9 and 10", () => {
    expect(groupForElement(5, 9)).toBeNull();
    expect(groupForElement(5, 10)).toBeNull();
  });
});

describe("periodForElement", () => {
  it("maps regular rows to themselves", () => {
    expect(periodForElement(1)).toBe(1);
    expect(periodForElement(7)).toBe(7);
  });
  it("maps the detached f-block rows to their true periods", () => {
    expect(periodForElement(9)).toBe(6); // lanthanides
    expect(periodForElement(10)).toBe(7); // actinides
  });
  it("assigns lanthanides period 6 and actinides period 7 on real data", () => {
    expect(getElementByNumber(57)!.period).toBe(6); // La
    expect(getElementByNumber(89)!.period).toBe(7); // Ac
  });
});

describe("categoryLabel", () => {
  it("returns human labels", () => {
    expect(categoryLabel("noble gas")).toBe("Noble gas");
    expect(categoryLabel("nonmetal")).toBe("Reactive nonmetal");
  });
});

describe("buildGrid", () => {
  it("returns one cell per element", () => {
    expect(buildGrid()).toHaveLength(118);
  });
  it("each cell's coords match its element", () => {
    for (const cell of buildGrid()) {
      expect(cell.xpos).toBe(cell.element.xpos);
      expect(cell.ypos).toBe(cell.element.ypos);
    }
  });
});

describe("elementUrl", () => {
  it("builds a canonical absolute URL with a trailing slash", () => {
    expect(elementUrl("iron", "https://elements.example.com")).toBe(
      "https://elements.example.com/element/iron/",
    );
  });
  it("strips a trailing slash from the origin before appending the path", () => {
    expect(elementUrl("iron", "https://elements.example.com/")).toBe(
      "https://elements.example.com/element/iron/",
    );
  });
});

describe("buildShareData", () => {
  it("produces a title, descriptive text, and the canonical URL", () => {
    const fe = getElementByNumber(26)!;
    const share = buildShareData(fe, "https://elements.example.com");
    expect(share.title).toBe("Iron (Fe) — Periodic Table");
    expect(share.url).toBe("https://elements.example.com/element/iron/");
    expect(share.text).toContain("element 26");
    expect(share.text).toContain("transition metal");
    expect(share.text).toContain("55.845");
  });
});

describe("elementsByCategory", () => {
  it("partitions all 118 elements with no loss", () => {
    const map = elementsByCategory();
    const total = [...map.values()].reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(118);
  });
  it("preserves canonical category ordering", () => {
    const map = elementsByCategory();
    expect([...map.keys()]).toEqual(Object.keys(CATEGORY_META));
  });
});

describe("adjacentElements", () => {
  it("returns both neighbours in the middle", () => {
    const { prev, next } = adjacentElements(26);
    expect(prev?.symbol).toBe("Mn");
    expect(next?.symbol).toBe("Co");
  });
  it("has no prev for hydrogen", () => {
    const { prev, next } = adjacentElements(1);
    expect(prev).toBeUndefined();
    expect(next?.symbol).toBe("He");
  });
  it("has no next for oganesson", () => {
    const { prev, next } = adjacentElements(118);
    expect(prev?.symbol).toBe("Ts");
    expect(next).toBeUndefined();
  });
});
