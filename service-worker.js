const CACHE_NAME = "oneroot-platform-v61";
const APP_SHELL_ASSETS = [
  "/",
  "/shop",
  "/services",
  "/services/laundry",
  "/services/equipment-rentals",
  "/vacancies",
  "/contact",
  "/track-order",
  "/operations/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/assets/oneroot-logo.png",
  "/website/styles.css?v=20260802d",
  "/website/app.js?v=20260802b",
  "/website/pwa.js?v=20260801c",
  "/static/app.css",
  "/static/oneroot-mark.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isAppApi = requestUrl.pathname.startsWith("/app/api/");
  if (isAppApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const exactMatch = await caches.match(event.request);
          return exactMatch || caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
