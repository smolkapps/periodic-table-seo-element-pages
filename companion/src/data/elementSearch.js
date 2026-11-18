import { ELEMENTS, CATEGORY_META, ELEMENT_SEARCH_ALIASES } from "./elementsData.js";

export const DISCOVERY_SEARCH_CHIPS = Object.freeze([
  { label: "Aluminum / Al", query: "aluminum" },
  { label: "Cesium / Cs", query: "cesium" },
  { label: "Halogens", query: "Group 17" },
  { label: "Noble gases", query: "Group 18" },
  { label: "Period 2", query: "Period 2" },
  { label: "d-block", query: "d-block" },
]);

const ALIAS_DISPLAY_LABELS = Object.freeze({
  aluminum: "Aluminum",
  cesium: "Cesium",
  sulphur: "Sulphur",
});

/**
 * Normalizes a learner search string while preserving chemical subshell/config tokens.
 * @param {string} rawQuery
 */
export function normalizeElementQuery(rawQuery) {
  return String(rawQuery ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Shared element search matcher used across the Periodic Table and All 118 Directory.
 * Supports IUPAC & US/UK spelling aliases (aluminium/aluminum, caesium/cesium, sulfur/sulphur),
 * symbols, atomic numbers (26, #26, Z=26), categories, ground-state configs (2p4, 3d10 4s1),
 * Period N, Group N, and s/p/d/f-block queries without polluting 1-letter substring searches.
 * @param {any} element
 * @param {string} rawQuery
 */
export function matchesElementQuery(element, rawQuery) {
  if (!element) return false;
  const q = normalizeElementQuery(rawQuery);
  if (q.length === 0) return true;

  const atomicNumMatch = q.match(/^(?:#|z\s*=\s*)(\d+)$/);
  if (atomicNumMatch) {
    return element.number === Number(atomicNumMatch[1]);
  }

  const groupMatch = q.match(/^group\s+(\d+)$/);
  if (groupMatch) {
    return element.group === Number(groupMatch[1]);
  }

  const periodMatch = q.match(/^period\s+(\d+)$/);
  if (periodMatch) {
    return element.period === Number(periodMatch[1]);
  }

  const blockMatch = q.match(/^([spdf])(?:-|\s+)block$/);
  if (blockMatch) {
    return element.block === blockMatch[1];
  }

  const catLabel = CATEGORY_META[element.category]?.label || element.category;
  const alias = ELEMENT_SEARCH_ALIASES[element.slug] || "";
  const hay = `${element.name} ${alias} ${element.symbol} ${element.number} ${catLabel} ${element.electronConfig}`.toLowerCase();
  return hay.includes(q);
}

/**
 * Returns the matched alternate spelling label (e.g. "Aluminum", "Cesium", "Sulphur")
 * when a query matched an element via its spelling alias rather than its primary IUPAC name.
 * @param {any} element
 * @param {string} rawQuery
 * @returns {string | null}
 */
export function getMatchedSpellingAlias(element, rawQuery) {
  if (!element) return null;
  const q = normalizeElementQuery(rawQuery);
  if (q.length < 3) return null;
  const aliasRaw = ELEMENT_SEARCH_ALIASES[element.slug];
  if (!aliasRaw) return null;
  const primaryName = element.name.toLowerCase();
  if (primaryName.includes(q)) return null;

  for (const token of aliasRaw.toLowerCase().split(/\s+/)) {
    if (token && token.includes(q)) {
      return ALIAS_DISPLAY_LABELS[token] || token.charAt(0).toUpperCase() + token.slice(1);
    }
  }
  return null;
}

/**
 * Filters all 118 elements using the canonical shared matcher.
 * @param {string} rawQuery
 */
export function filterElementsByQuery(rawQuery) {
  const q = normalizeElementQuery(rawQuery);
  if (q.length === 0) return [...ELEMENTS];
  return ELEMENTS.filter((el) => matchesElementQuery(el, q));
}

/**
 * Optimal string alignment (Damerau-Levenshtein with adjacent transposition cost 1)
 * for recovering from 1-2 character mobile keyboard typos in element names/aliases.
 * @param {string} a
 * @param {string} b
 */
function editDistanceWithTransposition(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

/**
 * Suggests up to `limit` close element matches when a typed name has a 1-2 character typo
 * (e.g. "alumnium" -> Aluminium, "cesuim" -> Caesium, "phosphorous" -> Phosphorus, "nickle" -> Nickel),
 * returning an empty array for unrelated words so suggestions stay honest.
 * @param {string} rawQuery
 * @param {number} [limit=3]
 */
export function findClosestElementMatches(rawQuery, limit = 3) {
  const lettersOnly = normalizeElementQuery(rawQuery).replace(/[^a-z]/g, "");
  if (lettersOnly.length < 4 || lettersOnly.length > 18) return [];

  const scored = [];
  for (const el of ELEMENTS) {
    const aliasTokens = (ELEMENT_SEARCH_ALIASES[el.slug] || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const candidates = [el.name.toLowerCase(), ...aliasTokens];
    let bestDist = Infinity;
    for (const word of candidates) {
      if (Math.abs(word.length - lettersOnly.length) > 2) continue;
      const dist = editDistanceWithTransposition(lettersOnly, word);
      if (dist < bestDist) bestDist = dist;
    }
    if (bestDist <= 2) {
      scored.push({ element: el, dist: bestDist });
    }
  }

  return scored
    .sort((a, b) => a.dist - b.dist || a.element.number - b.element.number)
    .slice(0, limit)
    .map((item) => item.element);
}