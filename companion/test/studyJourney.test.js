import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import * as elementsDataModule from "../src/data/elementsData.js";

const {
  ELEMENTS,
  CATEGORY_META,
  getElementBySlug,
  buildArticle,
  buildComparison,
  buildDeterministicQuiz,
  nextCellIndex,
  buildElementShareUrl,
  buildComparisonShareUrl,
  resolveComparisonSlugs,
} = elementsDataModule;
import {
  EMPTY_PROGRESS,
  readProgress,
  writeProgress,
  validateImport,
  buildExportPayload,
} from "../src/lib/progressStore.js";

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("Standalone /study/ build & offline service worker guarantees", () => {
  it("emits relative asset paths and zero Base44 tracking scripts in dist/index.html", () => {
    const indexPath = path.resolve("dist/index.html");
    assert.ok(fs.existsSync(indexPath), "dist/index.html should exist after build");
    const html = fs.readFileSync(indexPath, "utf8");

    assert.match(html, /src="\.\/assets\/index-[^"]+\.js"/);
    assert.match(html, /href="\.\/assets\/index-[^"]+\.css"/);
    assert.match(html, /href="\.\/manifest\.json"/);
    assert.match(html, /href="\.\/favicon\.svg"/);
    assert.match(html, /href="https:\/\/elementalearn\.com\/study\/"/);
    assert.doesNotMatch(html, /\/api\/app-logs\//);
    assert.doesNotMatch(html, /log-user-in-app/);
  });

  it("scopes manifest.json relatively so it works under /study/", () => {
    const manifest = JSON.parse(fs.readFileSync(path.resolve("dist/manifest.json"), "utf8"));
    assert.equal(manifest.start_url, "./");
    assert.equal(manifest.scope, "./");
    for (const icon of manifest.icons) {
      assert.ok(icon.src.startsWith("./"), `icon src should be relative: ${icon.src}`);
    }
    for (const shortcut of manifest.shortcuts) {
      assert.ok(shortcut.url.startsWith("./#/"), `shortcut url should use relative hash route: ${shortcut.url}`);
    }
  });

  it("precaches compiled JS/CSS bundles for /study/ offline return and never deletes other apps' caches", async () => {
    const swCode = fs.readFileSync(path.resolve("public/sw.js"), "utf8");
    const distHtml = fs.readFileSync(path.resolve("dist/index.html"), "utf8");

    const cacheStore = new Map();
    // Seed both a foreign app cache on the same origin and an obsolete Elementa cache
    cacheStore.set("astro-main-site-v1", new Map([["https://elementalearn.com/", "root-html"]]));
    cacheStore.set("other-app-cache-v3", new Map([["https://elementalearn.com/other", "other"]]));
    cacheStore.set("elementa-shell-v1", new Map([["https://elementalearn.com/old", "old"]]));

    const openCache = async (name) => {
      if (!cacheStore.has(name)) cacheStore.set(name, new Map());
      const entries = cacheStore.get(name);
      return {
        put: async (req, res) => {
          const url = typeof req === "string" ? req : req.url;
          entries.set(url, res);
        },
        match: async (req) => {
          const url = typeof req === "string" ? req : req.url;
          return entries.get(url) || undefined;
        },
      };
    };

    const listeners = {};
    const scopeBase = "https://elementalearn.com/study/";
    let networkOnline = true;

    const mockFetch = async (input) => {
      if (!networkOnline) throw new Error("Network offline");
      const url = typeof input === "string" ? input : input.url;
      if (url === `${scopeBase}index.html` || url === scopeBase) {
        return {
          ok: true,
          url,
          clone() {
            return this;
          },
          text: async () => distHtml,
        };
      }
      return {
        ok: true,
        url,
        clone() {
          return this;
        },
        text: async () => `asset:${url}`,
      };
    };

    const sandbox = {
      URL,
      Promise,
      Set,
      Map,
      Array,
      fetch: mockFetch,
      caches: {
        open: openCache,
        keys: async () => Array.from(cacheStore.keys()),
        delete: async (key) => cacheStore.delete(key),
        match: async (req) => {
          const url = typeof req === "string" ? req : req.url;
          for (const entries of cacheStore.values()) {
            if (entries.has(url)) return entries.get(url);
          }
          return undefined;
        },
      },
      self: {
        location: { origin: "https://elementalearn.com", href: `${scopeBase}sw.js` },
        registration: { scope: scopeBase },
        skipWaiting: () => Promise.resolve(),
        clients: { claim: () => Promise.resolve() },
        addEventListener: (type, handler) => {
          listeners[type] = handler;
        },
      },
    };

    vm.runInNewContext(swCode, sandbox);

    // 1. Run install and verify index.html + compiled JS and CSS assets are cached under /study/
    let installPromise;
    listeners.install({
      waitUntil: (p) => {
        installPromise = p;
      },
    });
    await installPromise;

    const activeCache = cacheStore.get("elementa-study-shell-v2");
    assert.ok(activeCache, "elementa-study-shell-v2 cache should be created");
    const cachedUrls = Array.from(activeCache.keys());
    assert.ok(cachedUrls.includes(`${scopeBase}`), "scope root /study/ is cached");
    assert.ok(cachedUrls.includes(`${scopeBase}index.html`), "/study/index.html is cached");
    assert.ok(
      cachedUrls.some((u) => u.startsWith(`${scopeBase}assets/index-`) && u.endsWith(".js")),
      "compiled JS bundle under /study/assets/ is precached during install"
    );
    assert.ok(
      cachedUrls.some((u) => u.startsWith(`${scopeBase}assets/index-`) && u.endsWith(".css")),
      "compiled CSS bundle under /study/assets/ is precached during install"
    );

    // 2. Run activate and verify foreign caches on the same origin are preserved
    let activatePromise;
    listeners.activate({
      waitUntil: (p) => {
        activatePromise = p;
      },
    });
    await activatePromise;

    assert.ok(cacheStore.has("astro-main-site-v1"), "never deletes astro-main-site-v1 cache");
    assert.ok(cacheStore.has("other-app-cache-v3"), "never deletes other-app-cache-v3 cache");
    assert.ok(!cacheStore.has("elementa-shell-v1"), "cleans up obsolete elementa-shell-v1 cache");

    // 3. Simulate offline return navigation to /study/ and verify cached shell is returned
    networkOnline = false;
    let offlineResponsePromise;
    listeners.fetch({
      request: {
        method: "GET",
        mode: "navigate",
        url: "https://elementalearn.com/study/",
      },
      respondWith: (p) => {
        offlineResponsePromise = p;
      },
    });
    const offlineNavResponse = await offlineResponsePromise;
    assert.ok(offlineNavResponse && offlineNavResponse.ok, "serves /study/ app shell while offline");
  });
});

describe("End-to-end learner journey: search → atom/orbitals → compare → quiz → save → reload", () => {
  it("completes the full study flow from honest zero progress and persists across reload", () => {
    const storage = createMemoryStorage();

    // 1. Fresh user starts with honest zero progress
    const initial = readProgress(storage);
    assert.deepEqual(initial.progress, EMPTY_PROGRESS);

    // 2. Search for "oxygen" or "2p4" -> inspect Bohr shells & subshells
    const query = "2p4";
    const matches = ELEMENTS.filter((el) => {
      const hay = `${el.name} ${el.symbol} ${el.number} ${CATEGORY_META[el.category].label} ${el.electronConfig}`.toLowerCase();
      return hay.includes(query);
    });
    assert.equal(matches.length, 1);
    const oxygen = matches[0];
    assert.equal(oxygen.slug, "oxygen");
    assert.deepEqual(oxygen.shells, [2, 6]);
    assert.deepEqual(
      oxygen.subshells.map((s) => `${s.label}:${s.count}`),
      ["1s:2", "2s:2", "2p:4"]
    );
    const article = buildArticle(oxygen);
    assert.ok(article.summary.includes("Oxygen"));
    assert.equal(buildElementShareUrl(oxygen), "https://elementalearn.com/element/oxygen");

    // 3. Compare Iron, Gold, Oxygen -> check share URL & numeric highlights
    const compared = resolveComparisonSlugs(["iron", "gold", "oxygen"]);
    const cmpTable = buildComparison(compared);
    assert.equal(cmpTable.elements.length, 3);
    assert.equal(
      buildComparisonShareUrl(compared),
      "https://elementalearn.com/compare?ids=iron,gold,oxygen"
    );

    // 4. Quiz & Save -> record a session with a missed element and a study note, then reload
    const nextProgress = {
      savedSlugs: ["oxygen", "chromium"],
      masteryMap: {
        oxygen: { attempts: 2, correct: 2, mastered: true, lastPracticed: "2026-11-01" },
        chromium: { attempts: 1, correct: 0, mastered: false, lastPracticed: "2026-11-01" },
      },
      notesMap: {
        oxygen: "Paramagnetic diradical in ground state; 6 valence electrons.",
      },
      quizHistory: [
        {
          id: "quiz-1",
          mode: "Periodic Trends & Valence",
          score: 4,
          total: 5,
          accuracy: 80,
          date: "2026-11-01",
          missedSlugs: ["chromium"],
        },
      ],
    };
    assert.equal(writeProgress(nextProgress, storage).ok, true);

    // 5. Reload and verify persistence + export/import round-trip
    const reloaded = readProgress(storage);
    assert.deepEqual(reloaded.progress.savedSlugs, ["oxygen", "chromium"]);
    assert.equal(reloaded.progress.masteryMap.oxygen.mastered, true);
    assert.equal(
      reloaded.progress.notesMap.oxygen,
      "Paramagnetic diradical in ground state; 6 valence electrons."
    );
    assert.equal(reloaded.progress.quizHistory[0].missedSlugs[0], "chromium");

    const exported = buildExportPayload(reloaded.progress);
    const reimported = validateImport(exported);
    assert.equal(reimported.ok, true);
    assert.equal(reimported.summary.savedElements, 2);
  });

  it("preserves learner-selected target scope for 1-element decks, 2-element comparisons, and explicit element quizzes while keeping (target, concept) pairs unique", () => {
    // 1. One-element saved deck (e.g. Chromium) stays strictly on Chromium and caps honestly at 4 distinct concepts
    const singleDeck = [getElementBySlug("chromium")];
    const deckQuestions = buildDeterministicQuiz(singleDeck, 5, "deck");
    assert.equal(deckQuestions.length, 4, "1-element pool caps at the 4 available distinct question concepts");
    assert.deepEqual(
      new Set(deckQuestions.map((q) => q.target.slug)),
      new Set(["chromium"]),
      "1-element deck must never pad unrelated target elements"
    );
    assert.equal(
      new Set(deckQuestions.map((q) => `${q.target.slug}:${q.concept}`)).size,
      4,
      "Every (target, concept) pair in a 1-element deck quiz is unique"
    );
    assert.match(deckQuestions[0].explanation, /Aufbau exception/);

    // 2. Explicit element route (/practice?element=oxygen) stays strictly on Oxygen across 4 distinct concepts
    const oxygenQuestions = buildDeterministicQuiz([getElementBySlug("oxygen")], 5, "element");
    assert.equal(oxygenQuestions.length, 4);
    assert.ok(oxygenQuestions.every((q) => q.target.slug === "oxygen"));
    assert.equal(new Set(oxygenQuestions.map((q) => `${q.target.slug}:${q.concept}`)).size, 4);
    // Distractors come from other elements while the target remains strictly Oxygen
    for (const q of oxygenQuestions) {
      assert.equal(q.options.length, 4);
      assert.equal(q.correctSlug, "oxygen");
      assert.equal(q.options.filter((opt) => opt.slug !== "oxygen").length, 3);
    }

    // 3. Two-element comparison (/practice?ids=copper,silver) produces 5 questions targeting only Copper and Silver with unique (target, concept) pairs
    const twoComparePool = [getElementBySlug("copper"), getElementBySlug("silver")];
    const compareQuestions = buildDeterministicQuiz(twoComparePool, 5, "compare");
    assert.equal(compareQuestions.length, 5);
    assert.deepEqual(
      new Set(compareQuestions.map((q) => q.target.slug)),
      new Set(["copper", "silver"]),
      "2-element comparison quiz targets only the 2 selected elements"
    );
    assert.equal(
      new Set(compareQuestions.map((q) => `${q.target.slug}:${q.concept}`)).size,
      5,
      "Every (target, concept) pair in a 2-element comparison quiz is unique"
    );

    // 4. Periodic Trends & Valence mode asks quantitative electronegativity / ionization energy questions without leaking Period in options
    const trendPool = ["fluorine", "oxygen", "caesium", "helium", "iron"]
      .map((s) => getElementBySlug(s))
      .filter(Boolean);
    const trendQuestions = buildDeterministicQuiz(trendPool, 5, "trends");
    assert.equal(trendQuestions.length, 5);
    assert.match(trendQuestions[0].prompt, /Pauling electronegativity|first ionization energy/);
    for (const opt of trendQuestions[0].options) {
      assert.doesNotMatch(opt.label, /Period \d/, "Option labels must not leak the target Period");
    }

    // 5. Multi-pass 10- and 20-question quizzes across Easy, Standard, and Hard keep every (target, concept) pair strictly unique and cap honestly on small scopes
    const fivePool = ["fluorine", "oxygen", "caesium", "helium", "iron"].map((s) => getElementBySlug(s));
    for (const diff of ["easy", "standard", "hard"]) {
      for (const mode of ["trends", "all", "deck", "compare"]) {
        const q20 = buildDeterministicQuiz(fivePool, 20, mode, diff);
        assert.equal(q20.length, 20, `5-element pool supports 20 unique questions in ${mode}/${diff}`);
        assert.equal(
          new Set(q20.map((q) => `${q.target.slug}:${q.concept}`)).size,
          20,
          `Zero duplicate (target, concept) pairs in ${mode}/${diff}`
        );
      }
      // Honest shorter totals when 10 or 20 questions are requested on a 2-element comparison (max 8 unique concepts)
      const shortCompare = buildDeterministicQuiz(twoComparePool, 20, "compare", diff);
      assert.equal(shortCompare.length, 8);
      assert.deepEqual(new Set(shortCompare.map((q) => q.target.slug)), new Set(["copper", "silver"]));
    }

    // 6. Keyboard grid navigation moves across Period 4 and down Group 18 accurately
    const cells = ELEMENTS.map((el) => ({ x: el.xpos, y: el.ypos, hidden: false }));
    const heliumIdx = 1; // He (18, 1)
    const neonIdx = nextCellIndex(cells, heliumIdx, "ArrowDown");
    assert.equal(ELEMENTS[neonIdx].symbol, "Ne");
    const oganessonIdx = nextCellIndex(cells, heliumIdx, "End");
    assert.equal(ELEMENTS[oganessonIdx].symbol, "Og");
  });

  it("updates Compare slots cleanly on same-count 2- and 3-element URL changes without retaining stale slots", () => {
    const source = fs.readFileSync(path.resolve("src/pages/Compare.jsx"), "utf8");
    const { outputText: code } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
      },
    });

    const hookStates = [];
    const effectDeps = [];
    let pendingEffects = [];
    let hookCursor = 0;
    let currentSearch = "ids=copper,silver";

    const fakeReact = {
      Fragment: Symbol("Fragment"),
      createElement: (type, props, ...children) => ({
        type,
        props: { ...(props || {}), children: children.flat() },
      }),
      useState: (init) => {
        const idx = hookCursor++;
        if (!(idx in hookStates)) hookStates[idx] = typeof init === "function" ? init() : init;
        const setState = (u) => {
          hookStates[idx] = typeof u === "function" ? u(hookStates[idx]) : u;
        };
        return [hookStates[idx], setState];
      },
      useMemo: (factory) => {
        hookCursor++;
        return factory();
      },
      useEffect: (fn, deps) => {
        const idx = hookCursor++;
        const prev = effectDeps[idx];
        const changed = !prev || !deps || deps.some((d, i) => !Object.is(d, prev[i]));
        if (changed) {
          effectDeps[idx] = deps;
          pendingEffects.push(fn);
        }
      },
    };
    fakeReact.default = fakeReact;

    const fakeRouter = {
      Link: "Link",
      useSearchParams: () => [
        new URLSearchParams(currentSearch),
        (nextObj) => {
          currentSearch = new URLSearchParams(nextObj).toString();
        },
      ],
    };

    const cjsModule = { exports: {} };
    const customRequire = (id) => {
      if (id === "react") return fakeReact;
      if (id === "react-router-dom") return fakeRouter;
      if (id === "@/components/Navbar") return { default: () => null };
      if (id === "@/components/Footer") return { default: () => null };
      if (id === "@/components/ComparisonVisualLens") return { default: () => null };
      if (id === "@/data/elementsData") return elementsDataModule;
      if (id === "lucide-react") return { Share2: "i", BrainCircuit: "i", Sparkles: "i", Check: "i" };
      throw new Error(`Unexpected import in Compare: ${id}`);
    };
    new Function("require", "module", "exports", "React", code)(customRequire, cjsModule, cjsModule.exports, fakeReact);
    const Compare = cjsModule.exports.default;

    const findNodes = (node, predicate, acc = []) => {
      if (!node || typeof node !== "object") return acc;
      if (predicate(node)) acc.push(node);
      const children = node.props?.children || [];
      for (const child of Array.isArray(children) ? children : [children]) findNodes(child, predicate, acc);
      return acc;
    };

    const renderAndFlush = () => {
      let tree;
      for (let pass = 0; pass < 3; pass++) {
        hookCursor = 0;
        pendingEffects = [];
        tree = Compare({});
        if (pendingEffects.length === 0) break;
        for (const eff of pendingEffects) eff();
      }
      return tree;
    };

    const getSelectValues = (tree) => findNodes(tree, (n) => n.type === "select").map((s) => s.props.value);

    // Initial 2-element URL (?ids=copper,silver)
    let tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["copper", "silver", ""]);

    // Same-count 2-element URL change (?ids=lithium,sodium) must update slots without stale copper/silver
    currentSearch = "ids=lithium,sodium";
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["lithium", "sodium", ""]);

    // 3-element URL change (?ids=iron,gold,oxygen) -> same-count 3-element URL change (?ids=carbon,nitrogen,oxygen) -> back
    currentSearch = "ids=iron,gold,oxygen";
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["iron", "gold", "oxygen"]);

    // User edits Slot 1 via select dropdown to copper -> ?ids=copper,gold,oxygen
    const selects = findNodes(tree, (n) => n.type === "select");
    selects[0].props.onChange({ target: { value: "copper" } });
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["copper", "gold", "oxygen"]);
    assert.equal(new URLSearchParams(currentSearch).get("ids"), "copper,gold,oxygen");

    // External same-count URL change to carbon,nitrogen,oxygen and then back to copper,gold,oxygen
    currentSearch = "ids=carbon,nitrogen,oxygen";
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["carbon", "nitrogen", "oxygen"]);

    currentSearch = "ids=copper,gold,oxygen";
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["copper", "gold", "oxygen"]);

    // Navigating to bare /compare (empty search) resets to default trio
    currentSearch = "";
    tree = renderAndFlush();
    assert.deepEqual(getSelectValues(tree), ["iron", "gold", "oxygen"]);
  });

  it("renders proportional covalent radii, unestablished superheavy placeholders, and inline AtomVisualizer toggle in ComparisonVisualLens", () => {
    const source = fs.readFileSync(path.resolve("src/components/ComparisonVisualLens.jsx"), "utf8");
    const { outputText: code } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
      },
    });

    const hookStates = [];
    let hookCursor = 0;
    const fakeReact = {
      Fragment: Symbol("Fragment"),
      createElement: (type, props, ...children) => ({
        type,
        props: { ...(props || {}), children: children.flat() },
      }),
      useState: (init) => {
        const idx = hookCursor++;
        if (!(idx in hookStates)) hookStates[idx] = typeof init === "function" ? init() : init;
        const setState = (u) => {
          hookStates[idx] = typeof u === "function" ? u(hookStates[idx]) : u;
        };
        return [hookStates[idx], setState];
      },
      useMemo: (fn) => {
        hookCursor++;
        return fn();
      },
    };
    fakeReact.default = fakeReact;

    const AtomVisualizerStub = ({ element }) =>
      fakeReact.createElement("div", { "data-testid": "inline-atom-visualizer", "data-slug": element.slug });

    const cjsModule = { exports: {} };
    const customRequire = (id) => {
      if (id === "react") return fakeReact;
      if (id === "@/components/AtomVisualizer") return { default: AtomVisualizerStub };
      if (id === "@/data/elementsData") return elementsDataModule;
      if (id === "lucide-react") return { Atom: "i", TrendingUp: "i", X: "i" };
      throw new Error(`Unexpected import in ComparisonVisualLens: ${id}`);
    };
    new Function("require", "module", "exports", "React", code)(customRequire, cjsModule, cjsModule.exports, fakeReact);
    const ComparisonVisualLens = cjsModule.exports.default;

    const findNodes = (node, predicate, acc = []) => {
      if (!node || typeof node !== "object") return acc;
      if (predicate(node)) acc.push(node);
      const children = node.props?.children || [];
      for (const child of Array.isArray(children) ? children : [children]) findNodes(child, predicate, acc);
      return acc;
    };
    const textOf = (node) => {
      if (node === null || node === undefined || typeof node === "boolean") return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      const children = node.props?.children || [];
      return (Array.isArray(children) ? children : [children]).map(textOf).join("");
    };

    const render = (slugs) => {
      hookCursor = 0;
      return ComparisonVisualLens({ elements: resolveComparisonSlugs(slugs) });
    };

    // 1. Default trio (Fe 132 pm, Au 136 pm, O 66 pm): scaled SVG circles reflect exact covalent radius ratios
    let tree = render(["iron", "gold", "oxygen"]);
    const scaledCircles = findNodes(tree, (n) => n.props?.["data-scaled-radius"] !== undefined);
    assert.equal(scaledCircles.length, 3);
    const [rFe, rAu, rO] = scaledCircles.map((c) => c.props["data-scaled-radius"]);
    assert.equal(rAu, 44, "Largest element (Au 136 pm) scales to full reference radius 44");
    assert.ok(Math.abs(rFe / rAu - 132 / 136) < 0.01, "Fe circle radius matches 132/136 of Au");
    assert.ok(Math.abs(rO / rAu - 66 / 136) < 0.01, "O circle radius matches 66/136 of Au");

    // 2. Toggle inline shell/orbital inspector on Oxygen, then switch comparison to Li/Na/K -> unavailable O inspector hides (parent remount is verified in the browser)
    const inspectBtns = findNodes(tree, (n) => n.type === "button" && textOf(n).includes("Shells & Orbitals"));
    assert.equal(inspectBtns.length, 3);
    inspectBtns[2].props.onClick();
    tree = render(["iron", "gold", "oxygen"]);
    const viz = findNodes(tree, (n) => n.type === AtomVisualizerStub);
    assert.equal(viz.length, 1);
    assert.equal(viz[0].props.element.slug, "oxygen");

    tree = render(["lithium", "sodium", "potassium"]);
    assert.equal(
      findNodes(tree, (n) => n.type === AtomVisualizerStub).length,
      0,
      "The unavailable inspected element is hidden; browser journeys verify keyed parent resets"
    );

    // 3. Comparing Oxygen with superheavy Oganesson (atomicRadius === null) renders only 1 scaled radius circle and honest 'Radius not established'
    tree = render(["oxygen", "oganesson"]);
    assert.equal(findNodes(tree, (n) => n.props?.["data-scaled-radius"] !== undefined).length, 1);
    assert.match(textOf(tree), /Radius not established/);

    // Synthetic metric values enforce a zero-baseline ratio: small values must not be inflated for decoration.
    hookCursor = 0;
    tree = ComparisonVisualLens({ elements: [
      { ...getElementBySlug("hydrogen"), electronegativity: 0.01 },
      { ...getElementBySlug("fluorine"), electronegativity: 4 },
    ] });
    const bars = findNodes(tree, (n) => n.props?.style?.width !== undefined);
    assert.equal(parseFloat(bars[0].props.style.width), 0.25, "0.01/4 must occupy 0.25%, not a decorative minimum width");
  });

  it("starts a real quiz immediately on empty deck, resets rounds when settings change, and preserves settings/scores/missed elements across reload", () => {
    const source = fs.readFileSync(path.resolve("src/pages/Practice.jsx"), "utf8");
    const { outputText: code } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
      },
    });

    const storage = createMemoryStorage();
    // Pre-seed prior progress (note + mastered element) to ensure quiz changes never corrupt it
    writeProgress(
      {
        savedSlugs: [],
        masteryMap: { helium: { attempts: 2, correct: 2, mastered: true, lastPracticed: "2025-11-01" } },
        notesMap: { helium: "Inert 1s2 shell." },
        quizHistory: [],
      },
      storage
    );

    const quizPrefsMod = {
      readQuizPrefs: () => {
        const raw = storage.getItem("elementa_quiz_prefs_v1");
        return raw ? JSON.parse(raw) : { mode: null, difficulty: "standard", count: 5 };
      },
      writeQuizPrefs: (prefs) => {
        storage.setItem("elementa_quiz_prefs_v1", JSON.stringify(prefs));
        return { ok: true, prefs };
      },
    };

    let currentSearch = "";
    let progressState = readProgress(storage).progress;

    const mountPractice = () => {
      const hookStates = [];
      const effectDeps = [];
      const refs = [];
      let pendingEffects = [];
      let hookCursor = 0;

      const fakeReact = {
        Fragment: Symbol("Fragment"),
        createElement: (type, props, ...children) => ({
          type,
          props: { ...(props || {}), children: children.flat() },
        }),
        useState: (init) => {
          const idx = hookCursor++;
          if (!(idx in hookStates)) hookStates[idx] = typeof init === "function" ? init() : init;
          const setState = (u) => {
            hookStates[idx] = typeof u === "function" ? u(hookStates[idx]) : u;
          };
          return [hookStates[idx], setState];
        },
        useMemo: (factory) => {
          hookCursor++;
          return factory();
        },
        useRef: (initial) => {
          const idx = hookCursor++;
          if (!(idx in refs)) refs[idx] = { current: initial };
          return refs[idx];
        },
        useEffect: (fn, deps) => {
          const idx = hookCursor++;
          const prev = effectDeps[idx];
          const changed = !prev || !deps || deps.some((d, i) => !Object.is(d, prev[i]));
          if (changed) {
            effectDeps[idx] = deps;
            pendingEffects.push(fn);
          }
        },
      };
      fakeReact.default = fakeReact;

      const fakeRouter = {
        Link: "Link",
        useSearchParams: () => [
          new URLSearchParams(currentSearch),
          (nextParams) => {
            currentSearch = new URLSearchParams(nextParams).toString();
          },
        ],
      };

      const fakeStudyStore = {
        useStudyProgress: () => ({
          savedSlugs: progressState.savedSlugs,
          masteryMap: progressState.masteryMap,
          notesMap: progressState.notesMap,
          quizHistory: progressState.quizHistory,
          toggleSavedSlug: () => false,
          recordQuizResult: ({ mode, score, total, perElementResults }) => {
            const missedSlugs = perElementResults.filter((r) => !r.isCorrect).map((r) => r.slug);
            const session = {
              id: "quiz-live",
              mode,
              score,
              total,
              accuracy: Math.round((score / total) * 100),
              date: "2025-11-11",
              missedSlugs,
            };
            progressState = {
              ...progressState,
              savedSlugs: Array.from(new Set([...progressState.savedSlugs, ...missedSlugs])),
              quizHistory: [session, ...progressState.quizHistory],
            };
            writeProgress(progressState, storage);
            return session;
          },
        }),
      };

      const cjsModule = { exports: {} };
      const customRequire = (id) => {
        if (id === "react") return fakeReact;
        if (id === "react-router-dom") return fakeRouter;
        if (id === "@/components/Navbar") return { default: () => null };
        if (id === "@/components/Footer") return { default: () => null };
        if (id === "@/data/elementsData") return elementsDataModule;
        if (id === "@/lib/studyStore") return fakeStudyStore;
        if (id === "@/lib/quizPreferences") return quizPrefsMod;
        if (id === "lucide-react") {
          return {
            BrainCircuit: "i",
            CheckCircle2: "i",
            XCircle: "i",
            RotateCcw: "i",
            BookmarkCheck: "i",
            Printer: "i",
            ArrowRight: "i",
            Award: "i",
          };
        }
        throw new Error(`Unexpected import in Practice: ${id}`);
      };
      new Function("require", "module", "exports", "React", code)(customRequire, cjsModule, cjsModule.exports, fakeReact);
      const Practice = cjsModule.exports.default;

      const render = () => {
        let tree;
        for (let pass = 0; pass < 3; pass++) {
          hookCursor = 0;
          pendingEffects = [];
          tree = Practice({});
          if (pendingEffects.length === 0) break;
          for (const eff of pendingEffects) eff();
        }
        return tree;
      };
      return { render };
    };

    const findNodes = (node, predicate, acc = []) => {
      if (!node || typeof node !== "object") return acc;
      if (predicate(node)) acc.push(node);
      const children = node.props?.children || [];
      for (const child of Array.isArray(children) ? children : [children]) findNodes(child, predicate, acc);
      return acc;
    };
    const textOf = (node) => {
      if (node === null || node === undefined || typeof node === "boolean") return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      const children = node.props?.children || [];
      return (Array.isArray(children) ? children : [children]).map(textOf).join("");
    };

    // 1. Fresh empty-deck visit to /practice immediately renders Question 1 of 5 (not empty-deck wall)
    const app1 = mountPractice();
    let tree = app1.render();
    assert.equal(findNodes(tree, (n) => n.props?.["data-testid"] === "empty-study-deck-notice").length, 0);
    assert.match(textOf(tree), /Question 1 of 5/);

    // 2. Answer Q1 and advance to Q2, then switch settings to Hard + 10 Qs -> round resets consistently to Question 1 of 10
    const getAnswerButtons = (t) =>
      findNodes(t, (n) => n.type === "button" && typeof n.props?.className === "string" && n.props.className.includes("w-full p-3.5"));
    getAnswerButtons(tree)[0].props.onClick();
    tree = app1.render();
    const nextBtn = findNodes(tree, (n) => n.type === "button" && textOf(n).includes("Next Question"))[0];
    nextBtn.props.onClick();
    tree = app1.render();
    assert.match(textOf(tree), /Question 2 of 5/);

    const hardBtn = findNodes(tree, (n) => n.type === "button" && textOf(n).startsWith("Hard"))[0];
    hardBtn.props.onClick();
    tree = app1.render();
    assert.match(textOf(tree), /Question 1 of 5/, "Changing difficulty mid-round resets back to Question 1");

    const tenBtn = findNodes(tree, (n) => n.type === "button" && textOf(n).trim() === "10 Qs")[0];
    tenBtn.props.onClick();
    tree = app1.render();
    assert.match(textOf(tree), /Question 1 of 10/, "Changing question count updates round length to 10");

    // 3. Switch back to 5 Qs on Hard and complete all 5 questions (4 right, 1 wrong)
    const fiveBtn = findNodes(tree, (n) => n.type === "button" && textOf(n).trim() === "5 Qs")[0];
    fiveBtn.props.onClick();
    tree = app1.render();

    const expectedQuestions = buildDeterministicQuiz(
      [
        "gold", "platinum", "molybdenum", "niobium", "ruthenium", "rhodium", "lanthanum", "cerium",
        "gadolinium", "uranium", "iron", "cobalt", "nickel", "vanadium", "manganese", "titanium",
        "chromium", "copper", "palladium", "silver",
      ].map((s) => getElementBySlug(s)),
      5,
      "trends",
      "hard"
    );

    for (let i = 0; i < 5; i++) {
      const q = expectedQuestions[i];
      const pickSlug = i === 0 ? q.options.find((o) => o.slug !== q.correctSlug).slug : q.correctSlug;
      const ansBtns = getAnswerButtons(tree);
      const chosenIndex = q.options.findIndex((o) => o.slug === pickSlug);
      ansBtns[chosenIndex].props.onClick();
      tree = app1.render();
      const proceed = findNodes(
        tree,
        (n) => n.type === "button" && (textOf(n).includes("Next Question") || textOf(n).includes("Finish & Save Progress"))
      )[0];
      proceed.props.onClick();
      tree = app1.render();
    }
    assert.match(textOf(tree), /You scored 4 \/ 5 \(80%\)/);

    // 4. Simulate full browser reload (even with bare search "") -> preserves Hard setting, missed element in deck, score, and prior notes/mastery
    currentSearch = "";
    progressState = readProgress(storage).progress;
    const appReloaded = mountPractice();
    const reloadedTree = appReloaded.render();
    const hardBtnReloaded = findNodes(reloadedTree, (n) => n.type === "button" && textOf(n).startsWith("Hard"))[0];
    assert.equal(hardBtnReloaded.props["aria-pressed"], true, "Chosen Hard difficulty persists across reload");
    assert.deepEqual(progressState.savedSlugs, ["gold"], "Missed element (gold) was saved to study deck");
    assert.equal(progressState.quizHistory[0].score, 4);
    assert.equal(progressState.notesMap.helium, "Inert 1s2 shell.", "Prior study notes remain uncorrupted");
    assert.equal(progressState.masteryMap.helium.mastered, true, "Prior mastery remains uncorrupted");
  });

  it("exercises DailyElementSpotlight clue -> neighbor guess -> feedback -> inspect/save -> next clue flow", () => {
    const source = fs.readFileSync(path.resolve("src/components/DailyElementSpotlight.jsx"), "utf8");
    const { outputText: code } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
      },
    });

    const hookStates = [];
    let hookCursor = 0;
    const fakeReact = {
      Fragment: Symbol("Fragment"),
      createElement: (type, props, ...children) => ({
        type,
        props: { ...(props || {}), children: children.flat() },
      }),
      useState: (init) => {
        const idx = hookCursor++;
        if (!(idx in hookStates)) hookStates[idx] = typeof init === "function" ? init() : init;
        const setState = (u) => {
          hookStates[idx] = typeof u === "function" ? u(hookStates[idx]) : u;
        };
        return [hookStates[idx], setState];
      },
      useRef: (initial) => {
        const idx = hookCursor++;
        if (!(idx in hookStates)) hookStates[idx] = { current: initial };
        return hookStates[idx];
      },
      useEffect: () => {},
      useMemo: (fn) => {
        hookCursor++;
        return fn();
      },
    };
    fakeReact.default = fakeReact;

    const cjsModule = { exports: {} };
    const customRequire = (id) => {
      if (id === "react") return fakeReact;
      if (id === "react-router-dom") return { Link: "Link" };
      if (id === "@/data/elementsData") return elementsDataModule;
      if (id === "lucide-react") {
        return { Sparkles: "i", Eye: "i", BookmarkCheck: "i", ArrowLeftRight: "i", Shuffle: "i", CheckCircle2: "i" };
      }
      throw new Error(`Unexpected import in DailyElementSpotlight: ${id}`);
    };
    new Function("require", "module", "exports", "React", code)(customRequire, cjsModule, cjsModule.exports, fakeReact);
    const DailyElementSpotlight = cjsModule.exports.default;

    const findNodes = (node, predicate, acc = []) => {
      if (!node || typeof node !== "object") return acc;
      if (predicate(node)) acc.push(node);
      const children = node.props?.children || [];
      for (const child of Array.isArray(children) ? children : [children]) findNodes(child, predicate, acc);
      return acc;
    };
    const textOf = (node) => {
      if (node === null || node === undefined || typeof node === "boolean") return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      const children = node.props?.children || [];
      return (Array.isArray(children) ? children : [children]).map(textOf).join("");
    };

    let inspectedSlug = null;
    let savedSlug = null;
    const render = (saved = []) => {
      hookCursor = 0;
      return DailyElementSpotlight({
        savedSlugs: saved,
        onInspectElement: (s) => {
          inspectedSlug = s;
        },
        onToggleSave: (s) => {
          savedSlug = s;
        },
      });
    };

    // 1. Renders Daily Element Clue with 4 guess buttons + Reveal button
    let tree = render();
    assert.match(textOf(tree), /Daily Element Clue/);
    const guessGroup = findNodes(tree, (n) => n.props?.role === "group")[0];
    const buttons = findNodes(guessGroup, (n) => n.type === "button");
    assert.equal(buttons.length, 5, "4 element options + 1 Reveal button");

    // 2. Pick the first element option -> resolves clue with polite status feedback + Inspect/Save/Next Clue actions
    buttons[0].props.onClick();
    tree = render();
    const statusBox = findNodes(tree, (n) => n.props?.role === "status")[0];
    assert.ok(statusBox, "Feedback region rendered with role=status");

    const inspectBtn = findNodes(statusBox, (n) => n.type === "button" && textOf(n).includes("Inspect Atom"))[0];
    inspectBtn.props.onClick({ currentTarget: null });
    assert.ok(inspectedSlug && getElementBySlug(inspectedSlug), "Inspect Atom opens target element in drawer");

    const saveBtn = findNodes(statusBox, (n) => n.type === "button" && textOf(n).includes("Save"))[0];
    saveBtn.props.onClick();
    assert.equal(savedSlug, inspectedSlug, "Save button toggles target element in study deck");

    // 3. Next Clue advances to Element Clue #2 with a fresh unresolved element
    const nextClueBtn = findNodes(statusBox, (n) => n.type === "button" && textOf(n).includes("Next Clue"))[0];
    nextClueBtn.props.onClick();
    tree = render();
    assert.match(textOf(tree), /Element Clue #2/);
    assert.equal(findNodes(tree, (n) => n.props?.role === "status").length, 0);
  });

  it("keeps AtomVisualizer persistent shell selection separate from transient hover across mouseenter, click, mouseleave, and keyboard/tap", () => {
    const source = fs.readFileSync(path.resolve("src/components/AtomVisualizer.jsx"), "utf8");
    const { outputText: code } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2020,
      },
    });

    const hookStates = [];
    let hookCursor = 0;
    const fakeReact = {
      Fragment: Symbol("Fragment"),
      createElement: (type, props, ...children) => ({
        type,
        props: { ...(props || {}), children: children.flat() },
      }),
      useState: (initialValue) => {
        const idx = hookCursor++;
        if (!(idx in hookStates)) {
          hookStates[idx] = typeof initialValue === "function" ? initialValue() : initialValue;
        }
        const setState = (updater) => {
          hookStates[idx] = typeof updater === "function" ? updater(hookStates[idx]) : updater;
        };
        return [hookStates[idx], setState];
      },
    };

    const cjsModule = { exports: {} };
    fakeReact.default = fakeReact;
    const customRequire = (id) => {
      if (id === "react") return fakeReact;
      if (id === "@/data/elementsData") return elementsDataModule;
      if (id === "lucide-react") return { Atom: "AtomIcon", Info: "InfoIcon" };
      throw new Error(`Unexpected import in AtomVisualizer: ${id}`);
    };
    const fn = new Function("require", "module", "exports", "React", code);
    fn(customRequire, cjsModule, cjsModule.exports, fakeReact);
    const AtomVisualizer = cjsModule.exports.default;

    const findNodes = (node, predicate, acc = []) => {
      if (!node || typeof node !== "object") return acc;
      if (predicate(node)) acc.push(node);
      const children = node.props?.children || [];
      for (const child of Array.isArray(children) ? children : [children]) {
        findNodes(child, predicate, acc);
      }
      return acc;
    };

    const sodium = getElementBySlug("sodium"); // shells: [2, 8, 1]
    const render = (props = {}) => {
      hookCursor = 0;
      return AtomVisualizer({ element: sodium, ...props });
    };

    const getShellButtons = (tree) =>
      findNodes(
        tree,
        (n) => n.type === "button" && typeof n.props?.["aria-label"] === "string" && n.props["aria-label"].startsWith("Shell ")
      );
    const getShellRings = (tree) =>
      findNodes(tree, (n) => n.type === "g" && typeof n.props?.onMouseEnter === "function");

    // 1. Initial render: no shell is persistently selected (aria-pressed is false on all 3 shells)
    let tree = render();
    let buttons = getShellButtons(tree);
    assert.equal(buttons.length, 3);
    assert.deepEqual(
      buttons.map((b) => b.props["aria-pressed"]),
      [false, false, false]
    );

    // 2. Transient hover (mouseenter on K shell, idx 0) highlights the ring but does NOT set aria-pressed
    buttons[0].props.onMouseEnter();
    tree = render();
    buttons = getShellButtons(tree);
    let rings = getShellRings(tree);
    assert.equal(buttons[0].props["aria-pressed"], false, "Transient hover must not mark shell button aria-pressed");
    const ring0CircleOnHover = findNodes(rings[0], (n) => n.type === "circle" && n.props?.fill === "none")[0];
    assert.equal(ring0CircleOnHover.props.stroke, "#ffffff", "Hovered shell ring highlights in SVG");

    // 3. Clicking K shell while hovered selects it persistently (does not toggle it off!)
    buttons[0].props.onClick();
    tree = render();
    buttons = getShellButtons(tree);
    assert.equal(buttons[0].props["aria-pressed"], true, "Clicking after mouseenter must select the shell");

    // 4. Mouseleave clears transient hover while keeping persistent selection and ring highlight
    buttons[0].props.onMouseLeave();
    tree = render();
    buttons = getShellButtons(tree);
    rings = getShellRings(tree);
    assert.equal(buttons[0].props["aria-pressed"], true, "Persistent selection survives mouseleave");
    const ring0CircleAfterLeave = findNodes(rings[0], (n) => n.type === "circle" && n.props?.fill === "none")[0];
    assert.equal(ring0CircleAfterLeave.props.stroke, "#ffffff", "Selected shell ring stays highlighted after mouseleave");

    // 5. Clicking the selected K shell again (even after mouseenter) deselects it honestly
    buttons[0].props.onMouseEnter();
    tree = render();
    buttons = getShellButtons(tree);
    buttons[0].props.onClick();
    buttons[0].props.onMouseLeave();
    tree = render();
    buttons = getShellButtons(tree);
    assert.equal(buttons[0].props["aria-pressed"], false, "Second click deselects the shell");

    // 6. Direct keyboard/tap click on L shell (idx 1) without mouseenter selects then deselects
    buttons[1].props.onClick();
    tree = render();
    buttons = getShellButtons(tree);
    assert.deepEqual(
      buttons.map((b) => b.props["aria-pressed"]),
      [false, true, false]
    );
    buttons[1].props.onClick();
    tree = render();
    buttons = getShellButtons(tree);
    assert.deepEqual(
      buttons.map((b) => b.props["aria-pressed"]),
      [false, false, false]
    );
  });
});