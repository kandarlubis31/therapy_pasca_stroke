/**
 * sw.js — Service Worker for PulihBicara PWA
 *
 * Strategy: Aggressive caching for full offline support.
 * - Static assets (JS/CSS/images/fonts): Cache-first (hashed by Vite)
 * - HTML navigations: Network-first, fallback to cache
 * - Mouth images & third-party fonts: Stale-while-revalidate
 * - Everything else: Network-first with offline fallback
 */

const CACHE_NAME = "pulihbicara-v3";

// ── Install: precache app shell ──────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json",
      ]).catch(err => console.warn("SW precache partial:", err));
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches + claim clients ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: routing logic ─────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;
  // Skip non-http(s)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  // Skip chrome-extension
  if (url.origin.startsWith("chrome-extension")) return;

  // ── Same-origin static assets → Cache-first ──
  if (url.origin === self.location.origin) {
    // Hashed JS/CSS/fonts from Vite build
    if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    // Mouth images → stale-while-revalidate (MUST come before generic image check)
    if (url.pathname.startsWith("/mouth/")) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
    // Images & media
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    // Icons directory
    if (url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirst(request));
      return;
    }
    // HTML navigations → network-first, fallback to cache
    if (request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
      event.respondWith(networkFirst(request));
      return;
    }
  }

  // ── Third-party: Google Fonts → cache-first ──
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Everything else → network-first ──
  event.respondWith(networkFirst(request));
});

// ── Strategy: Cache First ────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline + not cached → return empty
    return new Response("Offline", { status: 503, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

// ── Strategy: Network First ──────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // If navigating & offline → return cached "/" as fallback
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response("Offline", { status: 503, statusText: "Offline", headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

// ── Strategy: Stale While Revalidate ─────
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached ? Promise.resolve(cached) : fetchPromise;
}
