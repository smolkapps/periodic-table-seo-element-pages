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

export function initCompare(): void {
  const selects = Array.from(
    document.querySelectorAll<HTMLSelectElement>(".js-compare-select"),
  );
  const result = document.querySelector<HTMLElement>(".js-compare-result");
  if (selects.length === 0 || !result) return;
  const target = result;

  function currentElements(): Element[] {
    const slugs = selects.map((s) => s.value).filter((v) => v.length > 0);
    return resolveComparisonSlugs(slugs);
  }

  function syncUrl(els: Element[]): void {
    const ids = els.map((e) => e.slug).join(",");
    const url = new URL(window.location.href);
    url.searchParams.set("ids", ids);
    history.replaceState(null, "", url);
  }

  function update(): void {
    const els = currentElements();
    if (els.length < 2) {
      target.innerHTML =
        '<p class="cmp-hint">Pick at least two elements to compare.</p>';
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
    initial.forEach((el, i) => {
      if (selects[i]) selects[i]!.value = el.slug;
    });
    // Clear any remaining pickers so they read as "None".
    for (let i = initial.length; i < selects.length; i++) {
      selects[i]!.value = "";
    }
    update();
  }

  for (const sel of selects) sel.addEventListener("change", update);
}
