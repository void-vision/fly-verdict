const CACHE = "fly-verdict-v7";
const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg", "/connectome.bin", "/brain.worker.js"];

const local =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function cacheFirst(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      });
    }),
  );
}

function networkFirst(request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return res;
    })
    .catch(() => caches.match(request).then((hit) => hit || caches.match("/")));
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  const path = url.pathname;
  if (local && path.startsWith("/_next/")) return;

  const models =
    path.startsWith("/mediapipe/") || path === "/connectome.bin" || path === "/brain.worker.js";
  const shell =
    path.endsWith(".webmanifest") ||
    path.endsWith(".svg") ||
    (!local && path.startsWith("/_next/static/"));
  const page = event.request.mode === "navigate" || path === "/" || path === "/index.html";

  if (models || shell) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (page) {
    event.respondWith(networkFirst(event.request));
  }
});
