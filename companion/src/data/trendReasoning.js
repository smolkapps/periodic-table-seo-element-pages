import { ELEMENTS, getIonizationExceptionExplanation } from "./elementsData.js";

export const TREND_EXPLORER_METRICS = Object.freeze([
  {
    key: "electronegativity",
    label: "Pauling Electronegativity",
    unit: "",
    principle:
      "Pauling electronegativity (dimensionless scale) estimates an atom's relative attraction for shared electrons inside a covalent bond—distinct from isolated-atom ionization energy.",
  },
  {
    key: "ionizationEnergy",
    label: "1st Ionization Energy",
    unit: "kJ/mol",
    principle:
      "First ionization energy (kJ/mol, NIST ASD) measures X(g) → X⁺(g) + e⁻: removing the single most loosely bound electron from isolated neutral gas-phase atoms (per mole).",
  },
  {
    key: "atomicRadius",
    label: "Reference Covalent Radius",
    unit: "pm",
    principle:
      "Reference covalent radii (pm, Cordero et al.) summarize crystallographic bond-distance data and interpolated estimates; distinct from van der Waals radii.",
  },
]);

/**
 * @param {any} el
 * @param {"electronegativity" | "ionizationEnergy" | "atomicRadius" | string} metricKey
 * @returns {number | null}
 */
export function getTrendMetricValue(el, metricKey) {
  if (!el) return null;
  const raw =
    metricKey === "ionizationEnergy"
      ? el.ionizationEnergy
      : metricKey === "atomicRadius"
      ? el.atomicRadius
      : el.electronegativity;
  return raw !== null && Number.isFinite(raw) ? raw : null;
}

/**
 * @param {number} val
 * @param {string} metricKey
 */
export function formatTrendMetricValue(val, metricKey) {
  if (metricKey === "ionizationEnergy") return `${val} kJ/mol`;
  if (metricKey === "atomicRadius") return `${val} pm`;
  return String(val);
}

/**
 * @param {number} diff
 * @param {string} metricKey
 */
function formatTrendDelta(diff, metricKey) {
  const abs = Math.abs(diff);
  if (metricKey === "ionizationEnergy") return `${Number(abs.toFixed(1))} kJ/mol`;
  if (metricKey === "atomicRadius") return `${Math.round(abs)} pm`;
  return String(Number(abs.toFixed(2)));
}

/**
 * Returns the peer elements displayed in TrendExplorerCard along with the semantic series kind.
 * @param {any} element
 * @param {"period" | "group" | string} axisMode
 */
export function getTrendExplorerPeers(element, axisMode = "period") {
  if (!element) {
    return { peers: [], seriesKind: "period", seriesLabel: "Period", shortScope: "Period" };
  }
  if (axisMode !== "group") {
    if (element.ypos > 7) {
      const peers = ELEMENTS.filter((e) => e.category === element.category).sort((a, b) => a.number - b.number);
      const isLanthanide = element.category === "lanthanide";
      return {
        peers,
        seriesKind: "f-series",
        seriesLabel: isLanthanide ? "the lanthanide series (Z=57–71)" : "the actinide series (Z=89–103)",
        shortScope: isLanthanide ? "Lanthanides" : "Actinides",
      };
    }
    return {
      peers: ELEMENTS.filter((e) => e.period === element.period && e.ypos <= 7).sort((a, b) => a.number - b.number),
      seriesKind: "period",
      seriesLabel: `Period ${element.period}`,
      shortScope: `Period ${element.period}`,
    };
  }

  if (element.group !== null) {
    return {
      peers: ELEMENTS.filter((e) => e.group === element.group).sort((a, b) => a.period - b.period),
      seriesKind: "group",
      seriesLabel: `Group ${element.group}`,
      shortScope: `Group ${element.group}`,
    };
  }

  return {
    peers: ELEMENTS.filter((e) => e.period === element.period && (e.ypos <= 7 || e.slug === element.slug)).sort(
      (a, b) => a.number - b.number
    ),
    seriesKind: "period-with-f",
    seriesLabel: `Period ${element.period} main-body peers + ${element.symbol}`,
    shortScope: `Period ${element.period} + ${element.symbol}`,
  };
}

/**
 * Picks 2–3 immediate peer slugs around the active element for side-by-side Compare,
 * preferring established numeric neighbors when a trailing superheavy/noble slot is null.
 */
function pickCompareWindow(peers, currentIdx, metricKey) {
  if (peers.length <= 3) return peers;
  let start = Math.max(0, Math.min(currentIdx - 1, peers.length - 3));
  if (
    start > 0 &&
    currentIdx <= start + 1 &&
    getTrendMetricValue(peers[start + 2], metricKey) === null &&
    getTrendMetricValue(peers[start - 1], metricKey) !== null
  ) {
    start -= 1;
  }
  return peers.slice(start, start + 3);
}

