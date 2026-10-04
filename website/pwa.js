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
        kind: "pos-sale",
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
        .filter((record) => record?.userId === userId && record?.kind !== "form" && (!desk || record.desk === desk))
        .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)));
    },
    async queueFormSubmission({ path, fields, label }) {
      if (!userId) {
        throw new Error("Sign in before using offline forms.");
      }
      const requestId = window.crypto?.randomUUID?.() || `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const record = {
        id: requestId,
        kind: "form",
        userId,
        path,
        fields: [...(fields || []), ["offlineRequestId", requestId]],
        label: label || "OneRoot entry",
        status: "queued",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastError: ""
      };
      await writeStore(QUEUE_STORE, record);
      await emitConnectionState();
      return record;
    },
    async pendingForms() {
      if (!userId) return [];
      const records = await allStoreValues(QUEUE_STORE);
      return records
        .filter((record) => record?.userId === userId && record?.kind === "form")
        .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)));
    },
    async pendingEntries() {
      if (!userId) return [];
      const records = await allStoreValues(QUEUE_STORE);
      return records.filter((record) => record?.userId === userId);
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
      pendingCount = (await offlineStore.pendingEntries()).length;
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
        ? `Offline${pendingCount ? ` · ${pendingCount} entr${pendingCount === 1 ? "y" : "ies"} waiting` : ""}`
        : pendingCount
          ? `${pendingCount} entr${pendingCount === 1 ? "y" : "ies"} waiting to sync`
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

  function showFormQueueMessage(form, message, type = "info") {
    let node = form.querySelector("[data-offline-form-message]");
    if (!node) {
      node = document.createElement("p");
      node.dataset.offlineFormMessage = "true";
      node.className = "offline-form-message";
      form.prepend(node);
    }
    node.textContent = message;
    node.classList.toggle("danger-text", type === "error");
  }

  function resetQueuedFormFields(form) {
    String(form.dataset.offlineReset || "").split(",").map((name) => name.trim()).filter(Boolean).forEach((name) => {
      Array.from(form.elements).filter((field) => field.name === name).forEach((field) => {
        if (field.type === "checkbox" || field.type === "radio") {
          field.checked = false;
        } else {
          field.value = "";
        }
      });
    });
  }

  async function queueOfflineForm(form) {
    if (!form.reportValidity()) return;
    const fileInput = Array.from(form.querySelectorAll('input[type="file"]')).find((input) => input.files?.length);
    if (fileInput) {
      showFormQueueMessage(form, "Reconnect before saving an attachment. Photos and receipts cannot be queued offline yet.", "error");
      return;
    }
    const fields = [];
    new FormData(form).forEach((value, name) => {
      if (typeof value === "string") fields.push([name, value]);
    });
    const target = new URL(form.action || window.location.href, window.location.origin);
    await offlineStore.queueFormSubmission({
      path: `${target.pathname}${target.search}`,
      fields,
      label: form.dataset.offlineLabel || "OneRoot entry"
    });
    resetQueuedFormFields(form);
    showFormQueueMessage(form, "Saved on this device. It will be posted to OneRoot automatically when the internet returns.");
  }

  async function syncQueuedForms({ announce = false } = {}) {
    if (!navigator.onLine || !offlineStore.isAvailable()) return;
    const savedForms = await offlineStore.pendingForms();
    const pendingForms = savedForms.filter((entry) => entry.status !== "needs-attention");
    let synced = 0;
    let needsAttention = 0;
    for (const entry of pendingForms) {
      try {
        const response = await fetch(entry.path, {
          method: "POST",
          credentials: "same-origin",
          redirect: "manual",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
            "X-OneRoot-Offline-Sync": "1"
          },
          body: new URLSearchParams(entry.fields)
        });
        const result = await response.json();
        if (response.ok && result.ok) {
          await offlineStore.removeQueuedSale(entry.id);
          synced += 1;
          continue;
        }
        if (response.status >= 400 && response.status < 500) {
          await offlineStore.updateQueuedSale(entry.id, {
            status: "needs-attention",
            lastError: result.error || "This saved entry needs live review."
          });
          needsAttention += 1;
          continue;
        }
        break;
      } catch (_error) {
        break;
      }
    }
    if (synced || (announce && needsAttention)) {
      await emitConnectionState();
      document.dispatchEvent(new CustomEvent("oneroot:offline-forms-synced", { detail: { synced, needsAttention } }));
    }
  }

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-offline-queue]");
    if (!form || navigator.onLine) return;
    event.preventDefault();
    void queueOfflineForm(form).catch(() => {
      showFormQueueMessage(form, "This device could not store the entry. Reconnect and try again.", "error");
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
  window.addEventListener("online", () => void syncQueuedForms());
  document.addEventListener("oneroot:sync-request", () => void syncQueuedForms({ announce: true }));
  toggleInstallButtons(false);
  void emitConnectionState();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    });
  }
})();
