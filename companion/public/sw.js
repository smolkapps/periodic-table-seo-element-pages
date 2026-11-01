/* Elementa service worker: offline app shell scoped to the study app directory (e.g. /study/). */
const CACHE_PREFIX = "elementa-study-shell-";
const LEGACY_PREFIX = "elementa-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;

const CORE_RELATIVE_PATHS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

function getScopeBase() {
  return (self.registration && self.registration.scope) || new URL("./", self.location.href).href;
}

function extractAssetUrlsFromHtml(htmlText, scopeBase) {
  const discovered = new Set();
  const attrRegex = /\b(?:src|href)=["']([^"']+)["']/gi;
  let match;
  while ((match = attrRegex.exec(htmlText)) !== null) {
    const raw = match[1];
    if (!raw || raw.startsWith("data:") || raw.startsWith("http:") || raw.startsWith("https:") || raw.startsWith("//")) {
      continue;
    }
    try {
      const resolved = new URL(raw, scopeBase);
      if (resolved.origin === self.location.origin && resolved.href.startsWith(scopeBase)) {
        discovered.add(resolved.href);
      }
    } catch {
      // Ignore malformed attribute values
    }
  }
  return Array.from(discovered);
}

async function precacheStudyShell() {
  const scopeBase = getScopeBase();
  const cache = await caches.open(CACHE_NAME);
  const scopeRootUrl = new URL("./", scopeBase).href;
  const indexUrl = new URL("./index.html", scopeBase).href;

  const urlsToCache = new Set(CORE_RELATIVE_PATHS.map((rel) => new URL(rel, scopeBase).href));

  try {
    const indexResponse = await fetch(indexUrl, { cache: "no-cache" });
    if (indexResponse && indexResponse.ok) {
      const htmlText = await indexResponse.clone().text();
      await cache.put(indexUrl, indexResponse.clone());
      await cache.put(scopeRootUrl, indexResponse);
      for (const assetUrl of extractAssetUrlsFromHtml(htmlText, scopeBase)) {
        urlsToCache.add(assetUrl);
      }
    }
  } catch {
    // Continue caching individual assets best-effort
  }

  await Promise.all(
    Array.from(urlsToCache).map(async (url) => {
      if (url === indexUrl || url === scopeRootUrl) {
        const existing = await cache.match(url);
        if (existing) return;
      }
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (res && res.ok) {
          await cache.put(url, res);
        }
      } catch {
        // Ignore individual asset failure during install
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheStudyShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Only delete older Elementa study caches; never touch other apps' caches on the same origin.
            .filter((key) => (key.startsWith(CACHE_PREFIX) || key.startsWith(LEGACY_PREFIX)) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "WARM_ASSETS" || !Array.isArray(data.urls)) return;
  const scopeBase = getScopeBase();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        data.urls.map(async (rawUrl) => {
          try {
            const resolved = new URL(rawUrl, scopeBase);
            if (resolved.origin !== self.location.origin || !resolved.href.startsWith(scopeBase)) return;
            const existing = await cache.match(resolved.href);
            if (existing) return;
            const res = await fetch(resolved.href);
            if (res && res.ok) {
              await cache.put(resolved.href, res);
            }
          } catch {
            // Ignore warm failures
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const scopeBase = getScopeBase();
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.href.startsWith(scopeBase)) return;

  const scopeRootUrl = new URL("./", scopeBase).href;
  const indexUrl = new URL("./index.html", scopeBase).href;

  // Navigations inside scope: network first so updates land, cached app shell as offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copyForIndex = response.clone();
            const copyForRoot = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(indexUrl, copyForIndex);
              cache.put(scopeRootUrl, copyForRoot);
            });
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(indexUrl))
            .then((cached) => cached || caches.match(scopeRootUrl))
        )
    );
    return;
  }

  // Static assets within scope: cache first, then network + cache write.
  event.respondWith(
    caches.match(request).then((exactMatch) => {
      if (exactMatch) return exactMatch;
      return caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      });
    })
  );
});
