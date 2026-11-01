import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ELEMENTS,
  CATEGORY_META,
  getElementBySlug,
  getElementBySymbol,
  getElementByNumber,
  formatMass,
  buildArticle,
  buildComparison,
  buildElementShareUrl,
  buildComparisonShareUrl,
  resolveComparisonSlugs,
  nextCellIndex,
  firstVisibleIndex,
} from "../src/data/elementsData.js";

describe("Elementa 118-element dataset", () => {
  it("contains all 118 elements in strict atomic number order 1..118", () => {
    assert.equal(ELEMENTS.length, 118);
    ELEMENTS.forEach((element, index) => {
      assert.equal(element.number, index + 1);
      assert.ok(element.xpos >= 1 && element.xpos <= 18, `xpos out of range for ${element.symbol}`);
      assert.ok(element.ypos >= 1 && element.ypos <= 10, `ypos out of range for ${element.symbol}`);
      assert.ok(CATEGORY_META[element.category], `unknown category for ${element.symbol}`);
    });
  });

  it("has unique slugs and symbols", () => {
    assert.equal(new Set(ELEMENTS.map((element) => element.slug)).size, 118);
    assert.equal(new Set(ELEMENTS.map((element) => element.symbol)).size, 118);
  });

  it("computes ground-state shell totals that sum exactly to Z for all 118 elements", () => {
    for (const element of ELEMENTS) {
      const sum = element.shells.reduce((total, count) => total + count, 0);
      assert.equal(sum, element.number, `shell sum mismatch for ${element.symbol}`);
    }
  });

  it("keeps Oganesson (18,7) and Actinium (3,10) at explicit coordinates and brackets synthetic masses", () => {
    const oganesson = getElementByNumber(118);
    const actinium = getElementByNumber(89);
    const iron = getElementByNumber(26);
    assert.equal(oganesson.xpos, 18);
    assert.equal(oganesson.ypos, 7);
    assert.equal(formatMass(oganesson), "[294]");
    assert.equal(actinium.xpos, 3);
    assert.equal(actinium.ypos, 10);
    assert.equal(formatMass(iron), "55.845");
  });

  it("looks elements up by slug, symbol and number", () => {
    assert.equal(getElementBySlug("iron").symbol, "Fe");
    assert.equal(getElementBySymbol("fe").slug, "iron");
    assert.equal(getElementByNumber(1).slug, "hydrogen");
    assert.equal(getElementBySlug("unobtanium"), undefined);
  });
});

describe("Elementa article and comparison generation", () => {
  it("builds articles with 3 sections, at least 10 facts and 4 https citations per element", () => {
    for (const element of ELEMENTS) {
      const article = buildArticle(element);
      assert.ok(article.summary.includes(element.name));
      assert.equal(article.sections.length, 3);
      assert.notEqual(article.sections[0].body, article.summary);
      assert.ok(article.facts.length >= 10);
      assert.equal(article.citations.length, 4);
      for (const citation of article.citations) {
        assert.match(citation.url, /^https:\/\//);
      }
    }
  });

  it("does not present unsupported electronegativity values for elements without one", () => {
    const helium = getElementBySlug("helium");
    const article = buildArticle(helium);
    const row = article.facts.find((fact) => fact.label === "Pauling electronegativity");
    assert.equal(row.value, "Not established");
    assert.ok(article.sections[1].body.includes("no established Pauling electronegativity"));
  });

  it("resolves comparisons, highlights numeric maxima, and falls back on unknown slugs", () => {
    const trio = resolveComparisonSlugs(["iron", "gold", "oxygen"]);
    assert.deepEqual(
      trio.map((element) => element.symbol),
      ["Fe", "Au", "O"]
    );

    const comparison = buildComparison(trio);
    const massRow = comparison.rows.find((row) => row.label.includes("Atomic mass"));
    assert.equal(massRow.maxIndex, 1);

    const groupRow = comparison.rows.find((row) => row.label === "Group");
    assert.equal(groupRow.maxIndex, null);

    const fallback = resolveComparisonSlugs(["unobtanium"]);
    assert.deepEqual(
      fallback.map((element) => element.slug),
      ["iron", "gold", "oxygen"]
    );
  });

  it("builds canonical public elementalearn.com share URLs for elements and comparisons", () => {
    assert.equal(buildElementShareUrl("oxygen"), "https://elementalearn.com/element/oxygen");
    assert.equal(buildElementShareUrl({ slug: "iron" }), "https://elementalearn.com/element/iron");
    assert.equal(buildElementShareUrl("unobtanium"), "https://elementalearn.com/");
    assert.equal(
      buildComparisonShareUrl(["copper", "silver", "gold"]),
      "https://elementalearn.com/compare?ids=copper,silver,gold"
    );
    assert.equal(
      buildComparisonShareUrl(["unobtanium"]),
      "https://elementalearn.com/compare?ids=iron,gold,oxygen"
    );
  });
});

describe("Elementa table keyboard navigation", () => {
  it("supports roving-tabindex navigation across visible cells", () => {
    const cells = ELEMENTS.map((element) => ({ x: element.xpos, y: element.ypos, hidden: false }));
    assert.equal(firstVisibleIndex(cells), 0);
    assert.equal(nextCellIndex(cells, 0, "ArrowRight"), 1);
    assert.equal(nextCellIndex(cells, 0, "ArrowDown"), 2);
  });

  it("skips filtered-out cells", () => {
    const cells = ELEMENTS.map((element) => ({ x: element.xpos, y: element.ypos, hidden: element.number === 2 }));
    assert.equal(nextCellIndex(cells, 0, "ArrowRight"), 2);
  });
});