/**
 * Elementa Chemistry Tutor — Grounded Context Builder & Deterministic Socratic Coach.
 *
 * IMPORTANT HONESTY BOUNDARY:
 * - Responses produced by this module are ALWAYS labeled:
 *   mode: "local_coach"
 *   sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)"
 * - They are NEVER presented as live AI responses.
 * - Live AI responses come exclusively from the server-side provider adapter
 *   (`POST /api/tutor` -> `server/tutorAdapter.mjs`), which uses this module
 *   only for canonical dataset context, citation allowlisting, and safety checks.
 */
import {
  ELEMENTS,
  CATEGORY_META,
  categoryLabel,
  formatMass,
  buildArticle,
  buildComparison,
  resolveComparisonSlugs,
  getElementBySlug,
  getElementBySymbol,
} from "../data/elementsData.js";

export const STUDENT_LEVELS = [
  {
    id: "intro",
    label: "Introductory (High School)",
    shortLabel: "Introductory",
    description: "Shell totals, valence electrons, chemical families, and core periodic trends.",
  },
  {
    id: "ap",
    label: "AP / IB / College Chem",
    shortLabel: "AP / IB / College",
    description: "Subshells (s, p, d, f), Hund's rule, Pauli exclusion, Z_eff, and d-block ionization.",
  },
  {
    id: "advanced",
    label: "Advanced (Orbital & Quantum)",
    shortLabel: "Advanced",
    description: "Exchange stabilization, radial penetration, shielding, and relativistic effects.",
  },
];

const AUFBAU_EXCEPTIONS = {
  Cr: "[Ar] 3d⁵ 4s¹ — half-filled 3d⁵ subshell gains exchange stabilization and lowers electron-electron repulsion.",
  Cu: "[Ar] 3d¹⁰ 4s¹ — completely filled 3d¹⁰ subshell is lower in energy than 3d⁹ 4s².",
  Nb: "[Kr] 4d⁴ 5s¹ — electron-electron repulsion in 4d/5s shifts one electron into 4d.",
  Mo: "[Kr] 4d⁵ 5s¹ — half-filled 4d⁵ subshell benefits from exchange energy.",
  Ru: "[Kr] 4d⁷ 5s¹ — close 4d and 5s energies favor 4d⁷ 5s¹.",
  Rh: "[Kr] 4d⁸ 5s¹ — reduces pairing repulsion relative to 4d⁷ 5s².",
  Pd: "[Kr] 4d¹⁰ 5s⁰ — completely filled 4d¹⁰ subshell with zero electrons in n=5.",
  Ag: "[Kr] 4d¹⁰ 5s¹ — filled 4d¹⁰ subshell with a single 5s¹ valence electron.",
  Pt: "[Xe] 4f¹⁴ 5d⁹ 6s¹ — relativistic contraction of 6s stabilizes a single 6s¹ electron.",
  Au: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹ — filled 5d¹⁰ subshell plus relativistic 6s contraction.",
};

// Educational chemistry safety guardrail: blocks actionable synthesis of
// explosives, chemical weapons, toxic gas release, or illicit/self-harm compounds.
const UNSAFE_PATTERNS = [
  /\b(how\s+to\s+(make|synthesize|cook|manufacture|prepare|extract|produce)|recipe\s+for|step[- ]by[- ]step\s+synthesis)\b.*\b(explosive|bomb|tnt|rdx|tatp|nitroglycerin|thermite|mustard\s+gas|sarin|vx\s+nerve|phosgene|chlorine\s+gas\s+weapon|ricin|cyanide\s+poison|methamphetamine|fentanyl)\b/i,
  /\b(make|synthesize|manufacture|cook)\s+(meth|fentanyl|tatp|pipe\s+bomb|nerve\s+agent|chlorine\s+gas\s+at\s+home)\b/i,
  /\b(lethal\s+dose|how\s+much\s+to\s+poison|suicide\s+with)\b/i,
];

export function checkChemistrySafety(text) {
  const input = String(text || "").trim();
  if (!input) return { safe: true };
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(input)) {
      return {
        safe: false,
        refusal:
          "I can't provide actionable instructions, recipes, or ratios for synthesizing hazardous materials, explosives, toxins, or controlled substances. I can safely explain theoretical periodic trends, oxidation states, electron configurations, or standard classroom safety principles.",
      };
    }
  }
  return { safe: true };
}

/**
 * Computes unpaired electrons for an element's ground-state subshells using Hund's rule
 * (simplified independent-orbital box model).
 */
export function computeSubshellSpinBreakdown(element) {
  if (!element || !Array.isArray(element.subshells)) return { totalUnpaired: 0, subshellDetails: [] };
  let totalUnpaired = 0;
  const subshellDetails = element.subshells.map((sub) => {
    const orbitals = sub.l === "s" ? 1 : sub.l === "p" ? 3 : sub.l === "d" ? 5 : 7;
    const boxes = Array.from({ length: orbitals }, (_, idx) => {
      const up = sub.count > idx;
      const down = sub.count > orbitals + idx;
      return { up, down, symbol: up && down ? "↑↓" : up ? "↑" : "·" };
    });
    const unpaired = boxes.filter((b) => b.up && !b.down).length;
    totalUnpaired += unpaired;
    return {
      label: sub.label,
      n: sub.n,
      l: sub.l,
      count: sub.count,
      maxCapacity: sub.maxCapacity,
      orbitals,
      unpaired,
      boxDiagram: boxes.map((b) => `[${b.symbol}]`).join(" "),
    };
  });
  return { totalUnpaired, subshellDetails };
}

/**
 * Returns canonical citations from the existing dataset for one or more elements.
 * Never invents URLs.
 */
