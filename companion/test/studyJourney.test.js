import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {
  ELEMENTS,
  CATEGORY_META,
  getElementBySlug,
  buildArticle,
  buildComparison,
  buildElementShareUrl,
  buildComparisonShareUrl,
  resolveComparisonSlugs,
} from "../src/data/elementsData.js";
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
});