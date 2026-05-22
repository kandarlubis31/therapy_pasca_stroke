/**
 * sw.js — Service Worker for PulihBicara PWA
 *
 * Strategy: Cache-first for static assets, network-first for dynamic content.
 * On install: precache core static assets.
 * On fetch: serve from cache if available, otherwise fetch from network.
 */

const CACHE_NAME = "pulihbicara-v1";

// Assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/favicon.svg",
  "/favicon.ico",
];

// Install event: precache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean old caches
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

// Fetch event: cache-first for static, network-first for everything else
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip browser extensions and chrome-extension
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // For static assets (hashed by Vite), use cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For HTML pages and API calls, use network-first
  if (url.pathname.match(/\.html$/) || url.pathname === "/" || url.pathname === "") {
    event.respondWith(networkFirst(request));
    return;
  }

  // For mouth images, cache-first
  if (url.pathname.startsWith("/mouth/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

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
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}
