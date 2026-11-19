import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import * as elementsDataModule from "../src/data/elementsData.js";
import * as trendReasoningModule from "../src/data/trendReasoning.js";
import * as elementSearchModule from "../src/data/elementSearch.js";

function transpileComponent(relPath) {
  const source = fs.readFileSync(path.resolve(relPath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return outputText;
}

function findNodes(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (predicate(node)) acc.push(node);
  const children = node.props?.children || [];
  for (const child of Array.isArray(children) ? children : [children]) {
    findNodes(child, predicate, acc);
  }
  return acc;
}

function textOf(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  const children = node.props?.children || [];
  return (Array.isArray(children) ? children : [children]).map(textOf).join("");
}

describe("Home periodic table drawer journey: filter -> subshells -> in-drawer trend explorer -> peer hop -> close", () => {
  it("explores subshells and periodic trends right inside the drawer while preserving modal focus, table query/history, metric/axis retention, and mobile Share accessible name", () => {
    const homeCode = transpileComponent("src/pages/Home.jsx");
    const atomVizCode = transpileComponent("src/components/AtomVisualizer.jsx");
    const trendCardCode = transpileComponent("src/components/TrendExplorerCard.jsx");

    let currentSearch = "";
    let historyMutations = 0;
    let savedSlugs = [];
    let closeFocusCalls = 0;
    let triggerFocusCalls = 0;
    const keydownListeners = new Set();

    const prevWindow = globalThis.window;
    const prevRaf = globalThis.requestAnimationFrame;
    const prevCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };
    globalThis.cancelAnimationFrame = () => {};
    globalThis.window = /** @type {any} */ ({
      addEventListener: (type, fn) => {
        if (type === "keydown") keydownListeners.add(fn);
      },
      removeEventListener: (type, fn) => {
        if (type === "keydown") keydownListeners.delete(fn);
      },
      matchMedia: () => ({ matches: false }),
    });

    try {
      const stateMap = new Map();
      const refMap = new Map();
      const memoMap = new Map();
      const effectMap = new Map();
      let pendingEffects = [];
      let activePath = "root";
      const hookIndices = new Map();

      const nextHookKey = (kind) => {
        const keyBase = `${activePath}:${kind}`;
        const idx = hookIndices.get(keyBase) || 0;
        hookIndices.set(keyBase, idx + 1);
        return `${keyBase}:${idx}`;
      };

      const mountedPaths = new Set();

      const renderElement = (type, props, pathPrefix) => {
        if (typeof type === "function") {
          const compPath = `${pathPrefix}/${type.name || "Anon"}`;
          mountedPaths.add(compPath);
          const prevPath = activePath;
          activePath = compPath;
          const out = type(props);
          activePath = prevPath;
          return resolveTree(out, compPath);
        }
        return resolveTree({ type, props }, pathPrefix);
      };

      const resolveTree = (node, pathPrefix) => {
        if (!node || typeof node !== "object") return node;
        if (Array.isArray(node)) {
          return node.map((child, i) => resolveTree(child, `${pathPrefix}[${i}]`));
        }
        if (node.__isDeferredElement) {
          return renderElement(node.type, node.props, pathPrefix);
        }
        const rawChildren = node.props?.children;
        if (rawChildren === undefined) return node;
        const resolvedChildren = Array.isArray(rawChildren)
          ? rawChildren.map((c, i) => resolveTree(c, `${pathPrefix}.${i}`))
          : resolveTree(rawChildren, `${pathPrefix}.0`);
        return {
          ...node,
          props: {
            ...node.props,
            children: resolvedChildren,
          },
        };
      };

      const fakeReact = {
        Fragment: Symbol("Fragment"),
        createElement: (type, props, ...children) => ({
          __isDeferredElement: true,
          type,
          props: { ...(props || {}), children: children.flat() },
        }),
        useState: (init) => {
          const key = nextHookKey("state");
          if (!stateMap.has(key)) {
            stateMap.set(key, typeof init === "function" ? init() : init);
          }
          const setState = (updater) => {
            const prev = stateMap.get(key);
            stateMap.set(key, typeof updater === "function" ? updater(prev) : updater);
          };
          return [stateMap.get(key), setState];
        },
        useRef: (init) => {
          const key = nextHookKey("ref");
          if (!refMap.has(key)) {
            refMap.set(key, { current: init });
          }
          return refMap.get(key);
        },
        useMemo: (factory, deps) => {
          const key = nextHookKey("memo");
          const prev = memoMap.get(key);
          if (!prev || !deps || deps.some((d, i) => !Object.is(d, prev.deps[i]))) {
            const value = factory();
            memoMap.set(key, { deps, value });
            return value;
          }
          return prev.value;
        },
        useEffect: (fn, deps) => {
          const key = nextHookKey("effect");
          const ownerPath = activePath;
          const prev = effectMap.get(key);
          const changed = !prev || !deps || deps.some((d, i) => !Object.is(d, prev.deps[i]));
          if (changed) {
            pendingEffects.push(() => {
              if (prev && typeof prev.cleanup === "function") prev.cleanup();
              const cleanup = fn();
              effectMap.set(key, { deps, cleanup, ownerPath });
            });
          }
        },
      };
      fakeReact.default = fakeReact;

      const fakeRouter = {
        Link: "Link",
        useSearchParams: () => [
          new URLSearchParams(currentSearch),
          (nextParams) => {
            historyMutations++;
            currentSearch = new URLSearchParams(nextParams).toString();
          },
        ],
      };

      const fakeStudyStore = {
        useStudyProgress: () => ({
          savedSlugs,
          masteryMap: {},
          toggleSavedSlug: (slug) => {
            const exists = savedSlugs.includes(slug);
            savedSlugs = exists ? savedSlugs.filter((s) => s !== slug) : [...savedSlugs, slug];
            return !exists;
          },
        }),
      };

      const atomVizMod = { exports: {} };
      const trendCardMod = { exports: {} };
      const homeMod = { exports: {} };

      const customRequire = (id) => {
        if (id === "react") return fakeReact;
        if (id === "react-router-dom") return fakeRouter;
        if (id === "@/components/Navbar") return { default: () => null };
        if (id === "@/components/Footer") return { default: () => null };
        if (id === "@/components/DailyElementSpotlight") return { default: () => null };
        if (id === "@/components/AtomVisualizer") return atomVizMod.exports;
        if (id === "@/components/TrendExplorerCard") return trendCardMod.exports;
        if (id === "@/data/elementsData") return elementsDataModule;
        if (id === "@/data/trendReasoning") return trendReasoningModule;
        if (id === "@/data/elementSearch") return elementSearchModule;
        if (id === "@/lib/studyStore") return fakeStudyStore;
        if (id === "lucide-react") {
          return {
            Search: "i",
            ArrowLeftRight: "i",
            BrainCircuit: "i",
            BookmarkCheck: "i",
            Share2: "i",
            X: "i",
            ExternalLink: "i",
            Flame: "i",
            Info: "i",
            RotateCcw: "i",
            Atom: "i",
            TrendingUp: "i",
          };
        }
        throw new Error(`Unexpected import in Home drawer journey: ${id}`);
      };

      new Function("require", "module", "exports", "React", atomVizCode)(
        customRequire,
        atomVizMod,
        atomVizMod.exports,
        fakeReact
      );
      new Function("require", "module", "exports", "React", trendCardCode)(
        customRequire,
        trendCardMod,
        trendCardMod.exports,
        fakeReact
      );
      new Function("require", "module", "exports", "React", homeCode)(
        customRequire,
        homeMod,
        homeMod.exports,
        fakeReact
      );
      const Home = homeMod.exports.default;

      const attachDrawerCloseRef = (tree) => {
        const closeBtn = findNodes(tree, (n) => n.type === "button" && n.props?.["aria-label"] === "Close panel")[0];
        if (closeBtn && closeBtn.props?.ref && typeof closeBtn.props.ref === "object") {
          closeBtn.props.ref.current = {
            focus: () => {
              closeFocusCalls++;
            },
          };
        }
      };

      const renderAndFlush = () => {
        let tree;
        for (let pass = 0; pass < 4; pass++) {
          hookIndices.clear();
          mountedPaths.clear();
          pendingEffects = [];
          tree = renderElement(Home, {}, "root");
          attachDrawerCloseRef(tree);

          // Prune unmounted component state/effects cleanly (mirrors React unmount when drawer closes)
          for (const key of Array.from(stateMap.keys())) {
            const owner = key.slice(0, key.indexOf(":"));
            if (!mountedPaths.has(owner)) stateMap.delete(key);
          }
          for (const [key, rec] of Array.from(effectMap.entries())) {
            if (!mountedPaths.has(rec.ownerPath)) {
              if (typeof rec.cleanup === "function") rec.cleanup();
              effectMap.delete(key);
            }
          }

          if (pendingEffects.length === 0) break;
          for (const runEff of pendingEffects) runEff();
        }
        return tree;
      };

      // 1. Filter table by "oxygen" -> 1 of 118 elements shown
      let tree = renderAndFlush();
      const searchInput = findNodes(tree, (n) => n.type === "input" && n.props?.id === "pt-search")[0];
      searchInput.props.onChange({ target: { value: "oxygen" } });
      tree = renderAndFlush();

      const statusBanner = findNodes(tree, (n) => n.props?.className?.includes?.("js-search-status"))[0];
      assert.match(textOf(statusBanner), /1 of 118 elements shown/);
      const visibleCells = findNodes(tree, (n) => n.type === "a" && n.props?.["data-slug"]);
      assert.equal(visibleCells.length, 1);
      assert.equal(visibleCells[0].props["data-slug"], "oxygen");

      // 2. Tap Oxygen cell -> opens modal drawer, focuses Close panel once, and exposes non-empty mobile Share aria-label
      const triggerStub = {
        isConnected: true,
        focus: () => {
          triggerFocusCalls++;
        },
      };
      visibleCells[0].props.onClick({
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: () => {},
        currentTarget: triggerStub,
      });
      tree = renderAndFlush();

      const dialog = findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog")[0];
      assert.ok(dialog, "Slide-in Oxygen drawer opens as modal dialog");
      assert.equal(closeFocusCalls, 1, "Opening drawer focuses Close panel once");

      const shareBtn = findNodes(dialog, (n) => n.type === "button" && Boolean(n.props?.["data-share-url"]))[0];
      assert.equal(
        shareBtn.props["aria-label"],
        "Copy shareable link for Oxygen",
        "Mobile icon-only Share button in drawer must always carry a clear accessible name"
      );

      // 3. Switch AtomVisualizer to Subshell Orbitals -> shows Oxygen 2p4 occupancy
      const subshellsBtn = findNodes(
        dialog,
        (n) => n.type === "button" && textOf(n).includes("Subshell Orbitals")
      )[0];
      subshellsBtn.props.onClick();
      tree = renderAndFlush();
      assert.match(textOf(tree), /2p4/);

      // 4. Explore Periodic Trend Comparison right inside the drawer without leaving via Show more
      let dialogAfterSubshells = findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog")[0];
      const neEnBar = findNodes(dialogAfterSubshells, (n) => n.props?.["data-bar-slug"] === "neon")[0];
      assert.equal(neEnBar.props["data-bar-height-pct"], 0, "Unestablished Neon Pauling EN renders 0% bar height");

      const ieMetricBtn = findNodes(
        dialogAfterSubshells,
        (n) => n.type === "button" && textOf(n).trim() === "1st Ionization Energy"
      )[0];
      ieMetricBtn.props.onClick();
      tree = renderAndFlush();

      dialogAfterSubshells = findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog")[0];
      const workedExample = findNodes(dialogAfterSubshells, (n) => n.props?.["data-testid"] === "trend-worked-example")[0];
      assert.ok(workedExample);
      assert.match(
        textOf(workedExample),
        /Oxygen in Period 2: 1313\.9 kJ\/mol — 88\.4 kJ\/mol lower than Nitrogen \(1402\.3 kJ\/mol\)/
      );
      assert.match(textOf(workedExample), /OpenStax Chemistry 2e/);
      assert.equal(
        findNodes(workedExample, (n) => n.type === "Link" && n.props?.to === "/compare?ids=nitrogen,oxygen,fluorine")
          .length,
        1
      );

      // 5. Tap Nitrogen peer bar inside drawer -> updates drawer in-place without stealing focus, mutating URL history, or losing metric/subshells/table query
      const nitrogenBarBtn = findNodes(
        dialogAfterSubshells,
        (n) =>
          n.type === "button" &&
          typeof n.props?.["aria-label"] === "string" &&
          n.props["aria-label"].startsWith("Inspect Nitrogen (N)")
      )[0];
      nitrogenBarBtn.props.onClick();
      tree = renderAndFlush();

      assert.equal(
        closeFocusCalls,
        1,
        "Switching peer elements inside an already-open drawer must not yank focus back to Close panel"
      );
      assert.equal(historyMutations, 0, "In-drawer peer exploration must not spam browser history");
      assert.equal(currentSearch, "", "URL query parameters remain untouched");

      const nitrogenDialog = findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog")[0];
      assert.match(textOf(nitrogenDialog), /Nitrogen \(N\)/);
      assert.match(textOf(nitrogenDialog), /2p3/, "Subshell Orbitals view stays retained on peer switch");

      const retainedIeBtn = findNodes(
        nitrogenDialog,
        (n) => n.type === "button" && textOf(n).trim() === "1st Ionization Energy"
      )[0];
      assert.equal(retainedIeBtn.props["aria-pressed"], true, "Selected trend metric stays retained on peer switch");

      const currentPeerBars = findNodes(nitrogenDialog, (n) => n.type === "button" && n.props?.["aria-current"] === "true");
      assert.equal(currentPeerBars.length, 1);
      assert.match(currentPeerBars[0].props["aria-label"], /Inspect Nitrogen \(N\)/);

      const nShareBtn = findNodes(nitrogenDialog, (n) => n.type === "button" && Boolean(n.props?.["data-share-url"]))[0];
      assert.equal(nShareBtn.props["aria-label"], "Copy shareable link for Nitrogen");

      // Saving must keep the visible "Saved" label in the accessible name for voice control.
      findNodes(nitrogenDialog, (n) => n.type === "button" && n.props?.["aria-label"] === "Save Nitrogen to Study Deck")[0].props.onClick();
      tree = renderAndFlush();
      const savedControl = findNodes(tree, (n) => n.type === "button" && n.props?.["aria-pressed"] === true && textOf(n) === "Saved")[0];
      assert.ok(savedControl);
      assert.match(savedControl.props["aria-label"], /Saved/);
      assert.match(savedControl.props["aria-label"], /remove Nitrogen from Study Deck/);

      const stillFilteredStatus = findNodes(tree, (n) => n.props?.className?.includes?.("js-search-status"))[0];
      assert.match(textOf(stillFilteredStatus), /1 of 118 elements shown/, "Underlying table query 'oxygen' is preserved");

      // 6. Press Escape -> closes drawer, restores focus to triggering Oxygen table cell, keeps table filter intact
      for (const listener of Array.from(keydownListeners)) {
        listener({ key: "Escape", preventDefault: () => {} });
      }
      tree = renderAndFlush();
      assert.equal(findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog").length, 0);
      assert.equal(triggerFocusCalls, 1, "Closing drawer restores focus to triggering cell");

      // 7. Color table by Covalent Radius & open Oganesson -> drawer TrendExplorerCard syncs initial metric to Covalent Radius and handles missing superheavy data honestly
      const clearFilterBtn = findNodes(tree, (n) => n.type === "button" && n.props?.["aria-label"] === "Clear filter")[0];
      clearFilterBtn.props.onClick();
      const radiusHeatmapBtn = findNodes(
        tree,
        (n) => n.type === "button" && textOf(n).trim() === "Covalent Radius"
      )[0];
      radiusHeatmapBtn.props.onClick();
      tree = renderAndFlush();

      const ogCell = findNodes(tree, (n) => n.type === "a" && n.props?.["data-slug"] === "oganesson")[0];
      ogCell.props.onClick({
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        preventDefault: () => {},
        currentTarget: triggerStub,
      });
      tree = renderAndFlush();

      const ogDialog = findNodes(tree, (n) => n.type === "aside" && n.props?.role === "dialog")[0];
      const radiusMetricTab = findNodes(
        ogDialog,
        (n) => n.type === "button" && textOf(n).trim() === "Reference Covalent Radius"
      )[0];
      assert.equal(
        radiusMetricTab.props["aria-pressed"],
        true,
        "Drawer TrendExplorerCard initializes to the active Periodic Table heatmap metric"
      );
      const ogBar = findNodes(ogDialog, (n) => n.props?.["data-bar-slug"] === "oganesson")[0];
      assert.equal(ogBar.props["data-bar-height-pct"], 0);
      assert.match(textOf(ogDialog), /Oganesson in Period 7: reference covalent radius not established/);
    } finally {
      globalThis.window = prevWindow;
      globalThis.requestAnimationFrame = prevRaf;
      globalThis.cancelAnimationFrame = prevCaf;
    }
  });
});