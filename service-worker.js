const CACHE_NAME = "oneroot-operations-app-v32";
const SCOPE_PATH = new URL(self.registration.scope || self.location.href).pathname;
const BASE_PATH = SCOPE_PATH.endsWith("/") ? SCOPE_PATH : `${SCOPE_PATH}/`;

function buildScopedAssetPath(asset) {
  const normalizedAsset = String(asset || "").replace(/^\/+/, "");
  return normalizedAsset ? `${BASE_PATH}${normalizedAsset}`.replace(/\/{2,}/g, "/") : BASE_PATH;
}

const APP_SHELL_ASSETS = [
  "",
  "index.html",
  "styles.css",
  "script.js",
  "oneroot_product_catalog.js",
  "pos_inventory_extension.js",
  "online_orders_extension.js",
  "data/public/oneroot-hosted-workspace-seed.json",
  "assets/oneroot-logo.png",
  "manifest.webmanifest",
  "icon.svg",
  "Tenancy_Agreement_Template.docx",
  "service-worker.js"
].map(buildScopedAssetPath);

const APP_SHELL_PATHS = new Set(
  APP_SHELL_ASSETS.map((assetPath) => new URL(assetPath, self.location.origin).pathname)
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isAppShellRequest =
    requestUrl.origin === self.location.origin && APP_SHELL_PATHS.has(requestUrl.pathname);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(buildScopedAssetPath("index.html")))
    );
    return;
  }

  if (isAppShellRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      });
    })
  );
});
