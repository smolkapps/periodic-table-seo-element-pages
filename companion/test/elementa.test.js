import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ELEMENTS,
  CATEGORY_META,
  getElementBySlug,
  getElementBySymbol,
  getElementByNumber,
  formatMass,
  getRadioactiveBadgeLabel,
  buildArticle,
  buildComparison,
  buildElementContrastSummary,
  buildDeterministicQuiz,
  AUFBAU_NOTES,
  getShellRoleLabel,
  isValenceSubshell,
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

  it("distinguishes CIAAW standard atomic weights, primordial radioelements (Bi, Th, U), decay-chain Pa, mononuclidic elements, and bracketed mass numbers", () => {
    // Radioactive elements with CIAAW standard atomic weights (Bi, Th, Pa, U) must not be bracketed or called stable
    for (const [slug, expectedMass, isPrimordial, expectedBadge] of [
      ["bismuth", "208.98", true, "Primordial Radioelement"],
      ["thorium", "232.04", true, "Primordial Radioelement"],
      ["protactinium", "231.04", false, "Radioactive decay-chain element"],
      ["uranium", "238.03", true, "Primordial Radioelement"],
    ]) {
      const el = getElementBySlug(slug);
      assert.equal(el.synthetic, false, `${slug} has a CIAAW standard atomic weight`);
      assert.equal(el.radioactive, true, `${slug} has no stable isotopes`);
      assert.equal(el.primordialRadioactive, isPrimordial, `${slug} primordial classification`);
      assert.equal(getRadioactiveBadgeLabel(el), expectedBadge);
      assert.equal(formatMass(el), expectedMass);
      const article = buildArticle(el);
      assert.match(article.sections[2].body, /no stable isotopes/);
      assert.doesNotMatch(article.sections[2].body, /naturally occurring stable isotopes/);
    }

    // Protactinium must explain that primordial Pa is gone and terrestrial 231Pa comes from 235U decay
    const paArticle = buildArticle(getElementBySlug("protactinium"));
    assert.match(paArticle.sections[2].body, /primordial protactinium has long decayed away/);
    assert.match(paArticle.sections[2].body, /natural ²³¹Pa in ²³⁵U decay chains/);

    // Uranium must distinguish primordial 238U and 235U from radiogenic 234U maintained through 238U decay
    const uArticle = buildArticle(getElementBySlug("uranium"));
    assert.match(
      uArticle.sections[2].body,
      /primordial ²³⁸U and ²³⁵U \(along with radiogenic ²³⁴U maintained through ²³⁸U decay\)/
    );
    assert.doesNotMatch(uArticle.sections[2].body, /primordial ²³⁸U, ²³⁵U, and ²³⁴U/);

    // Standard/relative atomic weight is dimensionless (IUPAC Gold Book R05258); bracketed reference isotopes do not claim to be invariably longest-lived
    for (const el of ELEMENTS) {
      const article = buildArticle(el);
      const weightRow = article.facts.find((fact) => fact.label === "Standard atomic weight");
      assert.ok(weightRow, `Missing Standard atomic weight row for ${el.name}`);
      assert.doesNotMatch(
        weightRow.value,
        /\bu\b/,
        `Standard atomic weight fact row must be dimensionless on ${el.name}`
      );
      assert.doesNotMatch(
        article.summary,
        /standard atomic weight [^.,;]+ u\b/i,
        `Summary standard atomic weight must be dimensionless on ${el.name}`
      );
      assert.doesNotMatch(
        article.sections[2].body,
        /standard atomic weight of [^.,;]+ u\b/i,
        `Article standard atomic weight must be dimensionless on ${el.name}`
      );
      assert.doesNotMatch(
         `${article.summary} ${article.sections[2].body} ${weightRow.value}`,
        /longest-lived/i,
        `Avoid unsourced longest-lived claim on ${el.name}`
      );
      if (el.radioactive || el.mononuclidic) {
        assert.doesNotMatch(
          article.sections[2].body,
          /abundance-weighted average of its naturally occurring stable isotopes/,
          `Inaccurate stable-isotope average wording on ${el.name}`
        );
      }
      if (el.synthetic) {
        assert.doesNotMatch(
          article.summary,
          /with standard atomic weight/,
          `${el.name} lacks a CIAAW standard atomic weight and must not claim one in summary`
        );
      }
    }

    // Polonium category consistency & Oganesson superheavy predicted-phase honesty
    const polonium = getElementBySlug("polonium");
    assert.doesNotMatch(buildArticle(polonium).summary, /metalloid/i);
    const oganesson = getElementBySlug("oganesson");
    assert.equal(oganesson.electronegativity, null);
    assert.equal(oganesson.ionizationEnergy, null);
    assert.equal(oganesson.atomicRadius, null);
    assert.match(buildArticle(oganesson).sections[0].body, /predicted rather than measured macroscopically/);
  });

  it("labels d/f-block inner valence shells accurately, highlights only 4d10 on Palladium, and covers all 20 NIST ASD Aufbau exceptions", () => {
    const iron = getElementBySlug("iron");
    assert.equal(getShellRoleLabel(iron, 2), "Inner + 3d");
    assert.equal(getShellRoleLabel(iron, 3), "Outer (4s)");

    const uranium = getElementBySlug("uranium");
    assert.equal(getShellRoleLabel(uranium, 4), "Inner + 5f");
    assert.equal(getShellRoleLabel(uranium, 5), "Inner + 6d");

    const palladium = getElementBySlug("palladium");
    assert.equal(getShellRoleLabel(palladium, 3), "Valence (4d¹⁰)");
    const pd4s = palladium.subshells.find((s) => s.label === "4s");
    const pd4p = palladium.subshells.find((s) => s.label === "4p");
    const pd4d = palladium.subshells.find((s) => s.label === "4d");
    assert.equal(isValenceSubshell(palladium, pd4s), false, "Pd 4s2 is closed Kr core, not valence");
    assert.equal(isValenceSubshell(palladium, pd4p), false, "Pd 4p6 is closed Kr core, not valence");
    assert.equal(isValenceSubshell(palladium, pd4d), true, "Pd 4d10 is the active valence subshell");

    for (const sym of [
      "Cr", "Cu", "Nb", "Mo", "Ru", "Rh", "Pd", "Ag", "La", "Ce",
      "Gd", "Pt", "Au", "Ac", "Th", "Pa", "U", "Np", "Cm", "Lr",
    ]) {
      assert.ok(AUFBAU_NOTES[sym], `Missing Aufbau/relativistic note for ${sym}`);
    }
  });

  it("resolves comparisons, highlights numeric maxima, and falls back on unknown slugs", () => {
    const trio = resolveComparisonSlugs(["iron", "gold", "oxygen"]);
    assert.deepEqual(
      trio.map((element) => element.symbol),
      ["Fe", "Au", "O"]
    );

    const comparison = buildComparison(trio);
    const massRow = comparison.rows.find((row) => row.label === "Atomic weight / isotope mass number");
    assert.equal(massRow.maxIndex, null, "Atomic weights and isotope mass numbers are different quantities, not a shared maximum");
    const mixedMassRow = buildComparison([getElementBySlug("oxygen"), getElementBySlug("oganesson")]).rows.find((row) => row.label === massRow.label);
    assert.deepEqual(mixedMassRow.values, ["15.999", "[294]"]);
    assert.doesNotMatch(mixedMassRow.label, /\(u\)/, "Reference isotope mass numbers have no mass unit");

    const groupRow = comparison.rows.find((row) => row.label === "Group");
    assert.equal(groupRow.maxIndex, null);

    const discoveredRow = comparison.rows.find((row) => row.label === "Discovered");
    assert.equal(discoveredRow.maxIndex, null, "Discovery year is historical chronology, not a numeric maximum");

    // Same-family comparisons must generate distinct element-specific contrast summaries
    const alkalis = resolveComparisonSlugs(["lithium", "sodium", "potassium"]);
    const summaries = alkalis.map((el) => buildElementContrastSummary(el, alkalis));
    assert.equal(new Set(summaries).size, 3, "Same-family comparison cards must not repeat identical text");

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