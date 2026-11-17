/*
 * AlgoVision service worker: lets the app open and run without a connection.
 *  - Static build files and the code-practice runtime are cached on first use (they never change under the same URL).
 *  - Pages are fetched from the network first and cached; offline, the last copy is shown, or /offline.
 *  - /api/* is never touched, so accounts, progress and sign-in always go to the server (and show their own error
 *    states when offline). Page HTML is the same for everyone, so caching it cannot expose anyone's data.
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = "v1";
const STATIC = `av-static-${VERSION}`;
const PAGES = `av-pages-${VERSION}`;
const MAX_PAGES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/offline", "/"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_PAGES; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Next's in-app navigation data requests vary by header; let the network (or the router's own fallback) handle them.
  if (req.headers.has("RSC") || req.headers.has("Next-Router-Prefetch") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pyodide/") || url.pathname.startsWith("/practice/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        try {
          const res = await fetch(req);
          if (res.ok && res.type === "basic") {
            cache.put(req, res.clone()).then(() => trim(cache));
          }
          return res;
        } catch {
          return (await cache.match(req)) || (await cache.match("/offline")) || Response.error();
        }
      })(),
    );
  }
});
