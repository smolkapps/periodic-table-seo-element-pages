/**
 * Client-side glue for the /compare page.
 *
 * The page ships a fully static default comparison (rendered server-side) so
 * crawlers and no-JS visitors still see real content. This script progressively
 * enhances it: reading the element pickers, re-rendering the comparison table
 * from the SAME pure `buildComparison` used at build time, and keeping the URL
 * (`?ids=iron,gold,oxygen`) in sync so a comparison can be linked and shared.
 */

import {
  buildComparison,
  resolveComparisonSlugs,
  MIN_COMPARE,
  type Comparison,
} from "../lib/compare";
import { CATEGORY_META, type Element } from "../lib/elements";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render a comparison to the same table markup the server emits. */
function renderComparison(cmp: Comparison): string {
  const heads = cmp.elements
    .map((el) => {
      const accent = CATEGORY_META[el.category].cssVar;
      return `<th scope="col"><a href="/element/${el.slug}/"><span class="cmp-sym" style="--cmp-accent:var(${accent});">${escapeHtml(
        el.symbol,
      )}</span> ${escapeHtml(el.name)}</a></th>`;
    })
    .join("");

  const body = cmp.rows
    .map((row) => {
      const cells = row.values
        .map((v, i) => {
          const cls = row.maxIndex === i ? ' class="cmp-max"' : "";
          return `<td${cls}>${escapeHtml(v)}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
    })
    .join("");

  return `<table class="cmp-table"><thead><tr><td></td>${heads}</tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * Decide how to seed the pickers for each slot from a deep-linked selection.
 *
 * Mandatory slots (index < MIN_COMPARE) must always hold a real element slug —
 * their `<select>` has no empty "None" option, so writing "" would leave the
 * control at selectedIndex = -1. Optional slots beyond the resolved selection
 * are cleared to "" (they DO have a "None" option). Returns one value per slot,
 * or `null` when the selection is too short to apply — in which case the caller
 * keeps the server-rendered defaults rather than degrading below the no-JS view.
 */
export function selectionValues(
  selection: Element[],
  slotCount: number,
): string[] | null {
  if (selection.length < MIN_COMPARE) return null;
  return Array.from({ length: slotCount }, (_, i) =>
    i < selection.length ? selection[i]!.slug : "",
  );
}

/**
 * Build the message shown when the current picks don't yield a comparison.
 * Distinguishes "not enough picked" from "picked the same element twice", which
 * the naive "pick at least two" wording gets wrong.
 */
export function hintForSelection(
  chosenSlugs: string[],
  resolved: Element[],
): string {
  if (resolved.length >= MIN_COMPARE) return "";
  const distinct = new Set(chosenSlugs.map((s) => s.toLowerCase())).size;
  return chosenSlugs.length >= MIN_COMPARE && distinct < MIN_COMPARE
    ? "Pick two different elements to compare."
    : "Pick at least two elements to compare.";
}

export function initCompare(): void {
  const selects = Array.from(
    document.querySelectorAll<HTMLSelectElement>(".js-compare-select"),
  );
  const result = document.querySelector<HTMLElement>(".js-compare-result");
  if (selects.length === 0 || !result) return;
  const target = result;

  function chosenSlugs(): string[] {
    return selects.map((s) => s.value).filter((v) => v.length > 0);
  }

  function syncUrl(els: Element[]): void {
    const ids = els.map((e) => e.slug).join(",");
    const url = new URL(window.location.href);
    url.searchParams.set("ids", ids);
    history.replaceState(null, "", url);
  }

  function update(): void {
    const chosen = chosenSlugs();
    const els = resolveComparisonSlugs(chosen);
    if (els.length < MIN_COMPARE) {
      target.innerHTML = `<p class="cmp-hint">${hintForSelection(chosen, els)}</p>`;
      return;
    }
    target.innerHTML = renderComparison(buildComparison(els));
    syncUrl(els);
  }

  // Apply an initial selection from ?ids= (falls back to the server default).
  const params = new URLSearchParams(window.location.search);
  const idsParam = params.get("ids");
  if (idsParam) {
    const initial = resolveComparisonSlugs(idsParam.split(","));
    const values = selectionValues(initial, selects.length);
    if (values) {
      // A valid deep link: seed every picker from it.
      values.forEach((v, i) => {
        if (selects[i]) selects[i]!.value = v;
      });
    }
    // Whether or not the deep link was applied, re-render from the current
    // selects. A too-short/invalid ?ids leaves the server defaults untouched,
    // so the page never degrades below the no-JS comparison, and the URL is
    // canonicalised to whatever is actually shown.
    update();
  }

  for (const sel of selects) sel.addEventListener("change", update);
}
