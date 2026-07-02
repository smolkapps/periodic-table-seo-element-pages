// @vitest-environment jsdom
/**
 * Behavioural tests for the /compare client script (the shareability feature).
 *
 * These exercise the real `initCompare()` against a jsdom DOM that mirrors the
 * Astro page markup, covering `?ids=` deep-link parsing, URL sync, and the
 * deep-link edge cases (single/invalid ids, duplicate picks) that previously
 * had zero coverage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  initCompare,
  selectionValues,
  hintForSelection,
} from "../src/scripts/compare-ui";
import { COMPARE_OPTIONS, MAX_COMPARE } from "../src/lib/compare";
import { getElementBySlug } from "../src/lib/elements";

const el = (slug: string) => getElementBySlug(slug)!;

/** Build the same markup the Astro page ships: MAX_COMPARE pickers + result. */
function buildDom(defaults: string[]): void {
  const options = COMPARE_OPTIONS.map(
    (o) => `<option value="${o.slug}">${o.number} · ${o.symbol} — ${o.name}</option>`,
  ).join("");

  const pickers = Array.from({ length: MAX_COMPARE }, (_, i) => {
    const none = i >= 2 ? '<option value="">None</option>' : "";
    return `<label><select class="js-compare-select" name="el${i + 1}">${none}${options}</select></label>`;
  }).join("");

  document.body.innerHTML =
    `<form>${pickers}</form>` +
    `<div class="js-compare-result cmp-result" aria-live="polite"></div>`;

  const selects = document.querySelectorAll<HTMLSelectElement>(
    ".js-compare-select",
  );
  defaults.forEach((slug, i) => {
    if (selects[i]) selects[i]!.value = slug;
  });
}

function go(ids: string | null, defaults = ["iron", "gold", "oxygen"]): void {
  buildDom(defaults);
  const url = ids === null ? "/compare/" : `/compare/?ids=${ids}`;
  window.history.replaceState({}, "", url);
  initCompare();
}

const selects = () =>
  Array.from(document.querySelectorAll<HTMLSelectElement>(".js-compare-select"));
const result = () =>
  document.querySelector<HTMLElement>(".js-compare-result")!;
/** The decoded `ids` param currently in the URL (commas survive the round-trip). */
const sharedIds = () =>
  new URLSearchParams(window.location.search).get("ids");

describe("selectionValues (pure)", () => {
  it("returns null when the selection is shorter than the minimum", () => {
    expect(selectionValues([el("iron")], 3)).toBeNull();
    expect(selectionValues([], 3)).toBeNull();
  });

  it("seeds mandatory slots with slugs and clears only the optional tail", () => {
    expect(selectionValues([el("iron"), el("gold")], 3)).toEqual([
      "iron",
      "gold",
      "",
    ]);
    expect(selectionValues([el("iron"), el("gold"), el("oxygen")], 3)).toEqual([
      "iron",
      "gold",
      "oxygen",
    ]);
  });
});

describe("hintForSelection (pure)", () => {
  it("distinguishes 'not enough' from 'same element twice'", () => {
    expect(hintForSelection(["iron"], [el("iron")])).toContain("at least two");
    expect(hintForSelection(["iron", "iron"], [el("iron")])).toContain(
      "two different",
    );
  });

  it("is empty once a valid comparison resolves", () => {
    expect(hintForSelection(["iron", "gold"], [el("iron"), el("gold")])).toBe(
      "",
    );
  });
});

describe("initCompare — ?ids= deep links", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the shared comparison and canonicalises the URL", () => {
    go("iron,gold");
    const html = result().innerHTML;
    expect(html).toContain("<table");
    expect(html).toContain("/element/iron/");
    expect(html).toContain("/element/gold/");
    expect(html).not.toContain("/element/oxygen/");
    // URL is synced to the resolved selection.
    expect(sharedIds()).toBe("iron,gold");
    // Pickers reflect the deep link; the optional tail is the "None" option
    // (selectedIndex 0), never left at -1.
    const s = selects();
    expect(s[0]!.value).toBe("iron");
    expect(s[1]!.value).toBe("gold");
    expect(s[2]!.value).toBe("");
    for (const sel of s) expect(sel.selectedIndex).toBeGreaterThanOrEqual(0);
  });

  it("renders all three when three valid ids are shared", () => {
    go("oxygen,iron,gold");
    const html = result().innerHTML;
    for (const slug of ["oxygen", "iron", "gold"]) {
      expect(html).toContain(`/element/${slug}/`);
    }
    expect(sharedIds()).toBe("oxygen,iron,gold");
  });

  it("does not degrade below the no-JS default table for a single ?ids", () => {
    go("iron");
    const html = result().innerHTML;
    // Still a real comparison table (the server default trio), not a hint.
    expect(html).toContain("<table");
    expect(html).not.toContain("cmp-hint");
    expect(html).toContain("/element/iron/");
    expect(html).toContain("/element/gold/");
    expect(html).toContain("/element/oxygen/");
    // No picker is stranded at selectedIndex = -1.
    for (const sel of selects()) {
      expect(sel.selectedIndex).toBeGreaterThanOrEqual(0);
    }
    // URL canonicalised to the shown defaults.
    expect(sharedIds()).toBe("iron,gold,oxygen");
  });

  it("drops an invalid id and still shows the default table (?ids=iron,typo)", () => {
    go("iron,typo");
    const html = result().innerHTML;
    expect(html).toContain("<table");
    expect(html).not.toContain("cmp-hint");
    // Falls back to the full default trio rather than a lone element.
    expect(sharedIds()).toBe("iron,gold,oxygen");
    for (const sel of selects()) {
      expect(sel.selectedIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("re-renders on picker change and syncs the URL", () => {
    go("iron,gold");
    const s = selects();
    s[2]!.value = "helium";
    s[2]!.dispatchEvent(new Event("change"));
    const html = result().innerHTML;
    expect(html).toContain("/element/helium/");
    expect(sharedIds()).toBe("iron,gold,helium");
  });

  it("shows a 'two different' hint when the same element is picked twice", () => {
    go(null);
    const s = selects();
    s[0]!.value = "iron";
    s[1]!.value = "iron";
    s[2]!.value = ""; // optional slot cleared
    s[1]!.dispatchEvent(new Event("change"));
    const html = result().innerHTML;
    expect(html).toContain("cmp-hint");
    expect(html).toContain("two different");
    expect(html).not.toContain("<table");
  });
});