export function getAllowedCitations(elements) {
  const list = Array.isArray(elements) && elements.length > 0 ? elements : [getElementBySlug("oxygen")];
  const seen = new Set();
  const out = [];
  for (const el of list.filter(Boolean)) {
    const article = buildArticle(el);
    for (const cit of article.citations) {
      if (!seen.has(cit.url)) {
        seen.add(cit.url);
        out.push({
          source: cit.source,
          title: cit.title,
          url: cit.url,
          elementSlug: el.slug,
        });
      }
    }
  }
  return out;
}

/**
 * Detects if a user message mentions another element by name, symbol, or ion (e.g. Fe2+, oxygen, chromium)
 * so follow-up questions automatically pull in that element's canonical data.
 */
export function detectReferencedElement(message, fallbackElement) {
  const text = String(message || "").trim();
  if (!text) return fallbackElement;

  // Check explicit ion/symbol patterns like Fe2+, Fe3+, O2-, Cr, Cu, Au
  const ionMatch = text.match(/\b([A-Z][a-z]?)(?:\d*[+-]+|\s*\(\s*[IVX]+\s*\))/);
  if (ionMatch) {
    const bySym = getElementBySymbol(ionMatch[1]);
    if (bySym) return bySym;
  }

  const lower = text.toLowerCase();
  for (const el of ELEMENTS) {
    const nameRegex = new RegExp(`\\b${String(el.name).toLowerCase()}\\b`, "i");
    if (nameRegex.test(lower)) return el;
  }

  // Check standalone capital symbol tokens (e.g. "Fe", "Au", "Cr")
  const tokens = text.split(/[\s,.;:?!/()[\]]+/).filter(Boolean);
  for (const tok of tokens) {
    const cleaned = tok.replace(/[0-9+-]+$/g, "");
    if (/^[A-Z][a-z]?$/.test(cleaned)) {
      const bySym = getElementBySymbol(cleaned);
      if (bySym && (cleaned.length === 2 || !["I", "A"].includes(cleaned))) {
        return bySym;
      }
    }
  }

  return fallbackElement;
}

export function buildModelCaveat(element) {
  if (!element) {
    return "Concentric Bohr shells and subshell orbital boxes are simplified 2D teaching models of 3D quantum probability wavefunctions (ψ²).";
  }
  if (element.synthetic) {
    return `${element.name} (Z=${element.number}) is a synthetic radioelement; its mass ${formatMass(
      element
    )} is the longest-lived reference isotope mass number, and bulk properties or ground-state configurations can involve relativistic uncertainty.`;
  }
  if (element.block === "d" || element.block === "f") {
    return `In transition and inner-transition elements like ${element.name}, (n−1)d / (n−2)f and ns subshells lie close in energy. Orbital boxes and concentric shells are simplified 2D models; once d orbitals are occupied in neutral atoms, the outer ns electrons remain highest in energy and are removed first on ionization.`;
  }
  return `Concentric Bohr rings (shells ${element.shells.join("·")}) and orbital boxes for ${
    element.name
  } are simplified 2D teaching representations of 3D quantum wavefunctions (ψ²).`;
}

/**
 * Builds the initial diagnostic question and graduated hints for an element, comparison, or missed quiz item.
 */