/**
 * Builds an element-specific, numeric physical-chemistry worked example for TrendExplorerCard.
 * @param {any} element
 * @param {"electronegativity" | "ionizationEnergy" | "atomicRadius" | string} metricKey
 * @param {"period" | "group" | string} axisMode
 */
export function buildTrendExplorerAnalysis(element, metricKey = "electronegativity", axisMode = "period") {
  const metric = TREND_EXPLORER_METRICS.find((m) => m.key === metricKey) || TREND_EXPLORER_METRICS[0];
  const { peers, seriesLabel, shortScope } = getTrendExplorerPeers(element, axisMode);
  const empty = { headline: metric.label, seriesSpanLabel: "", summary: metric.principle,
    principle: metric.principle, compareSlugs: [], compareLabel: "", sourceUrl: null };
  if (!element || peers.length === 0) return empty;

  const currentIdx = peers.findIndex((p) => p.slug === element.slug);
  const comparePeers = pickCompareWindow(peers, currentIdx, metric.key);
  const known = peers.filter((p) => getTrendMetricValue(p, metric.key) !== null);
  const missing = peers.filter((p) => getTrendMetricValue(p, metric.key) === null);
  const fmt = (p) => formatTrendMetricValue(/** @type {number} */ (getTrendMetricValue(p, metric.key)), metric.key);
  const byValue = [...known].sort((a, b) => getTrendMetricValue(a, metric.key) - getTrendMetricValue(b, metric.key));
  const low = byValue[0];
  const high = byValue[byValue.length - 1];
  const seriesSpanLabel = known.length > 1
    ? `Known range: ${low.symbol} ${fmt(low)} – ${high.symbol} ${fmt(high)}`
    : low ? `Known: ${low.symbol} ${fmt(low)}` : "No established values";
  const scopeNote = `The displayed scope is ${seriesLabel}; ${known.length} of ${peers.length} entries have reference values in this dataset.`;
  const missingNote = missing.length
    ? ` ${metric.label} is not established here for ${missing.map((p) => p.name).join(", ")}; missing entries are not zero.`
    : "";
  const currentVal = getTrendMetricValue(element, metric.key);
  const result = { ...empty, seriesSpanLabel,
    compareSlugs: comparePeers.map((p) => p.slug), compareLabel: comparePeers.map((p) => p.symbol).join(" · ") };
  if (currentVal === null) return { ...result,
    headline: `${element.name} in ${shortScope}: ${metric.label.toLowerCase()} not established`,
    summary: `${metric.label} is not established in this dataset for ${element.name}. ${scopeNote}${missingNote}` };

  // Explain only the specific light-element examples already used by the comparison lens.
  const exceptionPairs = [["nitrogen", "oxygen"], ["beryllium", "boron"], ["magnesium", "aluminium"]];
  const pair = metric.key === "ionizationEnergy"
    ? exceptionPairs.find((slugs) => slugs.includes(element.slug) && slugs.every((slug) => comparePeers.some((p) => p.slug === slug)))
    : null;
  const exceptionPeer = pair && comparePeers.find((p) => p.slug !== element.slug && pair.includes(p.slug));
  const adjacent = [peers[currentIdx - 1], peers[currentIdx + 1]]
    .find((p) => p && getTrendMetricValue(p, metric.key) !== null);
  const peer = exceptionPeer || adjacent;
  let relation = "";
  if (peer) {
    const diff = currentVal - getTrendMetricValue(peer, metric.key);
    relation = diff === 0
      ? `equal to ${peer.name} (${fmt(peer)}) in this dataset`
      : `${formatTrendDelta(diff, metric.key)} ${diff > 0 ? "higher" : "lower"} than ${peer.name} (${fmt(peer)})`;
  }
  const explanation = pair ? getIonizationExceptionExplanation(comparePeers.filter((p) => pair.includes(p.slug))) : "";
  const valText = formatTrendMetricValue(currentVal, metric.key);
  return { ...result,
    headline: `${element.name} in ${shortScope}: ${valText}${relation ? ` — ${relation}` : ""}`,
    summary: `${element.name}'s ${metric.label.toLowerCase()} is ${valText}${relation ? `, ${relation}` : ""}. ${scopeNote}${missingNote}${explanation ? ` ${explanation}` : ""}`,
    sourceUrl: explanation ? "https://openstax.org/books/chemistry-2e/pages/6-5-periodic-variations-in-element-properties" : null };
}
