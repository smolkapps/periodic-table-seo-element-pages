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

    // 5. Keyboard grid navigation moves across Period 4 and down Group 18 accurately
    const cells = ELEMENTS.map((el) => ({ x: el.xpos, y: el.ypos, hidden: false }));
    const heliumIdx = 1; // He (18, 1)
    const neonIdx = nextCellIndex(cells, heliumIdx, "ArrowDown");
    assert.equal(ELEMENTS[neonIdx].symbol, "Ne");
    const oganessonIdx = nextCellIndex(cells, heliumIdx, "End");
    assert.equal(ELEMENTS[oganessonIdx].symbol, "Og");
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
      // Effects run synchronously on each simulated render; AtomVisualizer's prop-sync effect is idempotent.
      useEffect: (effect) => {
        effect();
      },
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