export function buildDiagnosticStarter({
  element,
  compareElements = [],
  level = "ap",
  quizContext = null,
}) {
  const target = element || getElementBySlug("oxygen");
  const spin = computeSubshellSpinBreakdown(target);
  const valenceSub = spin.subshellDetails[spin.subshellDetails.length - 1];
  const citations = getAllowedCitations(compareElements.length >= 2 ? compareElements : [target]);

  if (quizContext && quizContext.prompt) {
    return {
      topicTitle: `Quiz Review: ${target.name} (${target.symbol}, Z=${target.number})`,
      summary: `Let's unpack the quiz question on ${target.name}${
        quizContext.chosen ? ` (where "${quizContext.chosen}" was selected)` : ""
      } step by step instead of just memorizing the answer key.`,
      diagnosticQuestion: `Look at ${target.name}'s position in Period ${target.period}${
        target.group ? `, Group ${target.group}` : " (f-block)"
      } and its ground-state configuration ${target.electronConfig}. How many electrons sit in its outermost principal shell (n=${
        target.shells.length
      }), and which subshell holds the highest-energy electrons?`,
      hints: [
        `Hint 1 (Shell totals): Check ${target.name}'s Bohr shell breakdown: ${target.shells.join(
          "·"
        )} (total = ${target.number} electrons across ${target.shells.length} shells).`,
        `Hint 2 (Subshell occupancy): In the subshell diagram, ${target.name} ends with ${valenceSub?.label}^${valenceSub?.count} (${valenceSub?.boxDiagram}).`,
        `Hint 3 (Connecting to the question): ${target.name} is a ${categoryLabel(
          target.category
        ).toLowerCase()} with ${target.outerShellElectrons} outer-shell electron(s), known as ${target.highlight}.`,
      ],
      visualizerFocus: {
        elementSlug: target.slug,
        viewMode: "subshells",
      },
      modelCaveat: buildModelCaveat(target),
      citations,
    };
  }

  if (compareElements.length >= 2) {
    const names = compareElements.map((e) => `${e.name} (${e.symbol})`).join(" vs ");
    const cmp = buildComparison(compareElements);
    const enRow = cmp.rows.find((r) => r.label.includes("Electronegativity"));
    return {
      topicTitle: `Comparing ${names}`,
      summary: `You are comparing ${names} across Period/Group position, electron shells, and periodic trends.`,
      diagnosticQuestion: `Before we look at the full explanation: between ${names}, which element pulls shared bonding electrons most strongly (highest Pauling electronegativity), and how does its shell count and outer-shell configuration explain why?`,
      hints: [
        `Hint 1 (Shells & distance): Compare the number of occupied principal shells: ${compareElements
          .map((e) => `${e.symbol} has ${e.shells.length} shell(s) (${e.shells.join("·")})`)
          .join("; ")}. Fewer shells keep valence electrons closer to the nucleus.`,
        `Hint 2 (Effective nuclear charge): Across a period from left to right, proton number Z rises while inner-shell shielding stays nearly constant, pulling the valence shell inward.`,
        `Hint 3 (Reference values): In our dataset, Electronegativity values are ${compareElements
          .map((e, idx) => `${e.symbol}: ${enRow ? enRow.values[idx] : "Not established"}`)
          .join(", ")}.`,
      ],
      visualizerFocus: {
        elementSlug: compareElements[0].slug,
        viewMode: "bohr",
      },
      modelCaveat: buildModelCaveat(compareElements[0]),
      citations,
    };
  }

  // Specific high-value diagnostic starters for Oxygen, Iron, Chromium/Copper, or general elements
  if (target.slug === "oxygen") {
    return {
      topicTitle: `Oxygen (O, Z=8) — Subshells, Hund's Rule & Unpaired Electrons`,
      summary:
        level === "intro"
          ? `Oxygen has 8 electrons arranged as 2 in the inner K shell (n=1) and 6 in the outer L shell (n=2), written in subshells as 1s² 2s² 2p⁴.`
          : `Oxygen (Z=8) has ground-state configuration 1s² 2s² 2p⁴. While the Bohr ring view shows 6 valence electrons in n=2, the Subshell Orbital diagram reveals how the 4 electrons in 2p distribute across three degenerate 2p orbitals.`,
      diagnosticQuestion: `Diagnostic check: Oxygen has 4 electrons in its 2p subshell, which contains 3 equal-energy orbitals (2px, 2py, 2pz). How do those 4 electrons fill the 3 orbital boxes, and how many electrons remain unpaired?`,
      hints: [
        `Hint 1 (Orbital capacity): A p subshell has 3 spatial orbitals (3 boxes in the Subshell Orbitals view). Each box can hold at most 2 electrons with opposite spins (↑↓) by the Pauli exclusion principle.`,
        `Hint 2 (Hund's rule — single occupancy first): Because the three 2p orbitals have equal energy (degenerate), putting two electrons in the same box costs extra electrostatic repulsion. So the first 3 electrons go into separate boxes with parallel spins: [↑] [↑] [↑].`,
        `Hint 3 (Placing the 4th electron): With all three 2p boxes half-full, the 4th 2p electron must pair up in the first box with opposite spin: [↑↓] [↑] [↑]. Count the boxes that still hold a single arrow (↑).`,
      ],
      visualizerFocus: {
        elementSlug: "oxygen",
        viewMode: "subshells",
      },
      modelCaveat: buildModelCaveat(target),
      citations,
    };
  }

  if (target.slug === "iron") {
    return {
      topicTitle: `Iron (Fe, Z=26) — [Ar] 3d⁶ 4s² & Ionization to Fe²⁺ / Fe³⁺`,
      summary: `Iron sits in Period 4, Group 8 (d-block) with ground-state configuration [Ar] 3d⁶ 4s² and shell totals 2·8·14·2.`,
      diagnosticQuestion: `Diagnostic check: Neutral Iron is written [Ar] 3d⁶ 4s². When an Iron atom loses 2 electrons to form the Fe²⁺ ion, which subshell loses electrons first — 3d or 4s — and what is the resulting Fe²⁺ configuration?`,
      hints: [
        `Hint 1 (Principal quantum number n): Compare the principal shell numbers of 3d (n=3, M shell) and 4s (n=4, N shell). Which shell lies farthest from the nucleus in the atom?`,
        `Hint 2 (Why filling order ≠ removal order): In potassium and calcium, 4s fills before 3d. However, once electrons populate the compact 3d orbitals in transition metals, 3d orbitals contract and drop below 4s in energy — leaving 4s² as the highest-energy, outermost electrons.`,
        `Hint 3 (Forming Fe²⁺ and Fe³⁺): Removing the two n=4 (4s²) electrons first leaves [Ar] 3d⁶ for Fe²⁺ (4 unpaired 3d electrons). Removing one more paired 3d electron gives half-filled [Ar] 3d⁵ for Fe³⁺.`,
      ],
      visualizerFocus: {
        elementSlug: "iron",
        viewMode: "subshells",
      },
      modelCaveat: buildModelCaveat(target),
      citations,
    };
  }

  return {
    topicTitle: `${target.name} (${target.symbol}, Z=${target.number}) — Shells, Subshells & Reactivity`,
    summary: `${target.name} is a Period ${target.period} ${categoryLabel(
      target.category
    ).toLowerCase()} with ground-state configuration ${target.electronConfig} and Bohr shell distribution ${target.shells.join(
      "·"
    )}.`,
    diagnosticQuestion: `Diagnostic check: Looking at ${target.name}'s configuration (${
      target.electronConfig
    }), how many electrons occupy its outermost shell (n=${target.shells.length}), and how many unpaired electrons sit in its ${
      valenceSub?.label || "valence"
    } subshell?`,
    hints: [
      `Hint 1 (Outer shell n=${target.shells.length}): In the Bohr Shells (n) view, ${target.name}'s outermost ring holds ${target.outerShellElectrons} electron(s).`,
      `Hint 2 (Subshell boxes): Switch the visualizer to Subshell Orbitals (s/p/d/f). The ${valenceSub?.label} subshell has ${valenceSub?.orbitals} orbital box(es) and ${valenceSub?.count} electron(s): ${valenceSub?.boxDiagram}.`,
      `Hint 3 (Unpaired count & family): By Hund's rule, orbitals in ${valenceSub?.label} fill singly (↑) before pairing (↑↓), leaving ${spin.totalUnpaired} total unpaired electron(s) across the atom.`,
    ],
    visualizerFocus: {
      elementSlug: target.slug,
      viewMode: "subshells",
    },
    modelCaveat: buildModelCaveat(target),
    citations,
  };
}

/**
 * Evaluates a learner's free-form question or diagnostic answer deterministically
 * using the 118-element dataset, providing graduated hints and misconception coaching.
 * Explicitly badged as "Guided Socratic Coach (Local Dataset — Not Live AI)".
 */
