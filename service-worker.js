const CACHE_NAME = "oneroot-platform-v75";
const APP_SHELL_ASSETS = [
  "/",
  "/shop",
  "/food",
  "/kitchen",
  "/services",
  "/laundry",
  "/equipment",
  "/services/laundry",
  "/services/equipment-rentals",
  "/vacancies",
  "/contact",
  "/track-order",
  "/website/offline.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/assets/oneroot-icon-transparent.png",
  "/website/styles.css?v=20260812a",
  "/website/app.js?v=20260812d",
  "/website/pwa.js?v=20261004b",
  "/static/app.css",
  "/static/app.js",
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
    const isPrivateWorkspace = requestUrl.pathname.startsWith("/app") || requestUrl.pathname.startsWith("/operations");
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!isPrivateWorkspace && response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          if (isPrivateWorkspace) {
            return caches.match("/website/offline.html");
          }
          const exactMatch = await caches.match(event.request);
          return exactMatch || caches.match("/");
        })
    );
    return;
  }

  const cacheableAsset = requestUrl.pathname.startsWith("/website/")
    || requestUrl.pathname.startsWith("/assets/")
    || requestUrl.pathname.startsWith("/static/")
    || ["/manifest.webmanifest", "/icon.svg"].includes(requestUrl.pathname);
  if (!cacheableAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
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
