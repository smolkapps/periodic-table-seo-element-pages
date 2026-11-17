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
  buildPeriodicTrendInsight,
  buildDeterministicQuiz,
  buildDailySpotlight,
  FLASHCARD_MODES,
  buildDeckFlashcard,
  describeValenceSummary,
  AUFBAU_NOTES,
  getShellRoleLabel,
  isValenceSubshell,
  buildElementShareUrl,
  buildElementPageTitle,
  buildComparisonShareUrl,
  resolveComparisonSlugs,
  resolveElementSlug,
  QUIZ_LENGTH_OPTIONS,
  QUIZ_DIFFICULTY_META,
  nextCellIndex,
  firstVisibleIndex,
} from "../src/data/elementsData.js";
import {
  TREND_EXPLORER_METRICS,
  getTrendMetricValue,
  getTrendExplorerPeers,
  buildTrendExplorerAnalysis,
} from "../src/data/trendReasoning.js";

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

  it("looks elements up by slug, symbol, number, and US/UK spelling aliases", () => {
    assert.equal(getElementBySlug("iron").symbol, "Fe");
    assert.equal(getElementBySymbol("fe").slug, "iron");
    assert.equal(getElementByNumber(1).slug, "hydrogen");
    assert.equal(resolveElementSlug("aluminum"), "aluminium");
    assert.equal(resolveElementSlug("cesium"), "caesium");
    assert.equal(getElementBySlug("aluminum").slug, "aluminium");
    assert.equal(getElementBySlug("cesium").slug, "caesium");
    assert.equal(getElementBySlug("unobtanium"), undefined);
    assert.equal(
      buildElementPageTitle(getElementBySlug("iron")),
      "Iron (Fe): Electron Configuration, Properties & Quiz — Elementa"
    );
  });

  it("supports 5, 10, and 20 question quizzes across Easy, Standard, and Hard levels with neighboring-element distractors", () => {
    assert.deepEqual(QUIZ_LENGTH_OPTIONS, [5, 10, 20]);
    assert.deepEqual(Object.keys(QUIZ_DIFFICULTY_META), ["easy", "standard", "hard"]);

    const easyQuiz = buildDeterministicQuiz(ELEMENTS.slice(0, 10), 10, "all", "easy");
    assert.equal(easyQuiz.length, 10);
    assert.ok(easyQuiz.every((q) => q.difficulty === "easy"));

    const hardPool = [getElementBySlug("chromium"), getElementBySlug("copper"), getElementBySlug("palladium"), getElementBySlug("gold"), getElementBySlug("iron")];
    const hardQuiz = buildDeterministicQuiz(hardPool, 20, "all", "hard");
    assert.equal(hardQuiz.length, 20);
    assert.ok(hardQuiz.every((q) => q.difficulty === "hard"));
    // Verify Cr question distractors come from neighboring Period 4 d-block elements
    const crQuestion = hardQuiz.find((q) => q.target.slug === "chromium");
    assert.ok(crQuestion);
    const distractorNumbers = crQuestion.options
      .filter((o) => o.slug !== "chromium")
      .map((o) => getElementBySlug(o.slug).number);
    assert.ok(
      distractorNumbers.every((z) => Math.abs(z - 24) <= 6),
      `Expected neighboring elements around Z=24 for Cr distractors, got ${distractorNumbers.join(", ")}`
    );
  });

  it("advances across consecutive quiz rounds without repeating questions while preserving strict target scope", () => {
    const trendPool = [
      "fluorine", "oxygen", "caesium", "helium", "iron",
      "lithium", "silicon", "gold", "sodium", "chlorine",
      "carbon", "nitrogen", "magnesium", "aluminium", "phosphorus",
      "sulfur", "potassium", "calcium", "copper", "zinc",
    ].map((s) => getElementBySlug(s));

    // Round 0 vs Round 1 (5 Qs Standard Trends): zero overlap in targets or prompts; Fluorine EN 3.98 does not repeat
    const round0 = buildDeterministicQuiz(trendPool, 5, "trends", "standard", 0);
    const round1 = buildDeterministicQuiz(trendPool, 5, "trends", "standard", 1);
    assert.equal(round0[0].target.slug, "fluorine");
    assert.notEqual(round1[0].target.slug, "fluorine");
    assert.equal(
      round1.some((q) => round0.some((prev) => prev.prompt === q.prompt)),
      false,
      "Practice Again (roundOffset=1) must not repeat any question from Round 0"
    );

    // 16 consecutive 5-question rounds cover all 80 unique (target, concept) pairs before cycling
    const allSeenPairs = new Set();
    for (let r = 0; r < 16; r++) {
      const roundQs = buildDeterministicQuiz(trendPool, 5, "trends", "standard", r);
      assert.equal(roundQs.length, 5);
      for (const q of roundQs) {
        allSeenPairs.add(`${q.target.slug}:${q.concept}`);
      }
    }
    assert.equal(allSeenPairs.size, 80, "16 consecutive 5-Q rounds visit all 80 unique (element, concept) questions");

    // 1-element scope (/practice?element=oxygen) rotates lead question and distractors on Practice Again without padding outside targets
    const ox0 = buildDeterministicQuiz([getElementBySlug("oxygen")], 5, "element", "standard", 0);
    const ox1 = buildDeterministicQuiz([getElementBySlug("oxygen")], 5, "element", "standard", 1);
    assert.equal(ox0.length, 4);
    assert.equal(ox1.length, 4);
    assert.notEqual(ox0[0].concept, ox1[0].concept, "1-element Practice Again rotates starting concept");
    assert.ok(ox1.every((q) => q.target.slug === "oxygen"), "1-element Practice Again stays strictly on oxygen");
  });

  it("builds daily spotlights across all 118 elements with 4 distinct options without leaking element symbol or name", () => {
    const seenSlugs = new Set();
    for (let offset = 0; offset < 118; offset++) {
      const spotlight = buildDailySpotlight("2025-11-01", offset);
      seenSlugs.add(spotlight.target.slug);
      assert.equal(spotlight.options.length, 4, "Spotlight has exactly 4 options");
      assert.equal(new Set(spotlight.options.map((o) => o.slug)).size, 4, "Spotlight options are distinct");
      assert.ok(spotlight.options.some((o) => o.slug === spotlight.target.slug), "Target is included in options");

      assert.doesNotMatch(
        spotlight.clue.toLowerCase(),
        new RegExp(`\\b${spotlight.target.name.toLowerCase()}\\b`),
        `Clue leaks element name for ${spotlight.target.name}`
      );
      assert.doesNotMatch(
        spotlight.clue,
        new RegExp(`\\b${spotlight.target.symbol}\\b`),
        `Clue leaks element symbol for ${spotlight.target.symbol}`
      );
    }
    assert.equal(seenSlugs.size, 118, "Cycling 118 offsets visits all 118 elements");
  });

  it("builds active-recall flashcards across all 118 elements without leaking answers or misstating valence/units", () => {
    assert.deepEqual(Object.keys(FLASHCARD_MODES), ["structure", "trends", "clue"]);

    for (const el of ELEMENTS) {
      const secretNote = `Personal mnemonic for Z=${el.number}`;

      const structureCard = buildDeckFlashcard(el, "structure", secretNote);
      const structureFront = `${structureCard.frontBadge} ${structureCard.frontTitle} ${structureCard.frontPrompt}`;
      assert.equal(structureCard.hasPersonalNote, true);
      assert.equal(structureCard.personalNote, secretNote);
      assert.equal(structureFront.includes(secretNote), false, "Structure front must never leak personal note");
      assert.equal(structureFront.includes(el.electronConfig), false, "Structure front must never leak configuration");
      assert.equal(structureCard.answerHeadline, el.electronConfig);
      if (el.number >= 104) {
        assert.match(structureCard.referenceNote, /theoretical predictions/);
        assert.doesNotMatch(structureCard.takeaway, /near-complete chemical inertness/);
      }
      for (const detail of structureCard.details) {
        if (detail.label === "Atomic weight / mass number") {
          assert.doesNotMatch(detail.value, /\bu\b/, `Flashcard atomic weight must be dimensionless on ${el.name}`);
        }
      }

      const trendsCard = buildDeckFlashcard(el, "trends", secretNote);
      const trendsFront = `${trendsCard.frontBadge} ${trendsCard.frontTitle} ${trendsCard.frontPrompt}`;
      assert.equal(trendsFront.includes(secretNote), false, "Trends front must never leak personal note");
      assert.equal(
        trendsFront.toLowerCase().includes(CATEGORY_META[el.category].label.toLowerCase()),
        false,
        `Trends front must not leak family label for ${el.name}`
      );

      const clueCard = buildDeckFlashcard(el, "clue", secretNote);
      const clueFront = `${clueCard.frontBadge} ${clueCard.frontTitle} ${clueCard.frontPrompt}`;
      assert.equal(clueFront.includes(secretNote), false, "Clue front must never leak personal note");
      assert.doesNotMatch(
        clueFront.toLowerCase(),
        new RegExp(`\\b${el.name.toLowerCase()}\\b`),
        `Flashcard clue leaks element name for ${el.name}`
      );
      assert.doesNotMatch(
        clueFront,
        new RegExp(`\\b${el.symbol}\\b`),
        `Flashcard clue leaks element symbol for ${el.symbol}`
      );
      assert.doesNotMatch(clueFront, new RegExp(`#${el.number}\\b|Z\\s*=\\s*${el.number}\\b`));
    }

    assert.equal(describeValenceSummary(getElementBySlug("carbon")), "2s² 2p² — 4 valence electrons in outermost shell n=2");
    assert.equal(describeValenceSummary(getElementBySlug("helium")), "1s² — closed n=1 valence shell (2 e⁻)");
    assert.match(describeValenceSummary(getElementBySlug("neon")), /2s² 2p⁶ — closed n=2 valence octet/);
    assert.match(describeValenceSummary(getElementBySlug("chromium")), /3d⁵ 4s¹.*partially filled inner 3d⁵/);
    assert.match(describeValenceSummary(getElementBySlug("copper")), /4s¹ with filled inner 3d¹⁰/);
    assert.equal(describeValenceSummary(getElementBySlug("palladium")), "4d¹⁰ — closed n=4 d-subshell with 0 electrons in n=5");
    assert.match(describeValenceSummary(getElementBySlug("ytterbium")), /6s² over filled 4f¹⁴/);
    assert.match(describeValenceSummary(getElementBySlug("lawrencium")), /7s² 7p¹ over filled 5f¹⁴/);

    const ogTrends = buildDeckFlashcard(getElementBySlug("oganesson"), "trends");
    assert.match(ogTrends.answerHeadline, /predicted at STP/);
    assert.match(ogTrends.answerSubline, /EN Not established · IE₁ Not established · r_cov Not established/);
    assert.ok(buildDeckFlashcard(getElementBySlug("chromium"), "structure").aufbauNote);
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

  it("compares known reference values and keeps missing metrics separate from element identity", () => {
    const insight = (slugs) => buildPeriodicTrendInsight(resolveComparisonSlugs(slugs));
    const life = insight(["carbon", "nitrogen", "oxygen"]);
    assert.match(life.headline, /Across Period 2/);
    assert.match(life.body, /half-filled 2p³/);
    assert.match(life.body, /1402\.3 kJ\/mol/);
    assert.match(insight(["magnesium", "aluminium"]).body, /first p electron/);
    assert.match(insight(["copper", "silver", "gold"]).body, /145 pm/);
    assert.match(insight(["lithium", "sodium", "potassium"]).headline, /Down Group 1/);
    const mixed = insight(["carbon", "oganesson"]);
    assert.match(mixed.body, /Carbon has a reference covalent radius of 76 pm/);
    assert.doesNotMatch(mixed.body, /radioactive|short.*half|superheavy set/);
    assert.match(mixed.body, /not established in this dataset for Oganesson/);
    const raOg = insight(["radium", "oganesson"]);
    assert.match(raOg.body, /Radium has a reference covalent radius of 221 pm/);
    assert.match(raOg.body, /for Oganesson/);
    const unknown = insight(["rutherfordium", "oganesson"]);
    assert.match(unknown.body, /not established in this dataset/);
    assert.doesNotMatch(unknown.body, /null|undefined|NaN|radioactive/);
    assert.equal(buildPeriodicTrendInsight([]), null);
  });

  it("keeps selected values, signed comparisons, missing entries and peer scope consistent across 708 trend states", () => {
    assert.deepEqual(
      TREND_EXPLORER_METRICS.map((m) => m.key),
      ["electronegativity", "ionizationEnergy", "atomicRadius"]
    );

    // 1. Exhaustive audit across all 118 elements x 3 metrics x 2 axes = 708 states
    for (const el of ELEMENTS) {
      for (const metric of TREND_EXPLORER_METRICS) {
        for (const axisMode of ["period", "group"]) {
          const res = buildTrendExplorerAnalysis(el, metric.key, axisMode);
          const combined = `${res.headline} ${res.seriesSpanLabel} ${res.summary} ${res.principle}`;
          assert.doesNotMatch(
            combined,
            /\bundefined\b|\bnull\b|\bNaN\b|\d+\.\d{4,}/,
            `Malformed or unrounded text for ${el.slug}/${metric.key}/${axisMode}: ${combined}`
          );
          assert.doesNotMatch(
            combined,
            /remove one mole of valence electrons/i,
            "Avoid sloppy multi-electron phrasing for first ionization energy"
          );
          assert.ok(
            res.compareSlugs.includes(el.slug),
            `Compare window must always include active element ${el.slug} (${metric.key}/${axisMode})`
          );

          const val = getTrendMetricValue(el, metric.key);
          if (val === null) {
            assert.match(res.headline, /not established/i);
            assert.match(res.summary, /not established|no stable standard covalent|no established/i);
          } else {
            assert.ok(
              res.headline.includes(String(val)) && res.summary.length > 30,
              `Expected exact value ${val} in headline for ${el.slug}/${metric.key}/${axisMode}`
            );
          }

          // f-block elements in axisMode="group" compare Period main-body + element, never a vertical group
          if (el.group === null && axisMode === "group") {
            assert.doesNotMatch(res.summary, /^Down Group|^Moving down Group|^At the top of Group/);
          }
        }
      }
    }

    // The worked example must use the selected values and only narrowly sourced explanations.
    const oxygen = getElementBySlug("oxygen");
    const oxIE = buildTrendExplorerAnalysis(oxygen, "ionizationEnergy", "period");
    assert.match(oxIE.headline, /1313\.9 kJ\/mol.*88\.4 kJ\/mol lower than Nitrogen \(1402\.3 kJ\/mol\)/);
    assert.match(oxIE.summary, /2p³.*2p⁴/);
    assert.match(oxIE.sourceUrl, /openstax/);
    assert.deepEqual(oxIE.compareSlugs, ["nitrogen", "oxygen", "fluorine"]);
    const nIE = buildTrendExplorerAnalysis(getElementBySlug("nitrogen"), "ionizationEnergy", "period");
    assert.match(nIE.headline, /88\.4 kJ\/mol higher than Oxygen/);
    assert.match(nIE.summary, /half-filled 2p³/);
    assert.deepEqual(nIE.compareSlugs, ["carbon", "nitrogen", "oxygen"]);
    assert.match(buildTrendExplorerAnalysis(oxygen, "electronegativity").headline, /0\.4 higher than Nitrogen/);
    assert.match(buildTrendExplorerAnalysis(getElementBySlug("boron"), "ionizationEnergy").headline, /98\.9 kJ\/mol lower than Beryllium/);
    assert.match(buildTrendExplorerAnalysis(getElementBySlug("aluminium"), "ionizationEnergy").summary, /first p electron/);

    // Absolute magnitudes must never reverse lower/higher comparisons.
    for (const [slug, key, expected] of [
      ["vanadium", "ionizationEnergy", /1\.2 kJ\/mol lower than Niobium/],
      ["nickel", "ionizationEnergy", /67\.3 kJ\/mol lower than Palladium/],
      ["chromium", "electronegativity", /0\.5 lower than Molybdenum/],
      ["gold", "ionizationEnergy", /159\.1 kJ\/mol higher than Silver/],
      ["gold", "atomicRadius", /9 pm lower than Silver/],
    ]) assert.match(buildTrendExplorerAnalysis(getElementBySlug(slug), key, "group").headline, expected);

    // Displayed adjacency can skip many atomic numbers; differences do not establish causes.
    const hf = buildTrendExplorerAnalysis(getElementBySlug("hafnium"), "atomicRadius");
    assert.match(hf.headline, /40 pm lower than Barium/);
    assert.doesNotMatch(hf.summary, /\+1 proton|because/);
    const pd = buildTrendExplorerAnalysis(getElementBySlug("palladium"), "atomicRadius", "group");
    assert.doesNotMatch(pd.summary, /adding.*n=5|extra.*shell|filled f/);
    const ne = buildTrendExplorerAnalysis(getElementBySlug("neon"), "electronegativity");
    assert.match(ne.headline, /not established/);
    assert.doesNotMatch(ne.summary, /radioisotope|synthesis|half-life/);
    const h = buildTrendExplorerAnalysis(getElementBySlug("hydrogen"), "electronegativity");
    assert.match(h.summary, /1 of 2 entries/);
    assert.match(h.seriesSpanLabel, /Known: H 2\.2/);
    assert.equal(getTrendExplorerPeers(oxygen, "group").peers[1].slug, "sulfur");

    const tie = ELEMENTS.map((el) => buildTrendExplorerAnalysis(el, "atomicRadius"))
      .find((res) => res.headline.includes("equal to"));
    assert.ok(tie, "Dataset ties must remain explicitly equal");
    assert.doesNotMatch(tie.summary, /because|shielding balances/);

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