export function evaluateStudentTurn({
  message,
  element,
  compareElements = [],
  level = "ap",
  hintIndex = 0,
  quizContext = null,
}) {
  const rawText = String(message || "").trim();
  const safety = checkChemistrySafety(rawText);
  const baseElement = element || getElementBySlug("oxygen");
  const activeElement = detectReferencedElement(rawText, baseElement) || baseElement;
  const citations = getAllowedCitations(
    compareElements.length >= 2 && activeElement.slug === baseElement.slug ? compareElements : [activeElement]
  );

  if (!safety.safe) {
    return {
      mode: "local_coach",
      sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
      reply: safety.refusal,
      diagnosticQuestion: null,
      hints: [],
      misconceptionAddressed: null,
      visualizerFocus: { elementSlug: activeElement.slug, viewMode: "bohr" },
      modelCaveat: buildModelCaveat(activeElement),
      citations,
    };
  }

  const lower = rawText.toLowerCase();

  // Case 1: Follow-up or question about Fe2+ / Fe3+ losing 4s electrons before 3d
  const isIronIonTopic =
    activeElement.slug === "iron" &&
    (/fe\s*2\+|fe2\+|fe\(ii\)|4s|3d|lose|loses|ioniz|oxidat|cation|remove/i.test(rawText) ||
      /why.*4s.*first/i.test(rawText));

  if (isIronIonTopic) {
    const iron = getElementBySlug("iron");
    const ironCitations = getAllowedCitations([iron]);
    // Detect if the student gave a wrong/weak answer claiming 3d is lost first or 4s is inner
    const claims3dLostFirst =
      /\b(3d\s+(is\s+)?(lost|removed|goes)\s+first|lose\s+3d|removes?\s+3d|3d4\s*4s2|because\s+3d\s+filled\s+last)\b/i.test(
        rawText
      );
    const isCorrect4sAnswer =
      /\b(4s\s+(is\s+)?(lost|removed|goes)\s+first|loses?\s+(the\s+)?(two\s+)?4s|\[ar\]\s*3d6\b|n\s*=\s*4\s+is\s+outer)/i.test(
        rawText
      ) && !/\bwhy\b/i.test(rawText);

    if (claims3dLostFirst) {
      return {
        mode: "local_coach",
        sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
        reply:
          "That is the most common transition-metal trap! It is very tempting to remove 3d electrons first because 3d is written last in the textbook Aufbau filling sequence ([Ar] 4s² 3d⁶). Before I give away the final Fe²⁺ configuration, use this hint to rethink which shell is actually on the outside of the Iron atom:",
        misconceptionAddressed:
          "Misconception: \"The subshell that fills last in the Aufbau diagram (3d) must also be removed first during ionization.\" In fact, once 3d orbitals start filling in Sc–Zn, the compact 3d orbitals experience stronger nuclear attraction and drop lower in energy than 4s, leaving the n=4 (4s) shell as the highest-energy outermost shell.",
        hints: [
          "Hint 1: Look at the principal quantum numbers: 4s belongs to shell n=4 (the N shell), whereas 3d belongs to shell n=3 (the M shell). Switch the visualizer to Bohr Shells (n) for Iron (2·8·14·2): which ring is on the outside?",
          "Hint 2: Ionization always removes electrons from the highest-energy orbital in the ion/atom — for Period 4 transition metals, that is the n=4 (4s) orbital.",
          "Hint 3: Remove the 2 electrons in 4s² from [Ar] 3d⁶ 4s². What configuration remains for Fe²⁺, and which electron leaves next to make Fe³⁺?",
        ],
        diagnosticQuestion:
          "Try again with that hint: if neutral Fe is [Ar] 3d⁶ 4s² (shells 2·8·14·2) and loses its two n=4 electrons first, what is the electron configuration of Fe²⁺?",
        visualizerFocus: { elementSlug: "iron", viewMode: "subshells" },
        modelCaveat: buildModelCaveat(iron),
        citations: ironCitations,
      };
    }

    if (isCorrect4sAnswer) {
      return {
        mode: "local_coach",
        sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
        reply:
          "Spot on! Iron (Fe, Z=26, neutral ground state [Ar] 3d⁶ 4s²) loses its two 4s (n=4) electrons first when forming Fe²⁺, giving [Ar] 3d⁶. Even though 4s is populated before 3d in K and Ca, once the 3d subshell is occupied in transition metals, 3d orbitals penetrate closer to the nucleus and sit lower in energy than the more diffuse n=4 (4s) orbital. To form Fe³⁺, Iron then loses the one doubly-occupied 3d electron ([↑↓] → [↑]) to reach the extra-stable half-filled [Ar] 3d⁵ configuration (five unpaired 3d electrons).",
        misconceptionAddressed:
          "Key distinction reinforced: Aufbau textbook filling order is a heuristic across different elements, whereas ionization removes electrons from the highest-n / highest-energy orbital (4s before 3d) in the actual transition-metal atom.",
        hints: [
          "Inspect Iron's Subshell Orbitals (s/p/d/f): in neutral Fe, 3d⁶ is [↑↓] [↑] [↑] [↑] [↑] and 4s² is [↑↓].",
          "In Fe²⁺ ([Ar] 3d⁶), the 4s box is empty and 4 of the 3d boxes remain singly occupied (4 unpaired electrons).",
          "In Fe³⁺ ([Ar] 3d⁵), all five 3d boxes hold one parallel-spin electron [↑] [↑] [↑] [↑] [↑].",
        ],
        diagnosticQuestion:
          "Follow-up check: Looking at Fe²⁺ ([Ar] 3d⁶) vs Fe³⁺ ([Ar] 3d⁵), why is oxidizing Fe²⁺ to Fe³⁺ relatively favorable in aqueous/biological chemistry?",
        visualizerFocus: { elementSlug: "iron", viewMode: "subshells" },
        modelCaveat: buildModelCaveat(iron),
        citations: ironCitations,
      };
    }

    // Direct question asking "Why does Fe2+ lose 4s electrons first?"
    return {
      mode: "local_coach",
      sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
      reply:
        level === "intro"
          ? "In neutral Iron (Fe, Z=26, shells 2·8·14·2), the two 4s electrons sit in the 4th principal shell (n=4), while the six 3d electrons sit in the 3rd shell (n=3). When Iron forms the Fe²⁺ ion, the outermost n=4 (4s²) electrons are farthest from the nucleus and highest in energy, so they are removed first, leaving [Ar] 3d⁶."
          : "Neutral Iron (Fe, Z=26) has ground-state configuration [Ar] 3d⁶ 4s² (1st ionization energy 762.5 kJ/mol). Although 4s fills before 3d in potassium and calcium, as nuclear charge Z increases across Period 4 the compact 3d orbitals drop below the more spatially extended 4s orbital in energy. Because the 4s (n=4) electrons remain farthest from the nucleus and highest in energy in the populated transition metal, ionizing Fe → Fe²⁺ removes the two 4s electrons first to give [Ar] 3d⁶ (with 4 unpaired 3d electrons). Removing one more electron from the single paired 3d orbital ([↑↓] [↑] [↑] [↑] [↑] → [↑] [↑] [↑] [↑] [↑]) produces Fe³⁺ ([Ar] 3d⁵), relieving pairing repulsion in a half-filled d⁵ subshell.",
      misconceptionAddressed:
        "Common misconception: Assuming 3d electrons leave first because '3d fills after 4s.' Orbital energies shift once 3d is occupied: n=4 (4s) is higher in energy than n=3 (3d) in neutral Fe, so 4s² leaves first.",
      hints: [
        "Hint 1: Switch the visualizer on the right to Iron (Fe) and toggle between Bohr Shells (2·8·14·2) and Subshell Orbitals (3d⁶ and 4s²).",
        "Hint 2: Count the unpaired arrows in Iron's 3d⁶ subshell boxes: [↑↓] [↑] [↑] [↑] [↑] gives 4 unpaired electrons.",
        "Hint 3: Notice why Fe³⁺ ([Ar] 3d⁵) is also common: removing the paired ↓ electron from the first 3d box leaves a symmetric, half-filled 3d⁵ subshell.",
      ],
      diagnosticQuestion:
        "Quick check on Iron's subshell boxes: in Fe²⁺ ([Ar] 3d⁶), how many unpaired electrons remain across the five 3d orbital boxes?",
      visualizerFocus: { elementSlug: "iron", viewMode: "subshells" },
      modelCaveat: buildModelCaveat(iron),
      citations: ironCitations,
    };
  }

  // Case 2: Oxygen unpaired electrons / Hund's rule / weak or wrong student answer
  const isOxygenTopic =
    activeElement.slug === "oxygen" ||
    /\b(oxygen|2p4|unpaired|paramagnet|hund)\b/i.test(rawText);

  if (isOxygenTopic && activeElement.slug === "oxygen") {
    const oxygen = getElementBySlug("oxygen");
    const oxCitations = getAllowedCitations([oxygen]);

    // Check if the student gave a weak/wrong answer about oxygen's unpaired electrons
    const wrongUnpairedClaim =
      /\b(zero|0|no\s+unpaired|all\s+paired|two\s+full\s+boxes|four\s+unpaired|4\s+unpaired|six\s+unpaired|6\s+unpaired|because\s+it\s+needs\s+2\s+bonds|because\s+it\s+has\s+2\s+shells|because\s+group\s+2|pair\s+up\s+first)\b/i.test(
        rawText
      ) ||
      (/^\s*(0|1|3|4|6|8)\s*(unpaired)?\s*$/i.test(rawText)) ||
      (/\b(i\s+don'?t\s+know|not\s+sure|maybe\s+they\s+pair|pair\s+in\s+2px)\b/i.test(rawText));

    const correctUnpairedAnswer =
      /\b(2\s+unpaired|two\s+unpaired|hund'?s\s+rule|singly\s+first|separate\s+(orbitals|boxes)|one\s+in\s+each.*then\s+pair)\b/i.test(
        rawText
      ) && !/\bwhy\s+does\s+oxygen\b/i.test(rawText);

    if (wrongUnpairedClaim) {
      const nextHintStep = Math.min(2, Math.max(0, hintIndex));
      const graduatedHints = [
        "Hint 1 (Count the 2p boxes and electrons): Oxygen's ground-state configuration is 1s² 2s² 2p⁴. The 1s² and 2s² subshells are completely full ([↑↓]). That leaves 4 electrons to place inside the three equal-energy 2p orbital boxes: [ ] [ ] [ ].",
        "Hint 2 (Why pairing early is unfavorable — Hund's rule): Electrons are negatively charged and repel each other. Putting two electrons into the same 2p box while another 2p box of the exact same energy sits empty wastes electrostatic energy. Try placing the first 3 electrons one per box with parallel spins: [↑] [↑] [↑].",
        "Hint 3 (Place the 4th electron): Now place the 4th 2p electron into the first box with opposite spin: [↑↓] [↑] [↑]. How many boxes now contain a single unpaired arrow (↑)?",
      ];
      return {
        mode: "local_coach",
        sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
        reply:
          "Not quite — let's pause before giving away the final answer and examine what happens inside the 2p subshell. A very common intuition is either to pair the 4 electrons into two boxes ([↑↓] [↑↓] [ · ]) or to confuse total valence electrons (6 in n=2) with unpaired electrons.",
        misconceptionAddressed:
          "Misconception addressed: Pairing electrons before every equal-energy (degenerate) orbital has one electron, or equating the 6 outer-shell electrons (2s² 2p⁴) with the number of unpaired electrons. By Hund's rule, degenerate 2p orbitals fill singly with parallel spins (↑) before any orbital is doubly occupied (↑↓).",
        hints: graduatedHints.slice(0, nextHintStep + 2),
        diagnosticQuestion:
          "Using that hint: if the first 3 electrons in 2p⁴ go one into each of the three 2p boxes ([↑] [↑] [↑]), where must the 4th electron go, and how many unpaired (↑) electrons are left?",
        visualizerFocus: { elementSlug: "oxygen", viewMode: "subshells" },
        modelCaveat: buildModelCaveat(oxygen),
        citations: oxCitations,
      };
    }

    if (correctUnpairedAnswer) {
      return {
        mode: "local_coach",
        sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
        reply:
          "Exactly right! Oxygen (Z=8, 1s² 2s² 2p⁴) has 2 unpaired electrons. Its 1s² ([↑↓]) and 2s² ([↑↓]) subshells are filled, leaving 4 electrons for the three degenerate 2p orbitals (2px, 2py, 2pz). By Hund's rule, the first three 2p electrons occupy separate orbitals with parallel spins ([↑] [↑] [↑]) to minimize electron-electron repulsion and maximize exchange stabilization. The 4th electron then pairs in the first 2p orbital with opposite spin by the Pauli exclusion principle, giving [↑↓] [↑] [↑] — one paired orbital and two singly occupied orbitals (2 unpaired e⁻).",
        misconceptionAddressed:
          "Notice how the two views in Elementa's visualizer complement each other: the Bohr Shells (n) view shows 6 total valence electrons in n=2 (2·6), while the Subshell Orbitals (s/p/d/f) view reveals the 2s² [↑↓] and 2p⁴ [↑↓] [↑] [↑] spin pairing.",
        hints: [
          "Model boundary note: Atomic oxygen (O) has 2 unpaired 2p electrons ([↑↓] [↑] [↑]). Molecular dioxygen (O₂) is also paramagnetic (a liquid O₂ stream is deflected by a magnet), which requires molecular orbital (MO) theory (two unpaired electrons in degenerate π*₂p antibonding orbitals) rather than simple Lewis dot pairs!",
        ],
        diagnosticQuestion:
          "Want to test a related Period 4 transition-metal puzzle next? Try asking: \"Why does Fe²⁺ lose 4s electrons before 3d?\"",
        visualizerFocus: { elementSlug: "oxygen", viewMode: "subshells" },
        modelCaveat: buildModelCaveat(oxygen),
        citations: oxCitations,
      };
    }

    // Question asking why oxygen has two unpaired electrons
    return {
      mode: "local_coach",
      sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
      reply:
        level === "intro"
          ? "Oxygen (O, atomic number Z=8) has 8 electrons: 2 in the inner shell (1s²) and 6 in the outer n=2 shell (2s² 2p⁴). In the Subshell Orbitals diagram on the right, the 2s subshell holds 1 pair ([↑↓]), and the 2p subshell has 3 equal-energy boxes holding 4 electrons. Because electrons repel each other, the first 3 go into separate 2p boxes ([↑] [↑] [↑]) before the 4th pairs up ([↑↓] [↑] [↑]), leaving 2 unpaired electrons."
          : "Oxygen (O, Z=8) has the ground-state electron configuration 1s² 2s² 2p⁴. The 1s and 2s orbitals each hold a spin-paired couple ([↑↓]). The remaining 4 electrons occupy the three degenerate 2p orbitals (2px, 2py, 2pz). By Hund's rule of maximum multiplicity, electrons occupy equal-energy orbitals singly with parallel spins before pairing up, because occupying spatially separate orbitals reduces Coulomb repulsion and gains exchange stabilization. Placing 4 electrons across 3 boxes gives [↑↓] [↑] [↑] — one doubly occupied orbital and two singly occupied orbitals, so atomic oxygen has exactly 2 unpaired electrons.",
      misconceptionAddressed:
        "Why the Bohr ring diagram alone isn't enough: the Bohr Shells (n) view groups all 6 valence electrons on a single n=2 ring (2·6). Switching to Subshell Orbitals (s/p/d/f) splits n=2 into 2s² ([↑↓]) and 2p⁴ ([↑↓] [↑] [↑]), making the 2 unpaired electrons visible.",
      hints: [
        "Hint 1: In the visualizer, click 'Subshell Orbitals (s/p/d/f)' to see Oxygen's 1s², 2s², and 2p⁴ boxes.",
        "Hint 2: Pauli exclusion limits each box to 2 electrons of opposite spin (↑↓); Hund's rule puts 1 electron (↑) in each 2p box before adding the 4th.",
        "Hint 3: Note on simplified models: atomic O is paramagnetic due to its 2p⁴ ([↑↓] [↑] [↑]) configuration; bulk liquid O₂ paramagnetism arises from two unpaired electrons in π*₂p antibonding molecular orbitals.",
      ],
      diagnosticQuestion:
        "Diagnostic check to test your mental model: What would happen if a student placed all 4 of Oxygen's 2p electrons as two pairs ([↑↓] [↑↓] [ · ]) — which physical principle would that violate, and how many unpaired electrons would Nitrogen (Z=7, 2p³) have by the same rule?",
      visualizerFocus: { elementSlug: "oxygen", viewMode: "subshells" },
      modelCaveat: buildModelCaveat(oxygen),
      citations: oxCitations,
    };
  }

  // Case 3: General element or comparison question in deterministic coach mode
  const spin = computeSubshellSpinBreakdown(activeElement);
  const lastSub = spin.subshellDetails[spin.subshellDetails.length - 1];
  const aufbauNote = AUFBAU_EXCEPTIONS[activeElement.symbol] || null;

  return {
    mode: "local_coach",
    sourceBadge: "Guided Socratic Coach (Local Dataset — Not Live AI)",
    reply: `${activeElement.name} (${activeElement.symbol}, Z=${activeElement.number}) is a Period ${
      activeElement.period
    }${activeElement.group ? `, Group ${activeElement.group}` : " (f-block)"} ${categoryLabel(
      activeElement.category
    ).toLowerCase()} with ground-state configuration ${activeElement.electronConfig} and Bohr shell occupancy ${activeElement.shells.join(
      "·"
    )} (${activeElement.outerShellElectrons} outer-shell e⁻). In the simplified orbital box model, its highest subshell is ${
      lastSub?.label
    }^${lastSub?.count} (${lastSub?.boxDiagram}), giving ${
      spin.totalUnpaired
    } total unpaired electron(s) across the atom.${aufbauNote ? ` Note: ${aufbauNote}` : ""} Key properties: atomic mass ${formatMass(
      activeElement
    )} u, 1st ionization energy ${
      activeElement.ionizationEnergy !== null ? `${activeElement.ionizationEnergy} kJ/mol` : "Not established"
    }, Pauling electronegativity ${
      activeElement.electronegativity !== null ? activeElement.electronegativity : "Not established"
    }, covalent radius ${
      activeElement.atomicRadius !== null ? `${activeElement.atomicRadius} pm` : "Not established"
    }.`,
    misconceptionAddressed:
      aufbauNote ||
      `Remember that concentric Bohr shells (${activeElement.shells.join(
        "·"
      )}) show total electrons per principal quantum number n, while Subshell Orbitals (s/p/d/f) show how Hund's rule distributes spins within each subshell.`,
    hints: [
      `Hint 1: Check ${activeElement.name}'s principal shells (${activeElement.shells.join("·")}) in the Bohr view.`,
      `Hint 2: Switch to Subshell Orbitals (s/p/d/f) to inspect ${lastSub?.label}^${lastSub?.count}: ${lastSub?.boxDiagram}.`,
      `Hint 3: Compare ${activeElement.name}'s periodic trends with its Period ${activeElement.period} neighbours using the reference links below.`,
    ],
    diagnosticQuestion: `Check your understanding of ${activeElement.name}: based on ${lastSub?.label}^${lastSub?.count} (${lastSub?.boxDiagram}), how many electrons in ${lastSub?.label} are unpaired, and how does that relate to its behavior as a ${categoryLabel(
      activeElement.category
    ).toLowerCase()}?`,
    visualizerFocus: {
      elementSlug: activeElement.slug,
      viewMode: "subshells",
    },
    modelCaveat: buildModelCaveat(activeElement),
    citations,
  };
}

export const MAX_MESSAGE_CHARS = 1200;
export const MAX_HISTORY_TURNS = 8;

export function buildTutorPrompt({
  message,
  primaryElement,
  referencedElement,
  compareElements = [],
  level = "ap",
  stage = "guided",
  quizContext = null,
  history = [],
}) {
  const activeElements = [];
  const seen = new Set();
  for (const el of [referencedElement, primaryElement, ...compareElements].filter(Boolean)) {
    if (!seen.has(el.slug)) {
      seen.add(el.slug);
      activeElements.push(el);
    }
  }

  const elementBlocks = activeElements.map((el) => {
    const spin = computeSubshellSpinBreakdown(el);
    const article = buildArticle(el);
    const aufbau = AUFBAU_EXCEPTIONS[el.symbol] ? `\n  Aufbau Exception: ${AUFBAU_EXCEPTIONS[el.symbol]}` : "";
    return [
      `Element: ${el.name} (${el.symbol}, Z=${el.number}, slug="${el.slug}")`,
      `  Category: ${categoryLabel(el.category)} | Period ${el.period} | Group ${el.group ?? "f-block"} | Block: ${el.block}-block | Phase at STP: ${el.phase}`,
      `  Standard Atomic Mass: ${formatMass(el)} u${el.synthetic ? " (synthetic radioisotope mass number)" : ""}`,
      `  Ground-State Electron Configuration: ${el.electronConfig}`,
      `  Bohr Shell Totals (n=1..${el.shells.length}): ${el.shells.join("·")} (Outer-shell electrons: ${el.outerShellElectrons})`,
      `  Subshell Spin Breakdown (Hund's rule box model, total unpaired = ${spin.totalUnpaired}): ${spin.subshellDetails
        .map((s) => `${s.label}^${s.count} ${s.boxDiagram} (${s.unpaired} unpaired)`)
        .join("; ")}${aufbau}`,
      `  Periodic Trends: Electronegativity=${el.electronegativity ?? "Not established"}, 1st Ionization Energy=${
        el.ionizationEnergy !== null ? `${el.ionizationEnergy} kJ/mol` : "Not established"
      }, Covalent Radius=${el.atomicRadius !== null ? `${el.atomicRadius} pm` : "Not established"}`,
      `  Key Highlight: ${el.highlight}`,
      `  Allowed Citation URLs: ${article.citations.map((c) => `${c.source}: ${c.url}`).join(" | ")}`,
    ].join("\n");
  });

  const recentTurns = (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_TURNS)
    .map((h) => `${h.role === "assistant" ? "Tutor" : "Student"}: ${String(h.content || "").slice(0, 500)}`)
    .join("\n");

  return [
    "You are the Elementa Conversational Chemistry Tutor.",
    `Student level: ${level} (intro = high-school shells & trends; ap = AP/IB/General Chemistry subshells, Hund's rule, Pauli exclusion, Z_eff, transition metal 4s vs 3d ionization; advanced = exchange energy, radial penetration, relativistic effects).`,
    `Pedagogical stage: ${stage}.`,
    "",
    "STRICT SCIENTIFIC & PEDAGOGICAL RULES:",
    "1. Ground every numeric value and electron configuration strictly in the canonical dataset context below. If a value is 'Not established', state that honestly rather than guessing.",
    "2. Connect your explanation to Elementa's two interactive visualizer modes: 'Bohr Shells (n)' (concentric rings showing shell totals) and 'Subshell Orbitals (s/p/d/f)' (orbital boxes showing spin pairing ↑↓ and Hund's rule single occupancy ↑).",
    "3. Be explicit about simplified models: Bohr rings and orbital boxes are 2D teaching representations of 3D quantum wavefunctions (ψ²). For atomic O (1s² 2s² 2p⁴), 2p⁴ has [↑↓] [↑] [↑] (2 unpaired e⁻ by Hund's rule); note that bulk O₂ paramagnetism arises from π*₂p antibonding molecular orbitals. For Fe ([Ar] 3d⁶ 4s²), explain why the outermost n=4 (4s²) electrons are lost before 3d when forming Fe²⁺ ([Ar] 3d⁶).",
    "4. Socratic coaching: When a student gives a weak, incomplete, or wrong answer, DO NOT immediately dump the final giveaway answer; diagnose the specific misconception, validate what they noticed, provide graduated hints, and ask a short follow-up diagnostic question.",
    "5. Citations: Cite ONLY URLs from the Allowed Citation URLs list below. Never invent or guess external links.",
    "6. Safety: Never provide actionable instructions for dangerous chemical synthesis, explosives, toxins, or self-harm.",
    "",
    "CANONICAL DATASET CONTEXT:",
    elementBlocks.join("\n\n"),
    quizContext?.prompt ? `\nMISSED QUIZ CONTEXT:\nQuestion: ${quizContext.prompt}\nStudent chose: ${quizContext.chosen || "N/A"}` : "",
    recentTurns ? `\nCONVERSATION HISTORY:\n${recentTurns}` : "",
    `\nSTUDENT MESSAGE:\n${message}`,
    "",
    "Respond strictly as a JSON object with keys:",
    '- "reply": string (clear, encouraging explanation or Socratic response)',
    '- "misconceptionAddressed": string or null (specific misconception clarified, if any)',
    '- "hints": array of 1 to 3 graduated hint strings',
    '- "diagnosticQuestion": string (a short diagnostic or follow-up check question)',
    '- "visualizerFocus": { "elementSlug": string, "viewMode": "bohr" | "subshells" }',
    '- "modelCaveat": string (explicit note on simplified models / uncertainty)',
    '- "citationUrls": array of URLs chosen ONLY from the Allowed Citation URLs above',
  ]
    .filter(Boolean)
    .join("\n");
}

export const TUTOR_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    misconceptionAddressed: { anyOf: [{ type: "string" }, { type: "null" }] },
    hints: { type: "array", items: { type: "string" } },
    diagnosticQuestion: { type: "string" },
    visualizerFocus: {
      type: "object",
      properties: {
        elementSlug: { type: "string" },
        viewMode: { type: "string", enum: ["bohr", "subshells"] },
      },
    },
    modelCaveat: { type: "string" },
    citationUrls: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "hints", "diagnosticQuestion"],
};

