/**
 * Unit tests for the periodic-table keyboard-navigation logic (roving
 * tabindex arrow-key movement) in src/lib/grid-nav.ts, exercised against the
 * real 118-element grid.
 */
import { describe, it, expect } from "vitest";
import {
  nextCellIndex,
  firstVisibleIndex,
  isNavKey,
  type NavCell,
} from "../src/lib/grid-nav";
import { ELEMENTS, getElementBySymbol } from "../src/lib/elements";

/** The real table as nav cells (ordered by atomic number, like the DOM). */
function realCells(hiddenSymbols: string[] = []): NavCell[] {
  const hidden = new Set(hiddenSymbols.map((s) => s.toLowerCase()));
  return ELEMENTS.map((el) => ({
    x: el.xpos,
    y: el.ypos,
    hidden: hidden.has(el.symbol.toLowerCase()),
  }));
}

function indexOfSymbol(sym: string): number {
  return getElementBySymbol(sym)!.number - 1;
}

describe("isNavKey", () => {
  it("accepts arrows and Home/End, rejects everything else", () => {
    for (const k of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]) {
      expect(isNavKey(k), k).toBe(true);
    }
    expect(isNavKey("Enter")).toBe(false);
    expect(isNavKey("a")).toBe(false);
    expect(isNavKey("Tab")).toBe(false);
  });
});

describe("nextCellIndex on the real grid", () => {
  const cells = realCells();

  it("ArrowRight walks atomic-number order, including across the period gap", () => {
    // H (1) -> He (2): visually far apart (x=1 -> x=18) but adjacent by number.
    expect(nextCellIndex(cells, indexOfSymbol("H"), "ArrowRight")).toBe(
      indexOfSymbol("He"),
    );
    // Ba (56) -> La (57): crosses into the detached f-block row.
    expect(nextCellIndex(cells, indexOfSymbol("Ba"), "ArrowRight")).toBe(
      indexOfSymbol("La"),
    );
  });

  it("ArrowLeft is the inverse of ArrowRight", () => {
    expect(nextCellIndex(cells, indexOfSymbol("He"), "ArrowLeft")).toBe(
      indexOfSymbol("H"),
    );
  });

  it("stops at the table edges", () => {
    expect(nextCellIndex(cells, indexOfSymbol("H"), "ArrowLeft")).toBeNull();
    expect(nextCellIndex(cells, indexOfSymbol("Og"), "ArrowRight")).toBeNull();
    expect(nextCellIndex(cells, indexOfSymbol("H"), "ArrowUp")).toBeNull();
  });

  it("ArrowDown moves within the rendered column, skipping empty rows", () => {
    // H (x=1,y=1) -> Li (x=1,y=2) -> Na -> K -> Rb -> Cs -> Fr.
    expect(nextCellIndex(cells, indexOfSymbol("H"), "ArrowDown")).toBe(
      indexOfSymbol("Li"),
    );
    // Be (x=2,y=2) up -> nothing (no cell above in column 2's row 1).
    expect(nextCellIndex(cells, indexOfSymbol("Be"), "ArrowUp")).toBeNull();
    // He (x=18,y=1) down -> Ne (x=18,y=2).
    expect(nextCellIndex(cells, indexOfSymbol("He"), "ArrowDown")).toBe(
      indexOfSymbol("Ne"),
    );
  });

  it("ArrowDown crosses from the main block into the detached f-block rows", () => {
    // Y (column 3, period 5): the next cell down in column 3 is La in the
    // detached lanthanide row.
    expect(nextCellIndex(cells, indexOfSymbol("Y"), "ArrowDown")).toBe(
      indexOfSymbol("La"),
    );
    // And La down -> Ac (x=3,y=10).
    expect(nextCellIndex(cells, indexOfSymbol("La"), "ArrowDown")).toBe(
      indexOfSymbol("Ac"),
    );
  });

  it("Home and End go to the first/last visible cell", () => {
    expect(nextCellIndex(cells, indexOfSymbol("Fe"), "Home")).toBe(
      indexOfSymbol("H"),
    );
    expect(nextCellIndex(cells, indexOfSymbol("Fe"), "End")).toBe(
      indexOfSymbol("Og"),
    );
  });

  it("skips hidden (filtered-out) cells horizontally and vertically", () => {
    const filtered = realCells(["He", "Li"]);
    // H right -> Be (He and Li hidden).
    expect(nextCellIndex(filtered, indexOfSymbol("H"), "ArrowRight")).toBe(
      indexOfSymbol("Be"),
    );
    // H down -> Na (Li hidden, next in column 1).
    expect(nextCellIndex(filtered, indexOfSymbol("H"), "ArrowDown")).toBe(
      indexOfSymbol("Na"),
    );
  });

  it("recovers to the first visible cell when the current index is invalid", () => {
    expect(nextCellIndex(cells, -1, "ArrowRight")).toBe(indexOfSymbol("H"));
  });
});

describe("firstVisibleIndex", () => {
  it("returns the first non-hidden cell, or null when all are hidden", () => {
    expect(firstVisibleIndex(realCells())).toBe(0);
    expect(firstVisibleIndex(realCells(["H"]))).toBe(1);
    const all = realCells().map((c) => ({ ...c, hidden: true }));
    expect(firstVisibleIndex(all)).toBeNull();
  });
});
