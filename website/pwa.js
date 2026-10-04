(function () {
  const DB_NAME = "oneroot-offline-v1";
  const DB_VERSION = 1;
  const CATALOG_STORE = "posCatalog";
  const QUEUE_STORE = "pendingSales";
  const userId = document.body?.dataset.offlineUserId || "";
  const installButtons = Array.from(document.querySelectorAll("[data-install-app]"));
  const connectionStatus = document.querySelector("[data-connection-status]");
  const connectionText = document.querySelector("[data-connection-status-text]");
  const syncButtons = Array.from(document.querySelectorAll("[data-offline-sync]"));
  let deferredPrompt = null;
  let databasePromise = null;

  function toggleInstallButtons(show) {
    installButtons.forEach((button) => {
      button.hidden = !show;
    });
  }

  async function promptInstall() {
    if (!deferredPrompt) {
      window.location.href = "/app/";
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    toggleInstallButtons(false);
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Offline storage is unavailable."));
    });
  }

  function openDatabase() {
    if (!databasePromise) {
      databasePromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error("This browser does not support offline storage."));
          return;
        }
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(CATALOG_STORE)) {
            database.createObjectStore(CATALOG_STORE, { keyPath: "key" });
          }
          if (!database.objectStoreNames.contains(QUEUE_STORE)) {
            database.createObjectStore(QUEUE_STORE, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Offline storage could not be opened."));
      });
    }
    return databasePromise;
  }

  function userKey(kind, desk) {
    return `${userId || "anonymous"}:${kind}:${desk || "all"}`;
  }

  async function readStore(storeName, key) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readonly");
    return requestToPromise(transaction.objectStore(storeName).get(key));
  }

  async function writeStore(storeName, value) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    await requestToPromise(transaction.objectStore(storeName).put(value));
  }

  async function deleteStoreValue(storeName, key) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    await requestToPromise(transaction.objectStore(storeName).delete(key));
  }

  async function allStoreValues(storeName) {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readonly");
    return requestToPromise(transaction.objectStore(storeName).getAll());
  }

  async function deleteUserCatalogs() {
    if (!userId) return;
    const database = await openDatabase();
    const transaction = database.transaction(CATALOG_STORE, "readwrite");
    const store = transaction.objectStore(CATALOG_STORE);
    const request = store.openCursor();
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (String(cursor.key).startsWith(`${userId}:`)) {
          cursor.delete();
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error("Offline catalogue could not be cleared."));
    });
  }

  const offlineStore = {
    isAvailable: () => Boolean(userId && window.indexedDB),
    async getCatalog(desk) {
      const record = await readStore(CATALOG_STORE, userKey("catalog", desk));
      return Array.isArray(record?.products) ? record.products : [];
    },
    async putCatalog(desk, products) {
      if (!userId) return;
      await writeStore(CATALOG_STORE, {
        key: userKey("catalog", desk),
        userId,
        desk,
        products: Array.isArray(products) ? products : [],
        updatedAt: new Date().toISOString()
      });
    },
    async queueSale(desk, payload) {
      if (!userId) {
        throw new Error("Sign in before using offline POS.");
      }
      const requestId = String(payload?.requestId || "").trim();
      if (!requestId) {
        throw new Error("This sale has no safe sync reference.");
      }
      const existing = await readStore(QUEUE_STORE, requestId);
      if (existing) return existing;
      const record = {
        id: requestId,
        userId,
        desk,
        payload,
        status: "queued",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: ""
      };
      await writeStore(QUEUE_STORE, record);
      await emitConnectionState();
      return record;
    },
    async pendingSales(desk) {
      if (!userId) return [];
      const records = await allStoreValues(QUEUE_STORE);
      return records
        .filter((record) => record?.userId === userId && (!desk || record.desk === desk))
        .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)));
    },
    async removeQueuedSale(id) {
      await deleteStoreValue(QUEUE_STORE, id);
      await emitConnectionState();
    },
    async updateQueuedSale(id, changes) {
      const record = await readStore(QUEUE_STORE, id);
      if (!record) return;
      await writeStore(QUEUE_STORE, { ...record, ...changes, updatedAt: new Date().toISOString() });
      await emitConnectionState();
    },
    clearUserCatalogs: deleteUserCatalogs
  };

  async function emitConnectionState() {
    let pendingCount = 0;
    try {
      pendingCount = (await offlineStore.pendingSales()).length;
    } catch (_error) {
      pendingCount = 0;
    }
    const online = navigator.onLine;
    if (connectionStatus) {
      connectionStatus.classList.toggle("is-offline", !online);
      connectionStatus.classList.toggle("has-pending", pendingCount > 0);
    }
    if (connectionText) {
      connectionText.textContent = !online
        ? `Offline${pendingCount ? ` · ${pendingCount} sale${pendingCount === 1 ? "" : "s"} waiting` : ""}`
        : pendingCount
          ? `${pendingCount} sale${pendingCount === 1 ? "" : "s"} waiting to sync`
          : "Online";
    }
    syncButtons.forEach((button) => {
      button.hidden = !online || pendingCount === 0;
    });
    document.dispatchEvent(new CustomEvent("oneroot:connection", { detail: { online, pendingCount } }));
  }

  installButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      void promptInstall();
    });
  });
  syncButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("oneroot:sync-request"));
    });
  });
  document.querySelectorAll("[data-offline-logout]").forEach((form) => {
    form.addEventListener("submit", () => {
      // Pending sales remain tied to this user until the server confirms them.
      void offlineStore.clearUserCatalogs().catch(() => {});
    });
  });

  window.OneRootOffline = offlineStore;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    toggleInstallButtons(true);
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    toggleInstallButtons(false);
  });
  window.addEventListener("online", () => void emitConnectionState());
  window.addEventListener("offline", () => void emitConnectionState());
  toggleInstallButtons(false);
  void emitConnectionState();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    });
  }
})();