/**
 * Sanitizes a raw provider JSON or text response and enforces the canonical citation whitelist.
 */
export function sanitizeTutorResponse(raw, activeElements) {
  const fallbackEl = activeElements[0] || getElementBySlug("oxygen");
  const allowedCitations = getAllowedCitations(activeElements);
  const allowedByUrl = new Map(allowedCitations.map((c) => [c.url, c]));

  let parsed = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        parsed = { reply: trimmed };
      }
    } else {
      parsed = { reply: trimmed };
    }
  }

  if (!parsed || typeof parsed !== "object") {
    parsed = { reply: String(raw || "") };
  }

  const replyText = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  const safety = checkChemistrySafety(replyText);
  if (!safety.safe) {
    return {
      reply: safety.refusal,
      misconceptionAddressed: null,
      hints: [],
      diagnosticQuestion: null,
      visualizerFocus: { elementSlug: fallbackEl.slug, viewMode: "bohr" },
      modelCaveat: buildModelCaveat(fallbackEl),
      citations: allowedCitations.slice(0, 4),
    };
  }

  const hints = Array.isArray(parsed.hints)
    ? parsed.hints.filter((h) => typeof h === "string" && h.trim().length > 0).slice(0, 3)
    : [];

  const focusSlug =
    parsed.visualizerFocus?.elementSlug && getElementBySlug(parsed.visualizerFocus.elementSlug)
      ? getElementBySlug(parsed.visualizerFocus.elementSlug).slug
      : fallbackEl.slug;
  const focusViewMode = parsed.visualizerFocus?.viewMode === "bohr" ? "bohr" : "subshells";

  // Filter citations strictly against the canonical dataset URLs
  const requestedUrls = Array.isArray(parsed.citationUrls) ? parsed.citationUrls : [];
  const verifiedCitations = requestedUrls.map((u) => allowedByUrl.get(u)).filter(Boolean);
  const finalCitations = verifiedCitations.length > 0 ? verifiedCitations : allowedCitations.slice(0, 4);

  return {
    reply: replyText || `Let's examine ${fallbackEl.name} (${fallbackEl.symbol}, ${fallbackEl.electronConfig}).`,
    misconceptionAddressed:
      typeof parsed.misconceptionAddressed === "string" && parsed.misconceptionAddressed.trim()
        ? parsed.misconceptionAddressed.trim()
        : null,
    hints,
    diagnosticQuestion:
      typeof parsed.diagnosticQuestion === "string" && parsed.diagnosticQuestion.trim()
        ? parsed.diagnosticQuestion.trim()
        : null,
    visualizerFocus: {
      elementSlug: focusSlug,
      viewMode: focusViewMode,
    },
    modelCaveat:
      typeof parsed.modelCaveat === "string" && parsed.modelCaveat.trim()
        ? parsed.modelCaveat.trim()
        : buildModelCaveat(getElementBySlug(focusSlug) || fallbackEl),
    citations: finalCitations,
  };
}

export {
  ELEMENTS,
  CATEGORY_META,
  categoryLabel,
  formatMass,
  buildArticle,
  buildComparison,
  resolveComparisonSlugs,
  getElementBySlug,
  getElementBySymbol,
  AUFBAU_EXCEPTIONS,
};