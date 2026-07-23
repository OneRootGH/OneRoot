const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8124);
const ROOT_DIR = __dirname;
const WEBSITE_DIR = path.join(ROOT_DIR, "website");
const DATA_DIR = path.join(ROOT_DIR, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const LIVE_WORKSPACE_FILE = path.join(DATA_DIR, "live-workspace.json");
const WORKSPACE_AUTH_FILES = [
  LIVE_WORKSPACE_FILE,
  path.join(ROOT_DIR, "outputs", "oneroot-hosted-workspace-latest.json"),
  path.join(ROOT_DIR, "data", "public", "oneroot-hosted-workspace-seed.json")
];
const WORKSPACE_SNAPSHOT_FILES = [
  LIVE_WORKSPACE_FILE,
  path.join(ROOT_DIR, "outputs", "oneroot-hosted-workspace-latest.json"),
  path.join(ROOT_DIR, "data", "public", "oneroot-hosted-workspace-seed.json")
];
const SERVICE_OFFERS_FILE = path.join(WEBSITE_DIR, "service_offers.json");
const PRODUCT_CATALOG_FILE = path.join(ROOT_DIR, "oneroot_product_catalog.js");
const ONLINE_ORDER_ALLOWED_ROLES = new Set([
  "owner",
  "admin",
  "finance",
  "operations",
  "sales-stock-operator",
  "cashier"
]);
const WORKSPACE_SESSION_COOKIE = "oneroot_workspace_session";
const WORKSPACE_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const WORKSPACE_SESSION_SECRET =
  normalizeText(process.env.ONEROOT_SESSION_SECRET) ||
  crypto
    .createHash("sha256")
    .update(
      [
        normalizeText(process.env.ONEROOT_ADMIN_USER),
        normalizeText(process.env.ONEROOT_ADMIN_PASSWORD),
        normalizeText(process.env.ONEROOT_DATABASE_URL || process.env.DATABASE_URL),
        "oneroot-workspace-session"
      ].join("|")
    )
    .digest("hex");
const WORKSPACE_EVENT_CLIENTS = new Set();
const POS_SYNC_SOURCE_TYPE = "pos-summary";
const POS_SYNC_NOTE_PREFIX = "[POS Sync]";
const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled"
];
const PUBLIC_PAYMENT_METHODS = [
  "Cash On Delivery",
  "Mobile Money",
  "Bank Transfer",
  "Pay On Pickup"
];
const BUSINESS_AREAS = [
  {
    id: "water-equipment",
    label: "OneRoot Water & Equipment Rentals",
    shortLabel: "Water & Equipment",
    orderable: true
  },
  {
    id: "cold-store-groceries",
    label: "OneRoot Cold Store & Groceries",
    shortLabel: "Cold Store & Groceries",
    orderable: true
  },
  {
    id: "laundry-services",
    label: "OneRoot Laundry Services",
    shortLabel: "Laundry",
    orderable: true
  },
  {
    id: "mobile-money",
    label: "OneRoot Mobile Money Services",
    shortLabel: "Mobile Money",
    orderable: true
  },
  {
    id: "rentals-apartments",
    label: "OneRoot Rentals & Apartments",
    shortLabel: "Apartments",
    orderable: true
  },
  {
    id: "fresh-foods-drinks",
    label: "OneRoot Fresh Foods & Drinks",
    shortLabel: "Fresh Foods & Drinks",
    orderable: true
  },
  {
    id: "kitchen",
    label: "OneRoot Kitchen",
    shortLabel: "Kitchen",
    orderable: true
  },
  {
    id: "shared-operations",
    label: "OneRoot Shared Operations",
    shortLabel: "Shared Operations",
    orderable: false
  }
];
const BUSINESS_AREA_MAP = new Map(BUSINESS_AREAS.map((area) => [area.id, area]));
const WEBSITE_STATIC_MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};
const OPERATIONS_ALLOWED_ROOT_FILES = new Set([
  "icon.svg",
  "index.html",
  "manifest.webmanifest",
  "online_orders_extension.js",
  "oneroot_product_catalog.js",
  "pos_inventory_extension.js",
  "script.js",
  "service-worker.js",
  "styles.css",
  "Tenancy_Agreement_Template.docx"
]);
const ADMIN_USER = normalizeText(process.env.ONEROOT_ADMIN_USER);
const ADMIN_PASSWORD = normalizeText(process.env.ONEROOT_ADMIN_PASSWORD);
const ADMIN_AUTH_ENABLED = Boolean(ADMIN_USER && ADMIN_PASSWORD);
const HOST = normalizeText(process.env.HOST) || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const DATABASE_URL =
  normalizeText(process.env.ONEROOT_DATABASE_PRIVATE_URL) ||
  normalizeText(process.env.DATABASE_PRIVATE_URL) ||
  normalizeText(process.env.ONEROOT_DATABASE_URL) ||
  normalizeText(process.env.DATABASE_URL);
const DATABASE_CA_CERT =
  String(process.env.ONEROOT_DATABASE_CA_CERT || process.env.DATABASE_CA_CERT || "").trim();
const DATABASE_SSL_MODE = normalizeText(
  process.env.ONEROOT_DATABASE_SSL || process.env.DATABASE_SSL
).toLowerCase();
const WORKSPACE_SNAPSHOT_PRIMARY_KEY = "primary";
const DATABASE_OPERATION_TIMEOUT_MS = 12000;
let databasePoolPromise = null;
let databaseSchemaReadyPromise = null;
let workspaceSnapshotCache = null;
const workspaceAuthProfileCache = {
  profiles: []
};

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return normalizeText(value).replace(/[^\d+]/g, "");
}

function hasDatabaseConfig() {
  return Boolean(DATABASE_URL);
}

function shouldUseDatabaseSsl() {
  return hasDatabaseConfig() && !["0", "false", "off", "disable"].includes(DATABASE_SSL_MODE);
}

function getDatabaseSslConfig() {
  if (!shouldUseDatabaseSsl()) {
    return undefined;
  }

  if (DATABASE_CA_CERT) {
    return {
      rejectUnauthorized: true,
      ca: DATABASE_CA_CERT.replace(/\\n/g, "\n")
    };
  }

  return {
    rejectUnauthorized: false
  };
}

async function getDatabasePool() {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!databasePoolPromise) {
    databasePoolPromise = Promise.resolve().then(() => {
      const { Pool } = require("pg");
      return new Pool({
        connectionString: DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
        query_timeout: 3000,
        statement_timeout: 3000,
        ssl: getDatabaseSslConfig()
      });
    });
  }

  return databasePoolPromise;
}

async function ensureDatabaseSchema() {
  if (!hasDatabaseConfig()) {
    return false;
  }

  if (!databaseSchemaReadyPromise) {
    databaseSchemaReadyPromise = (async () => {
      const pool = await getDatabasePool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS oneroot_workspace_snapshots (
          workspace_key TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS oneroot_orders (
          id TEXT PRIMARY KEY,
          order_number TEXT UNIQUE NOT NULL,
          customer_phone_normalized TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS oneroot_orders_lookup_idx
        ON oneroot_orders (order_number, customer_phone_normalized)
      `);

      return true;
    })().catch((error) => {
      databaseSchemaReadyPromise = null;
      throw error;
    });
  }

  return databaseSchemaReadyPromise;
}

async function runWithDatabaseFallback(label, databaseOperation, fallbackOperation) {
  if (!hasDatabaseConfig()) {
    return fallbackOperation();
  }

  try {
    return await Promise.race([
      (async () => {
        await ensureDatabaseSchema();
        const pool = await getDatabasePool();
        return databaseOperation(pool);
      })(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${label} timed out after ${DATABASE_OPERATION_TIMEOUT_MS}ms.`));
        }, DATABASE_OPERATION_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    console.error(`[oneroot-storage] ${label} failed, using file storage instead.`, error);
    return fallbackOperation();
  }
}

function ensureOrdersStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]\n", "utf8");
  }
}

function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readOrdersFile() {
  ensureOrdersStore();
  const parsed = readJsonFile(ORDERS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeOrdersFile(orders) {
  ensureOrdersStore();
  writeJsonFile(ORDERS_FILE, orders);
}

function ensureWorkspaceStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getWorkspaceRoot(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  return payload.workspace && typeof payload.workspace === "object" ? payload.workspace : payload;
}

function normalizeWorkspaceSnapshotPayload(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const settings = root.settings && typeof root.settings === "object" ? root.settings : {};

  return {
    schemaVersion: Number.isFinite(Number(root.schemaVersion)) ? Number(root.schemaVersion) : 2,
    app: normalizeText(root.app) || "OneRoot Operations App",
    exportedAt: normalizeText(root.exportedAt) || new Date().toISOString(),
    settings: {
      currency: normalizeText(settings.currency) || "GHS",
      activeUserId: normalizeText(settings.activeUserId)
    },
    workspace: getWorkspaceRoot(root)
  };
}

function setWorkspaceSnapshotCache(payload) {
  const snapshot = normalizeWorkspaceSnapshotPayload(payload);
  workspaceSnapshotCache = snapshot;
  setWorkspaceAuthProfileCache(snapshot);
  return snapshot;
}

function getWorkspaceSnapshotCache() {
  return workspaceSnapshotCache && typeof workspaceSnapshotCache === "object"
    ? normalizeWorkspaceSnapshotPayload(workspaceSnapshotCache)
    : null;
}

function countWorkspaceBusinessRecords(payload) {
  const workspace = getWorkspaceRoot(payload);

  return Object.entries(workspace).reduce((total, [key, value]) => {
    if (key === "userProfiles") {
      return total;
    }

    return total + (Array.isArray(value) ? value.length : 0);
  }, 0);
}

function createWorkspaceEventPayload(payload) {
  const snapshot = normalizeWorkspaceSnapshotPayload(payload);

  return {
    type: "workspace-updated",
    exportedAt: normalizeText(snapshot.exportedAt) || new Date().toISOString(),
    recordCount: countWorkspaceBusinessRecords(snapshot)
  };
}

function broadcastWorkspaceSnapshotUpdate(payload) {
  if (WORKSPACE_EVENT_CLIENTS.size === 0) {
    return;
  }

  const message = `event: workspace\ndata: ${JSON.stringify(createWorkspaceEventPayload(payload))}\n\n`;

  for (const client of Array.from(WORKSPACE_EVENT_CLIENTS)) {
    try {
      client.response.write(message);
    } catch (error) {
      console.error("[oneroot-storage] Workspace event stream write failed.", error);
      WORKSPACE_EVENT_CLIENTS.delete(client);

      if (client.keepAliveTimer) {
        clearInterval(client.keepAliveTimer);
      }
    }
  }
}

function readWorkspaceSnapshotFile() {
  ensureWorkspaceStore();

  const snapshotFiles = hasDatabaseConfig() ? [LIVE_WORKSPACE_FILE] : WORKSPACE_SNAPSHOT_FILES;

  for (const filePath of snapshotFiles) {
    const parsed = readJsonFile(filePath, null);

    if (parsed && typeof parsed === "object") {
      return setWorkspaceSnapshotCache(parsed);
    }
  }

  const cachedSnapshot = getWorkspaceSnapshotCache();

  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  return setWorkspaceSnapshotCache(null);
}

function writeWorkspaceSnapshotFile(payload) {
  ensureWorkspaceStore();
  const normalized = normalizeWorkspaceSnapshotPayload(payload);
  writeJsonFile(LIVE_WORKSPACE_FILE, normalized);
  return setWorkspaceSnapshotCache(normalized);
}

function getWorkspaceSnapshotFallback() {
  const cachedSnapshot = getWorkspaceSnapshotCache();

  if (
    cachedSnapshot &&
    (countWorkspaceBusinessRecords(cachedSnapshot) > 0 ||
      extractWorkspaceAccessProfiles(cachedSnapshot).length > 0)
  ) {
    return cachedSnapshot;
  }

  return readWorkspaceSnapshotFile();
}

function mergeOrderIntoList(orders, nextOrder) {
  return [nextOrder, ...(Array.isArray(orders) ? orders : []).filter((order) => order.id !== nextOrder.id)].sort(
    (left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
  );
}

function mergeOrderCollections(...collections) {
  const merged = new Map();

  collections.flat().forEach((order) => {
    if (!order || typeof order !== "object") {
      return;
    }

    const id = normalizeText(order.id);
    const orderNumber = normalizeText(order.orderNumber).toUpperCase();
    const key = id || orderNumber;

    if (!key) {
      return;
    }

    merged.set(key, order);
  });

  return sortOrdersForDisplay([...merged.values()]);
}

function sortOrdersForDisplay(orders) {
  return [...(Array.isArray(orders) ? orders : [])].sort((left, right) =>
    String(right.updatedAt || right.createdAt || "").localeCompare(
      String(left.updatedAt || left.createdAt || "")
    )
  );
}

function readOrdersFromWorkspaceSnapshotPayload(payload) {
  const workspace = getWorkspaceRoot(payload);
  return Array.isArray(workspace.onlineOrders)
    ? workspace.onlineOrders.filter((order) => order && typeof order === "object")
    : [];
}

function readOrdersFromWorkspaceSnapshotFile() {
  return readOrdersFromWorkspaceSnapshotPayload(readWorkspaceSnapshotFile());
}

function preserveWorkspaceOrderHistory(nextPayload, currentPayload) {
  const nextRoot = nextPayload && typeof nextPayload === "object" ? nextPayload : {};
  const nextWorkspace = getWorkspaceRoot(nextRoot);
  const currentOrders = readOrdersFromWorkspaceSnapshotPayload(currentPayload);

  if (Array.isArray(nextWorkspace.onlineOrders) || currentOrders.length === 0) {
    return nextRoot;
  }

  const nextWorkspaceContainer =
    nextRoot.workspace && typeof nextRoot.workspace === "object" ? nextRoot.workspace : nextWorkspace;

  return {
    ...nextRoot,
    workspace: {
      ...nextWorkspaceContainer,
      onlineOrders: currentOrders
    }
  };
}

function normalizeDateInput(value) {
  const raw = normalizeText(value);

  if (!raw) {
    return "";
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeBusinessAreaId(value) {
  const businessAreaId = normalizeText(value);
  return BUSINESS_AREA_MAP.has(businessAreaId) ? businessAreaId : "";
}

function parseAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
}

function parseQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? Number(quantity.toFixed(2)) : 0;
}

function getBusinessAreaShortLabel(businessAreaId) {
  return BUSINESS_AREA_MAP.get(normalizeBusinessAreaId(businessAreaId))?.shortLabel || "Business Area";
}

function getRecordTimestamp(record, keys = ["updatedAt", "closedAt", "timestamp", "createdAt", "date"]) {
  for (const key of keys) {
    const value = normalizeText(record?.[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function chooseNewerRecord(currentRecord, nextRecord, keys) {
  if (!currentRecord) {
    return nextRecord;
  }

  if (!nextRecord) {
    return currentRecord;
  }

  const currentTimestamp = getRecordTimestamp(currentRecord, keys);
  const nextTimestamp = getRecordTimestamp(nextRecord, keys);

  if (nextTimestamp > currentTimestamp) {
    return nextRecord;
  }

  if (currentTimestamp > nextTimestamp) {
    return currentRecord;
  }

  return nextRecord;
}

function sortPosOrdersForWorkspace(records) {
  return [...records].sort((left, right) => {
    const dateDifference = normalizeDateInput(right.orderDate).localeCompare(
      normalizeDateInput(left.orderDate)
    );

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return getRecordTimestamp(right, ["updatedAt", "createdAt"]).localeCompare(
      getRecordTimestamp(left, ["updatedAt", "createdAt"])
    );
  });
}

function sortPosCounterClosuresForWorkspace(records) {
  return [...records].sort((left, right) => {
    const dateDifference = normalizeDateInput(right.orderDate).localeCompare(
      normalizeDateInput(left.orderDate)
    );

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return getRecordTimestamp(right, ["closedAt", "updatedAt", "createdAt"]).localeCompare(
      getRecordTimestamp(left, ["closedAt", "updatedAt", "createdAt"])
    );
  });
}

function sortSalesForWorkspace(records) {
  return [...records].sort((left, right) => {
    const dateDifference = normalizeDateInput(right.date).localeCompare(
      normalizeDateInput(left.date)
    );

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return getRecordTimestamp(right, ["updatedAt", "createdAt"]).localeCompare(
      getRecordTimestamp(left, ["updatedAt", "createdAt"])
    );
  });
}

function sortAuditTrailForWorkspace(records) {
  return [...records].sort((left, right) => {
    const timestampDifference = getRecordTimestamp(right, ["timestamp", "createdAt", "updatedAt"]).localeCompare(
      getRecordTimestamp(left, ["timestamp", "createdAt", "updatedAt"])
    );

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return normalizeText(right.id).localeCompare(normalizeText(left.id));
  });
}

function sortInventoryItemsForWorkspace(records) {
  return [...records].sort((left, right) => {
    const activeDifference = Number(Boolean(right.active)) - Number(Boolean(left.active));

    if (activeDifference !== 0) {
      return activeDifference;
    }

    const areaDifference = getBusinessAreaShortLabel(left.businessAreaId).localeCompare(
      getBusinessAreaShortLabel(right.businessAreaId)
    );

    if (areaDifference !== 0) {
      return areaDifference;
    }

    const categoryDifference = normalizeText(left.category).localeCompare(normalizeText(right.category));

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    return normalizeText(left.name).localeCompare(normalizeText(right.name));
  });
}

function mergeRecordsByKey(existingRecords, nextRecords, buildKey, sortFn, timestampKeys) {
  const merged = new Map();

  (Array.isArray(existingRecords) ? existingRecords : []).forEach((record) => {
    const key = buildKey(record);

    if (key) {
      merged.set(key, record);
    }
  });

  (Array.isArray(nextRecords) ? nextRecords : []).forEach((record) => {
    const key = buildKey(record);

    if (!key) {
      return;
    }

    merged.set(key, chooseNewerRecord(merged.get(key), record, timestampKeys));
  });

  const records = [...merged.values()];
  return typeof sortFn === "function" ? sortFn(records) : records;
}

function normalizePosOrderItemRecord(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const productId = normalizeText(item.productId || item.inventoryItemId || item.id);
  const name = normalizeText(item.name || item.productName);
  const quantity = parseQuantity(item.quantity);
  const unitPrice = parseAmount(item.unitPrice || item.salesPrice || item.price);
  const totalAmount = parseAmount(item.totalAmount || quantity * unitPrice);
  const itemType = normalizeText(item.itemType).toLowerCase() === "service" ? "service" : "stock";
  const trackInventory =
    itemType === "stock" &&
    !(
      item.trackInventory === false ||
      item.trackInventory === "false" ||
      item.trackInventory === 0 ||
      item.trackInventory === "0"
    );

  if (!productId || !name || quantity <= 0) {
    return null;
  }

  return {
    ...item,
    productId,
    businessAreaId: normalizeBusinessAreaId(item.businessAreaId || item.businessArea),
    sku: normalizeText(item.sku),
    barcode: normalizeText(item.barcode),
    name,
    category: normalizeText(item.category),
    itemType,
    trackInventory,
    quantity,
    unitPrice,
    totalAmount
  };
}

function normalizePosOrderRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const items = Array.isArray(record.items)
    ? record.items.map(normalizePosOrderItemRecord).filter(Boolean)
    : [];
  const orderDate = normalizeDateInput(record.orderDate || record.date);
  const businessAreaIds = Array.from(
    new Set(
      [
        ...(Array.isArray(record.businessAreaIds) ? record.businessAreaIds : []),
        record.businessAreaId,
        ...items.map((item) => item.businessAreaId)
      ]
        .map((businessAreaId) => normalizeBusinessAreaId(businessAreaId))
        .filter(Boolean)
    )
  );
  const businessAreaId =
    normalizeBusinessAreaId(record.businessAreaId) || businessAreaIds[0] || "";
  const totalAmount = parseAmount(
    record.totalAmount || record.subtotal || items.reduce((sum, item) => sum + item.totalAmount, 0)
  );
  const itemCount = Number(
    items.reduce((sum, item) => sum + Number(item.quantity || 0), 0).toFixed(2)
  );

  if (!orderDate || items.length === 0 || totalAmount <= 0) {
    return null;
  }

  return {
    ...record,
    id: normalizeText(record.id) || crypto.randomUUID(),
    orderNumber: normalizeText(record.orderNumber),
    createdAt: normalizeText(record.createdAt) || new Date().toISOString(),
    updatedAt: normalizeText(record.updatedAt) || new Date().toISOString(),
    orderDate,
    businessAreaId,
    businessAreaIds,
    paymentMethod: normalizeText(record.paymentMethod) || "Cash",
    customerName: normalizeText(record.customerName),
    customerPhone: normalizeText(record.customerPhone),
    notes: normalizeText(record.notes),
    items,
    itemCount,
    subtotal: parseAmount(record.subtotal || totalAmount),
    totalAmount
  };
}

function normalizePosCounterClosureRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const orderDate = normalizeDateInput(record.orderDate || record.date);
  const businessAreaId = normalizeBusinessAreaId(record.businessAreaId || record.businessArea);
  const totalAmount = parseAmount(record.totalAmount);
  const paymentBreakdown = Array.isArray(record.paymentBreakdown)
    ? record.paymentBreakdown
        .map((entry) => {
          const paymentMethod = normalizeText(entry?.paymentMethod || entry?.label);
          const amount = parseAmount(entry?.amount);

          if (!paymentMethod || amount <= 0) {
            return null;
          }

          return {
            paymentMethod,
            amount
          };
        })
        .filter(Boolean)
    : [];

  if (!orderDate || totalAmount < 0) {
    return null;
  }

  return {
    ...record,
    id: normalizeText(record.id) || crypto.randomUUID(),
    createdAt: normalizeText(record.createdAt) || new Date().toISOString(),
    updatedAt:
      normalizeText(record.updatedAt || record.closedAt || record.createdAt) || new Date().toISOString(),
    closedAt:
      normalizeText(record.closedAt || record.updatedAt || record.createdAt) || new Date().toISOString(),
    orderDate,
    businessAreaId,
    areaLabel:
      normalizeText(record.areaLabel) ||
      (businessAreaId ? getBusinessAreaShortLabel(businessAreaId) : "All POS Areas"),
    orderCount: Math.max(Number(record.orderCount || 0), 0),
    itemCount: Math.max(Number(record.itemCount || 0), 0),
    totalAmount,
    dailySalesLedgerTotal: parseAmount(record.dailySalesLedgerTotal),
    cashSalesTotal: parseAmount(record.cashSalesTotal),
    paymentBreakdown,
    notes: normalizeText(record.notes),
    closedByUserId: normalizeText(record.closedByUserId),
    closedByName: normalizeText(record.closedByName)
  };
}

function normalizeInventoryItemRecord(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = normalizeText(item.id);
  const name = normalizeText(item.name || item.productName);
  const businessAreaId = normalizeBusinessAreaId(item.businessAreaId || item.businessArea);

  if (!id || !name || !businessAreaId) {
    return null;
  }

  return {
    ...item,
    id,
    createdAt: normalizeText(item.createdAt) || new Date().toISOString(),
    updatedAt: normalizeText(item.updatedAt || item.createdAt) || new Date().toISOString(),
    sku: normalizeText(item.sku),
    barcode: normalizeText(item.barcode || item.upc || item.ean || item.code),
    name,
    businessAreaId,
    category: normalizeText(item.category) || "Uncategorized",
    itemType: normalizeText(item.itemType).toLowerCase() === "service" ? "service" : "stock",
    trackInventory:
      !(
        item.trackInventory === false ||
        item.trackInventory === "false" ||
        item.trackInventory === 0 ||
        item.trackInventory === "0"
      ),
    quantityOnHand: parseAmount(item.quantityOnHand),
    quantityKnown:
      item.quantityKnown === true ||
      item.quantityKnown === "true" ||
      normalizeText(item.quantityKnown).toLowerCase() === "yes",
    minStockLevel: Math.max(Number(item.minStockLevel || item.reorderLevel || 0), 0),
    salesPrice: parseAmount(item.salesPrice || item.unitPrice),
    costPrice: parseAmount(item.costPrice || item.cost),
    active:
      !(
        item.active === false ||
        item.active === "false" ||
        item.active === 0 ||
        item.active === "0"
      ),
    notes: normalizeText(item.notes)
  };
}

function normalizeAuditTrailRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const title = normalizeText(record.title || record.summary || record.event || "Activity saved");

  if (!title) {
    return null;
  }

  return {
    ...record,
    id: normalizeText(record.id) || crypto.randomUUID(),
    timestamp:
      normalizeText(record.timestamp || record.createdAt || record.updatedAt) || new Date().toISOString(),
    moduleKey: normalizeText(record.moduleKey || record.module || "workspace").toLowerCase(),
    moduleLabel: normalizeText(record.moduleLabel || record.module || "Workspace") || "Workspace",
    action: normalizeText(record.action || record.eventType || "update").toLowerCase() || "update",
    title,
    detail: normalizeText(record.detail || record.notes),
    recordId: normalizeText(record.recordId),
    actorId: normalizeText(record.actorId || record.userId),
    actorName: normalizeText(record.actorName || record.userName || "Workspace User") || "Workspace User",
    actorRole: normalizeText(record.actorRole || record.userRole || "local") || "local",
    entryCount: Math.max(Number(record.entryCount || record.count || 1), 1),
    view: normalizeText(record.view || record.moduleView)
  };
}

function buildPosOrderMergeKey(record) {
  return normalizeText(record?.id) || normalizeText(record?.orderNumber);
}

function buildPosCounterClosureMergeKey(record) {
  return (
    normalizeText(record?.id) ||
    [
      normalizeDateInput(record?.orderDate),
      normalizeBusinessAreaId(record?.businessAreaId),
      getRecordTimestamp(record, ["closedAt", "updatedAt", "createdAt"]),
      Number(record?.totalAmount || 0).toFixed(2)
    ].join("|")
  );
}

function buildInventoryItemMergeKey(record) {
  return normalizeText(record?.id);
}

function mergePosSyncInventoryItems(existingRecords, nextRecords) {
  const merged = new Map();

  (Array.isArray(existingRecords) ? existingRecords : []).forEach((record) => {
    const key = buildInventoryItemMergeKey(record);

    if (key) {
      merged.set(key, record);
    }
  });

  (Array.isArray(nextRecords) ? nextRecords : []).forEach((record) => {
    const key = buildInventoryItemMergeKey(record);

    if (!key) {
      return;
    }

    const currentRecord = merged.get(key);

    if (!currentRecord) {
      merged.set(key, record);
      return;
    }

    merged.set(key, {
      ...currentRecord,
      ...record,
      quantityOnHand: parseAmount(currentRecord.quantityOnHand),
      quantityKnown:
        currentRecord.quantityKnown === true ||
        currentRecord.quantityKnown === "true" ||
        record.quantityKnown === true ||
        record.quantityKnown === "true",
      updatedAt:
        getRecordTimestamp(currentRecord, ["updatedAt", "createdAt"]) ||
        getRecordTimestamp(record, ["updatedAt", "createdAt"]) ||
        new Date().toISOString()
    });
  });

  return sortInventoryItemsForWorkspace([...merged.values()]);
}

function buildAuditTrailMergeKey(record) {
  return (
    normalizeText(record?.id) ||
    [
      getRecordTimestamp(record, ["timestamp", "createdAt", "updatedAt"]),
      normalizeText(record?.moduleKey).toLowerCase(),
      normalizeText(record?.action).toLowerCase(),
      normalizeText(record?.recordId),
      normalizeText(record?.title).toLowerCase()
    ].join("|")
  );
}

function buildGeneratedSalesKey(date, businessAreaId, sourceType) {
  return [
    normalizeText(sourceType).toLowerCase(),
    normalizeDateInput(date),
    normalizeBusinessAreaId(businessAreaId)
  ].join("|");
}

function buildPosAreaDateKey(date, businessAreaId) {
  return `${normalizeDateInput(date)}|${normalizeBusinessAreaId(businessAreaId)}`;
}

function isPosGeneratedSaleRecord(record) {
  return (
    normalizeText(record?.sourceType).toLowerCase() === POS_SYNC_SOURCE_TYPE ||
    normalizeText(record?.notes).startsWith(POS_SYNC_NOTE_PREFIX)
  );
}

function buildPosOrderAreaTotals(order) {
  const totals = new Map();

  (Array.isArray(order?.items) ? order.items : []).forEach((item) => {
    const businessAreaId =
      normalizeBusinessAreaId(item?.businessAreaId || order?.businessAreaId) ||
      normalizeBusinessAreaId(order?.businessAreaId);
    const lineTotal = parseAmount(
      item?.totalAmount || parseQuantity(item?.quantity) * parseAmount(item?.unitPrice)
    );

    if (!businessAreaId || lineTotal <= 0) {
      return;
    }

    totals.set(businessAreaId, parseAmount((totals.get(businessAreaId) || 0) + lineTotal));
  });

  return totals;
}

function findMatchingPosOrderRecord(records, candidate) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const targetId = normalizeText(candidate.id);
  const targetOrderNumber = normalizeText(candidate.orderNumber);

  return (
    (Array.isArray(records) ? records : []).find((record) => {
      const recordId = normalizeText(record?.id);
      const recordOrderNumber = normalizeText(record?.orderNumber);

      return (targetId && recordId === targetId) || (targetOrderNumber && recordOrderNumber === targetOrderNumber);
    }) || null
  );
}

function removeMatchingPosOrderRecord(records, candidate) {
  const targetId = normalizeText(candidate?.id);
  const targetOrderNumber = normalizeText(candidate?.orderNumber);

  return (Array.isArray(records) ? records : []).filter((record) => {
    const recordId = normalizeText(record?.id);
    const recordOrderNumber = normalizeText(record?.orderNumber);

    if (targetId && recordId === targetId) {
      return false;
    }

    if (targetOrderNumber && recordOrderNumber === targetOrderNumber) {
      return false;
    }

    return true;
  });
}

function applyInventoryDeltaFromOrder(inventoryItems, order, direction) {
  const multiplier = Number(direction || 0);

  if (!Number.isFinite(multiplier) || multiplier === 0) {
    return sortInventoryItemsForWorkspace(inventoryItems);
  }

  const adjustments = new Map();

  (Array.isArray(order?.items) ? order.items : [])
    .filter((item) => item?.trackInventory)
    .forEach((item) => {
      const productId = normalizeText(item.productId);

      if (!productId) {
        return;
      }

      adjustments.set(productId, parseAmount((adjustments.get(productId) || 0) + item.quantity * multiplier));
    });

  if (adjustments.size === 0) {
    return sortInventoryItemsForWorkspace(inventoryItems);
  }

  return sortInventoryItemsForWorkspace(
    (Array.isArray(inventoryItems) ? inventoryItems : []).map((item) => {
      const itemId = normalizeText(item?.id);

      if (!adjustments.has(itemId) || item?.trackInventory === false) {
        return item;
      }

      return {
        ...item,
        quantityOnHand: parseAmount(Number(item.quantityOnHand || 0) + adjustments.get(itemId)),
        quantityKnown: true,
        updatedAt: new Date().toISOString()
      };
    })
  );
}

function rebuildPosGeneratedSalesRecords(currentSales, posOrders) {
  const preservedSales = (Array.isArray(currentSales) ? currentSales : []).filter(
    (record) => !isPosGeneratedSaleRecord(record)
  );
  const existingGeneratedSales = new Map(
    (Array.isArray(currentSales) ? currentSales : [])
      .filter((record) => isPosGeneratedSaleRecord(record))
      .map((record) => [
        normalizeText(record.linkedGeneratedSalesKey) ||
          buildGeneratedSalesKey(record.date, record.businessAreaId, POS_SYNC_SOURCE_TYPE),
        record
      ])
      .filter(([key]) => key)
  );
  const aggregatedTotals = new Map();

  (Array.isArray(posOrders) ? posOrders : []).forEach((order) => {
    const orderDate = normalizeDateInput(order?.orderDate);

    if (!orderDate) {
      return;
    }

    buildPosOrderAreaTotals(order).forEach((amount, businessAreaId) => {
      const key = buildGeneratedSalesKey(orderDate, businessAreaId, POS_SYNC_SOURCE_TYPE);
      const currentAggregate = aggregatedTotals.get(key) || {
        date: orderDate,
        businessAreaId,
        amount: 0,
        orderCount: 0
      };

      aggregatedTotals.set(key, {
        ...currentAggregate,
        amount: parseAmount(currentAggregate.amount + amount),
        orderCount: currentAggregate.orderCount + 1
      });
    });
  });

  const generatedSales = Array.from(aggregatedTotals.entries())
    .map(([key, aggregate]) => {
      const existing = existingGeneratedSales.get(key);
      const createdAt = normalizeText(existing?.createdAt) || new Date().toISOString();

      return {
        ...existing,
        id: normalizeText(existing?.id) || crypto.randomUUID(),
        createdAt,
        updatedAt: new Date().toISOString(),
        businessAreaId: aggregate.businessAreaId,
        date: aggregate.date,
        amount: parseAmount(aggregate.amount),
        notes: `${POS_SYNC_NOTE_PREFIX} ${aggregate.orderCount} order${
          aggregate.orderCount === 1 ? "" : "s"
        } captured in POS for ${getBusinessAreaShortLabel(aggregate.businessAreaId)}.`,
        sourceType: POS_SYNC_SOURCE_TYPE,
        sourceLabel: "POS Sync",
        linkedGeneratedSalesKey: key,
        linkedPosAreaDateKey: buildPosAreaDateKey(aggregate.date, aggregate.businessAreaId)
      };
    })
    .filter((record) => record.amount > 0);

  return sortSalesForWorkspace([...preservedSales, ...generatedSales]);
}

function buildWorkspacePosSyncResponse(snapshot) {
  const normalized = normalizeWorkspaceSnapshotPayload(snapshot);
  const workspace = getWorkspaceRoot(normalized);

  return {
    schemaVersion: normalized.schemaVersion,
    app: normalized.app,
    exportedAt: normalized.exportedAt,
    settings: normalized.settings,
    workspace: {
      posOrders: Array.isArray(workspace.posOrders) ? workspace.posOrders : [],
      posCounterClosures: Array.isArray(workspace.posCounterClosures) ? workspace.posCounterClosures : [],
      inventoryItems: Array.isArray(workspace.inventoryItems) ? workspace.inventoryItems : [],
      sales: Array.isArray(workspace.sales) ? workspace.sales : [],
      auditTrail: Array.isArray(workspace.auditTrail) ? workspace.auditTrail : []
    }
  };
}

async function writeWorkspacePosSyncStore(payload) {
  const currentSnapshot = await readWorkspaceSnapshotStore();
  const currentWorkspace = getWorkspaceRoot(currentSnapshot);
  const mutation = payload && typeof payload === "object" ? payload : {};
  const operation = normalizeText(mutation.operation).toLowerCase();
  const nextOrder = normalizePosOrderRecord(mutation.order);
  const previousOrder = normalizePosOrderRecord(mutation.previousOrder);
  const counterClosure = normalizePosCounterClosureRecord(mutation.counterClosure);
  const incomingInventoryItems = (Array.isArray(mutation.inventoryItems) ? mutation.inventoryItems : [])
    .map(normalizeInventoryItemRecord)
    .filter(Boolean);
  const incomingAuditTrail = (Array.isArray(mutation.auditTrail) ? mutation.auditTrail : [])
    .map(normalizeAuditTrailRecord)
    .filter(Boolean);
  let nextPosOrders = sortPosOrdersForWorkspace(
    (Array.isArray(currentWorkspace.posOrders) ? currentWorkspace.posOrders : [])
      .map(normalizePosOrderRecord)
      .filter(Boolean)
  );
  let nextPosCounterClosures = sortPosCounterClosuresForWorkspace(
    (Array.isArray(currentWorkspace.posCounterClosures) ? currentWorkspace.posCounterClosures : [])
      .map(normalizePosCounterClosureRecord)
      .filter(Boolean)
  );
  let nextInventoryItems = sortInventoryItemsForWorkspace(
    (Array.isArray(currentWorkspace.inventoryItems) ? currentWorkspace.inventoryItems : [])
      .map(normalizeInventoryItemRecord)
      .filter(Boolean)
  );

  nextInventoryItems = mergePosSyncInventoryItems(nextInventoryItems, incomingInventoryItems);

  if (["save-order", "update-order", "delete-order"].includes(operation)) {
    const matchedPreviousOrder =
      findMatchingPosOrderRecord(nextPosOrders, nextOrder) ||
      findMatchingPosOrderRecord(nextPosOrders, previousOrder);

    if (matchedPreviousOrder) {
      nextInventoryItems = applyInventoryDeltaFromOrder(nextInventoryItems, matchedPreviousOrder, 1);
      nextPosOrders = removeMatchingPosOrderRecord(nextPosOrders, matchedPreviousOrder);
    }

    if (operation !== "delete-order" && nextOrder) {
      nextPosOrders = sortPosOrdersForWorkspace([...nextPosOrders, nextOrder]);
      nextInventoryItems = applyInventoryDeltaFromOrder(nextInventoryItems, nextOrder, -1);
    }
  }

  if (operation === "close-counter" && counterClosure) {
    nextPosCounterClosures = mergeRecordsByKey(
      nextPosCounterClosures,
      [counterClosure],
      buildPosCounterClosureMergeKey,
      sortPosCounterClosuresForWorkspace,
      ["closedAt", "updatedAt", "createdAt"]
    );
  }

  const nextSales = rebuildPosGeneratedSalesRecords(
    Array.isArray(currentWorkspace.sales) ? currentWorkspace.sales : [],
    nextPosOrders
  );
  const nextAuditTrail = mergeRecordsByKey(
    (Array.isArray(currentWorkspace.auditTrail) ? currentWorkspace.auditTrail : [])
      .map(normalizeAuditTrailRecord)
      .filter(Boolean),
    incomingAuditTrail,
    buildAuditTrailMergeKey,
    sortAuditTrailForWorkspace,
    ["timestamp", "updatedAt", "createdAt"]
  ).slice(0, 2500);

  const nextSnapshot = normalizeWorkspaceSnapshotPayload({
    ...currentSnapshot,
    exportedAt: new Date().toISOString(),
    workspace: {
      ...currentWorkspace,
      posOrders: nextPosOrders,
      posCounterClosures: nextPosCounterClosures,
      inventoryItems: nextInventoryItems,
      sales: nextSales,
      auditTrail: nextAuditTrail
    }
  });
  const savedSnapshot = await writeWorkspaceSnapshotStore(nextSnapshot);

  return buildWorkspacePosSyncResponse(savedSnapshot);
}

async function upsertOrderInDatabase(pool, order) {
  const payload = order && typeof order === "object" ? order : {};

  await pool.query(
    `
      INSERT INTO oneroot_orders (
        id,
        order_number,
        customer_phone_normalized,
        payload,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz, $6::timestamptz)
      ON CONFLICT (id) DO UPDATE SET
        order_number = EXCLUDED.order_number,
        customer_phone_normalized = EXCLUDED.customer_phone_normalized,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at
    `,
    [
      normalizeText(payload.id) || crypto.randomUUID(),
      normalizeText(payload.orderNumber).toUpperCase(),
      normalizePhone(payload.customerPhoneNormalized || payload.customerPhone),
      JSON.stringify(payload),
      normalizeText(payload.createdAt) || new Date().toISOString(),
      normalizeText(payload.updatedAt) || normalizeText(payload.createdAt) || new Date().toISOString()
    ]
  );
}

async function seedOrdersDatabaseFromFile(pool) {
  const fallbackOrders = mergeOrderCollections(
    readOrdersFile(),
    readOrdersFromWorkspaceSnapshotFile()
  );

  if (fallbackOrders.length === 0) {
    return [];
  }

  await Promise.all(fallbackOrders.map((order) => upsertOrderInDatabase(pool, order)));
  return fallbackOrders;
}

async function readOrdersStore() {
  return runWithDatabaseFallback(
    "Orders database read",
    async (pool) => {
      const result = await pool.query(`
        SELECT payload
        FROM oneroot_orders
        ORDER BY updated_at DESC, created_at DESC
      `);

      if (result.rows.length === 0) {
        return seedOrdersDatabaseFromFile(pool);
      }

      const orders = sortOrdersForDisplay(result.rows.map((row) => row.payload).filter(Boolean));
      writeOrdersFile(orders);
      return orders;
    },
    () => mergeOrderCollections(readOrdersFile(), readOrdersFromWorkspaceSnapshotFile())
  );
}

async function syncOrderIntoWorkspaceSnapshotStore(order) {
  const normalizedOrder = order && typeof order === "object" ? order : null;

  if (!normalizedOrder) {
    return null;
  }

  const currentSnapshot = await readWorkspaceSnapshotStore();
  const workspaceRoot = getWorkspaceRoot(currentSnapshot);
  const nextSnapshot = normalizeWorkspaceSnapshotPayload({
    ...currentSnapshot,
    exportedAt: new Date().toISOString(),
    workspace: {
      ...workspaceRoot,
      onlineOrders: mergeOrderCollections(
        readOrdersFromWorkspaceSnapshotPayload(currentSnapshot),
        [normalizedOrder]
      )
    }
  });

  return writeWorkspaceSnapshotStore(nextSnapshot);
}

async function writeOrderStore(nextOrder) {
  const normalizedOrder = nextOrder && typeof nextOrder === "object" ? nextOrder : {};
  const savedOrder = await runWithDatabaseFallback(
    "Orders database write",
    async (pool) => {
      await upsertOrderInDatabase(pool, normalizedOrder);
      const orders = await readOrdersStore();
      writeOrdersFile(orders);
      return normalizedOrder;
    },
    () => {
      const nextOrders = mergeOrderIntoList(readOrdersFile(), normalizedOrder);
      writeOrdersFile(nextOrders);
      return normalizedOrder;
    }
  );

  try {
    await syncOrderIntoWorkspaceSnapshotStore(savedOrder);
  } catch (error) {
    console.error("[oneroot-storage] Order snapshot mirror write failed.", error);
  }

  return savedOrder;
}

async function refreshWorkspaceSnapshotMirrorFromDatabase() {
  return runWithDatabaseFallback(
    "Workspace database read",
    async (pool) => {
      const result = await pool.query(
        `
          SELECT payload
          FROM oneroot_workspace_snapshots
          WHERE workspace_key = $1
          LIMIT 1
        `,
        [WORKSPACE_SNAPSHOT_PRIMARY_KEY]
      );

      if (result.rows.length === 0) {
        const fallbackSnapshot = readWorkspaceSnapshotFile();
        const normalizedFallback = normalizeWorkspaceSnapshotPayload(fallbackSnapshot);

        await pool.query(
          `
            INSERT INTO oneroot_workspace_snapshots (workspace_key, payload, updated_at)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (workspace_key) DO UPDATE SET
              payload = EXCLUDED.payload,
              updated_at = NOW()
          `,
          [WORKSPACE_SNAPSHOT_PRIMARY_KEY, JSON.stringify(normalizedFallback)]
        );

        return writeWorkspaceSnapshotFile(normalizedFallback);
      }

      const snapshot = normalizeWorkspaceSnapshotPayload(result.rows[0].payload);
      return writeWorkspaceSnapshotFile(snapshot);
    },
    () => getWorkspaceSnapshotFallback()
  );
}

async function findTrackedOrder(orderNumber, phone) {
  const normalizedNumber = normalizeText(orderNumber).toUpperCase();
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedNumber || !normalizedPhone) {
    return null;
  }

  return runWithDatabaseFallback(
    "Tracked order lookup",
    async (pool) => {
      const result = await pool.query(
        `
          SELECT payload
          FROM oneroot_orders
          WHERE order_number = $1
            AND customer_phone_normalized = $2
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        [normalizedNumber, normalizedPhone]
      );

      if (result.rows.length === 0) {
        const seededOrders = await seedOrdersDatabaseFromFile(pool);
        return (
          seededOrders.find(
            (order) =>
              normalizeText(order.orderNumber).toUpperCase() === normalizedNumber &&
              normalizePhone(order.customerPhoneNormalized || order.customerPhone) === normalizedPhone
          ) || null
        );
      }

      return result.rows[0].payload || null;
    },
    () =>
      mergeOrderCollections(readOrdersFile(), readOrdersFromWorkspaceSnapshotFile()).find(
        (order) =>
          normalizeText(order.orderNumber).toUpperCase() === normalizedNumber &&
          normalizePhone(order.customerPhoneNormalized || order.customerPhone) === normalizedPhone
      ) || null
  );
}

async function readWorkspaceSnapshotStore() {
  return refreshWorkspaceSnapshotMirrorFromDatabase();
}

async function writeWorkspaceSnapshotStore(payload) {
  const normalized = normalizeWorkspaceSnapshotPayload(
    preserveWorkspaceOrderHistory(payload, getWorkspaceSnapshotFallback())
  );
  const savedSnapshot = await runWithDatabaseFallback(
    "Workspace database write",
    async (pool) => {
      await pool.query(
        `
          INSERT INTO oneroot_workspace_snapshots (workspace_key, payload, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (workspace_key) DO UPDATE SET
            payload = EXCLUDED.payload,
            updated_at = NOW()
        `,
        [WORKSPACE_SNAPSHOT_PRIMARY_KEY, JSON.stringify(normalized)]
      );

      return writeWorkspaceSnapshotFile(normalized);
    },
    () => writeWorkspaceSnapshotFile(normalized)
  );

  broadcastWorkspaceSnapshotUpdate(savedSnapshot);
  return savedSnapshot;
}

function createOrderNumber() {
  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ORO-${dateStamp}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function getMimeType(filePath) {
  return WEBSITE_STATIC_MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(body);
}

function sendText(
  response,
  statusCode,
  body,
  contentType = "text/plain; charset=utf-8",
  extraHeaders = {}
) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": contentType,
    ...extraHeaders
  });
  response.end(body);
}

function sendUnauthorized(response) {
  response.writeHead(401, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
    "WWW-Authenticate": 'Basic realm="OneRoot Admin", charset="UTF-8"'
  });
  response.end("Authentication required.");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON payload."));
      }
    });

    request.on("error", reject);
  });
}

function parseBasicAuth(request) {
  const header = request.headers.authorization || "";

  if (!header.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

function buildPasswordDigest(password) {
  return `sha256:${crypto.createHash("sha256").update(String(password || "")).digest("hex")}`;
}

function buildWorkspaceBootstrapProfile() {
  const username = normalizeText(ADMIN_USER).toLowerCase();
  const password = String(ADMIN_PASSWORD || "");

  if (!username || !password) {
    return null;
  }

  return {
    id: "workspace-owner",
    fullName: username === "phil" ? "Philip Boakye" : "Workspace Owner",
    username,
    role: "owner",
    active: true,
    loginEnabled: true,
    passwordHash: buildPasswordDigest(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: "Bootstrap online workspace owner profile"
  };
}

async function resetWorkspaceAccessToBootstrapOwner() {
  const currentSnapshot = await readWorkspaceSnapshotStore();
  const workspaceRoot = getWorkspaceRoot(currentSnapshot);
  const bootstrapProfile = buildWorkspaceBootstrapProfile();
  const exportedAt = new Date().toISOString();
  const nextSnapshot = normalizeWorkspaceSnapshotPayload({
    ...currentSnapshot,
    exportedAt,
    settings: {
      ...(currentSnapshot?.settings && typeof currentSnapshot.settings === "object"
        ? currentSnapshot.settings
        : {}),
      activeUserId: normalizeText(bootstrapProfile?.id)
    },
    workspace: {
      ...workspaceRoot,
      userProfiles: bootstrapProfile ? [bootstrapProfile] : []
    }
  });

  return writeWorkspaceSnapshotStore(nextSnapshot);
}

function parseCookies(request) {
  const header = String(request.headers.cookie || "");

  return header.split(";").reduce((cookies, item) => {
    const [rawName, ...rawValue] = item.split("=");
    const name = normalizeText(rawName);

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

function getWorkspaceSessionTokenFromRequest(request) {
  const headerToken = normalizeText(request.headers["x-workspace-session"]);

  if (headerToken) {
    return headerToken;
  }

  const authorizationHeader = normalizeText(request.headers.authorization);

  if (authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return normalizeText(authorizationHeader.slice(7));
  }

  try {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const queryToken = normalizeText(requestUrl.searchParams.get("session_token"));

    if (queryToken) {
      return queryToken;
    }
  } catch (error) {
    return "";
  }

  const cookieToken = parseCookies(request)[WORKSPACE_SESSION_COOKIE];

  if (cookieToken) {
    return cookieToken;
  }

  return "";
}

function signWorkspaceSessionToken(encodedPayload) {
  return crypto.createHmac("sha256", WORKSPACE_SESSION_SECRET).update(encodedPayload).digest("base64url");
}

function decodeWorkspaceSessionPayload(encodedPayload) {
  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch (error) {
    return null;
  }
}

function buildWorkspaceSessionCookie(request, token, maxAgeSeconds = Math.floor(WORKSPACE_SESSION_TTL_MS / 1000)) {
  const cookieParts = [
    `${WORKSPACE_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  const forwardedProto = normalizeText(request.headers["x-forwarded-proto"]).toLowerCase();

  if (forwardedProto === "https") {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
}

function createWorkspaceSession(profile) {
  const payload = {
    userId: normalizeText(profile.id || profile.username),
    username: normalizeText(profile.username).toLowerCase(),
    role: normalizeText(profile.role).toLowerCase(),
    fullName: normalizeText(profile.fullName),
    exp: Date.now() + WORKSPACE_SESSION_TTL_MS
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signWorkspaceSessionToken(encodedPayload)}`;
}

function clearWorkspaceSession(request) {
  return Boolean(getWorkspaceSessionTokenFromRequest(request));
}

function getWorkspaceSession(request) {
  const token = getWorkspaceSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signWorkspaceSessionToken(encodedPayload);

  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature) ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  const payload = decodeWorkspaceSessionPayload(encodedPayload);

  if (!payload || Number(payload.exp || 0) <= Date.now()) {
    return null;
  }

  return {
    userId: normalizeText(payload.userId || payload.username),
    username: normalizeText(payload.username).toLowerCase(),
    role: normalizeText(payload.role).toLowerCase(),
    fullName: normalizeText(payload.fullName),
    expiresAt: Number(payload.exp || 0)
  };
}

function sanitizeWorkspaceAuthProfile(record) {
  const id = normalizeText(record?.id || record?.userId || record?.profileId || record?.username);
  const fullName = normalizeText(record?.fullName || record?.name);
  const username = normalizeText(record?.username || record?.user).toLowerCase();
  const role = normalizeText(record?.role).toLowerCase();
  const passwordHash = normalizeText(
    record?.passwordHash || record?.passwordDigest || record?.passwordToken || record?.password_signature
  );
  const active = Boolean(
    record?.active === true ||
      record?.active === "true" ||
      record?.active === 1 ||
      record?.active === "1" ||
      record?.active === undefined
  );
  const loginEnabled = Boolean(
    record?.loginEnabled === true ||
      record?.loginEnabled === "true" ||
      record?.loginEnabled === 1 ||
      record?.loginEnabled === "1" ||
      passwordHash
  );

  if (!id || !fullName || !username || !role || !passwordHash || !active || !loginEnabled) {
    return null;
  }

  return {
    id,
    fullName,
    username,
    role,
    passwordHash
  };
}

function sanitizeWorkspaceAccessProfile(record) {
  const id = normalizeText(record?.id || record?.userId || record?.profileId || record?.username);
  const fullName = normalizeText(record?.fullName || record?.name);
  const username = normalizeText(record?.username || record?.user).toLowerCase();
  const role = normalizeText(record?.role).toLowerCase();
  const active = Boolean(
    record?.active === true ||
      record?.active === "true" ||
      record?.active === 1 ||
      record?.active === "1" ||
      record?.active === undefined
  );
  const loginEnabled = Boolean(
    record?.loginEnabled === true ||
      record?.loginEnabled === "true" ||
      record?.loginEnabled === 1 ||
      record?.loginEnabled === "1" ||
      normalizeText(record?.passwordHash)
  );

  if (!id || !fullName || !username || !role || !active || !loginEnabled) {
    return null;
  }

  return {
    id,
    fullName,
    username,
    role,
    active: true,
    loginEnabled: true
  };
}

function extractWorkspaceAuthProfiles(payload) {
  const workspaceRoot = getWorkspaceRoot(payload);
  return Array.isArray(workspaceRoot?.userProfiles)
    ? workspaceRoot.userProfiles.map(sanitizeWorkspaceAuthProfile).filter(Boolean)
    : [];
}

function extractWorkspaceAccessProfiles(payload) {
  const workspaceRoot = getWorkspaceRoot(payload);
  return Array.isArray(workspaceRoot?.userProfiles)
    ? workspaceRoot.userProfiles.map(sanitizeWorkspaceAccessProfile).filter(Boolean)
    : [];
}

function setWorkspaceAuthProfileCache(payload) {
  const profiles = extractWorkspaceAuthProfiles(payload);
  workspaceAuthProfileCache.profiles = profiles;
  return profiles;
}

function loadWorkspaceAuthProfilesFromFiles() {
  for (const filePath of WORKSPACE_AUTH_FILES) {
    const parsed = readJsonFile(filePath, null);
    const profiles = extractWorkspaceAuthProfiles(parsed);

    if (profiles.length > 0) {
      workspaceAuthProfileCache.profiles = profiles;
      return profiles;
    }
  }

  workspaceAuthProfileCache.profiles = [];
  return [];
}

async function refreshWorkspaceAuthProfileCache() {
  if (hasDatabaseConfig()) {
    const snapshot = await refreshWorkspaceSnapshotMirrorFromDatabase();
    const profiles = setWorkspaceAuthProfileCache(snapshot);

    if (profiles.length > 0) {
      return profiles;
    }
  }

  const fileProfiles = loadWorkspaceAuthProfilesFromFiles();

  if (fileProfiles.length > 0) {
    return fileProfiles;
  }

  workspaceAuthProfileCache.profiles = [];
  return [];
}

function loadWorkspaceAuthProfiles() {
  if (Array.isArray(workspaceAuthProfileCache.profiles) && workspaceAuthProfileCache.profiles.length > 0) {
    return workspaceAuthProfileCache.profiles;
  }

  return loadWorkspaceAuthProfilesFromFiles();
}

function findWorkspaceProfileByCredentials(auth, options = {}) {
  const username = normalizeText(auth?.username).toLowerCase();
  const password = String(auth?.password || "");
  const allowedRoles = options.allowedRoles instanceof Set ? options.allowedRoles : null;

  if (!username || !password) {
    return null;
  }

  return (
    loadWorkspaceAuthProfiles().find(
      (item) =>
        item.username === username &&
        (!allowedRoles || allowedRoles.has(item.role)) &&
        item.passwordHash === buildPasswordDigest(password)
    ) || null
  );
}

function isAuthorizedWorkspaceOrderUser(auth) {
  return Boolean(
    findWorkspaceProfileByCredentials(auth, {
      allowedRoles: ONLINE_ORDER_ALLOWED_ROLES
    })
  );
}

function isAuthorizedWorkspaceOrderSession(request) {
  const session = getWorkspaceSession(request);

  return Boolean(
    session &&
      ONLINE_ORDER_ALLOWED_ROLES.has(session.role) &&
      loadWorkspaceAuthProfiles().some(
        (item) => item.username === session.username && item.role === session.role
      )
  );
}

function isAuthorizedWorkspaceSession(request) {
  const session = getWorkspaceSession(request);

  return Boolean(
    session &&
      loadWorkspaceAuthProfiles().some(
        (item) => item.username === session.username && item.role === session.role
      )
  );
}

function isAuthorizedWorkspaceRequest(request) {
  if (isAuthorizedWorkspaceSession(request)) {
    return true;
  }

  const auth = parseBasicAuth(request);

  if (auth && findWorkspaceProfileByCredentials(auth)) {
    return true;
  }

  return loadWorkspaceAuthProfiles().length === 0;
}

function isAuthorizedAdminRequest(request) {
  if (isAuthorizedWorkspaceOrderSession(request)) {
    return true;
  }

  const auth = parseBasicAuth(request);

  if (auth && ADMIN_AUTH_ENABLED && auth.username === ADMIN_USER && auth.password === ADMIN_PASSWORD) {
    return true;
  }

  if (auth && isAuthorizedWorkspaceOrderUser(auth)) {
    return true;
  }

  const hasWorkspaceProfiles = loadWorkspaceAuthProfiles().length > 0;
  return !ADMIN_AUTH_ENABLED && !hasWorkspaceProfiles;
}

function assertSafeChildPath(baseDir, targetPath) {
  const resolved = path.resolve(baseDir, targetPath);
  const normalizedBase = path.resolve(baseDir);

  if (!resolved.startsWith(normalizedBase)) {
    return null;
  }

  return resolved;
}

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendText(response, 404, "Not found.");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": buffer.length,
      "Content-Type": getMimeType(filePath)
    });
    response.end(buffer);
  });
}

function loadProductCatalog() {
  const source = fs.readFileSync(PRODUCT_CATALOG_FILE, "utf8");
  const versionMatch = source.match(/window\.ONE_ROOT_PRODUCT_CATALOG_VERSION = "([^"]+)"/);
  const catalogMatch = source.match(/window\.ONE_ROOT_PRODUCT_CATALOG = (\[[\s\S]*\]);\s*$/);

  if (!catalogMatch) {
    throw new Error("Unable to parse product catalog.");
  }

  return {
    version: versionMatch ? versionMatch[1] : "unknown",
    items: JSON.parse(catalogMatch[1])
  };
}

function loadServiceOffers() {
  const parsed = readJsonFile(SERVICE_OFFERS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

function buildCatalogPayload() {
  const { version, items } = loadProductCatalog();
  const serviceOffers = loadServiceOffers();
  const mergedItems = [...items, ...serviceOffers]
    .filter((item) => item && item.businessAreaId && item.name)
    .map((item) => ({
      id: normalizeText(item.id) || crypto.randomUUID(),
      sku: normalizeText(item.sku),
      name: normalizeText(item.name),
      businessAreaId: normalizeText(item.businessAreaId),
      category: normalizeText(item.category) || "General",
      sourceCategory: normalizeText(item.sourceCategory),
      salesPrice: Number(item.salesPrice || 0),
      itemType: normalizeText(item.itemType).toLowerCase() === "service" ? "service" : "stock",
      notes: normalizeText(item.notes),
      trackInventory: Boolean(item.trackInventory)
    }))
    .sort((left, right) => {
      const areaDifference = (BUSINESS_AREA_MAP.get(left.businessAreaId)?.shortLabel || left.businessAreaId).localeCompare(
        BUSINESS_AREA_MAP.get(right.businessAreaId)?.shortLabel || right.businessAreaId
      );

      if (areaDifference !== 0) {
        return areaDifference;
      }

      const categoryDifference = left.category.localeCompare(right.category);

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return left.name.localeCompare(right.name);
    });

  const areaCounts = BUSINESS_AREAS.filter((area) => area.orderable).map((area) => ({
    ...area,
    itemCount: mergedItems.filter((item) => item.businessAreaId === area.id).length
  }));

  return {
    version,
    businessAreas: areaCounts,
    paymentMethods: PUBLIC_PAYMENT_METHODS,
    items: mergedItems
  };
}

function buildPublicConfig() {
  return {
    brandName: "OneRoot Essentials",
    domain: normalizeText(process.env.ONEROOT_PUBLIC_DOMAIN) || "OneRoot.shop",
    supportPhone: normalizeText(process.env.ONEROOT_SUPPORT_PHONE) || "0547038092",
    whatsappNumber: normalizeText(process.env.ONEROOT_WHATSAPP_NUMBER) || "233547038092",
    supportEmail: normalizeText(process.env.ONEROOT_SUPPORT_EMAIL) || "orders@oneroot.shop",
    pickupNote:
      normalizeText(process.env.ONEROOT_PICKUP_NOTE) ||
      "Pickup and delivery confirmation are handled by OneRoot after the order is received.",
    operationsUrl: "/operations/",
    paymentMethods: PUBLIC_PAYMENT_METHODS
  };
}

function sanitizePublicOrderItem(item) {
  const name = normalizeText(item?.name);
  const businessAreaId = normalizeText(item?.businessAreaId);
  const quantity = Math.max(Number(item?.quantity || 0), 0);
  const unitPrice = Number(item?.unitPrice || item?.salesPrice || 0);

  if (!name || !businessAreaId || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;

  return {
    id: normalizeText(item?.id || item?.sku || item?.name),
    sku: normalizeText(item?.sku),
    name,
    businessAreaId,
    businessAreaLabel: BUSINESS_AREA_MAP.get(businessAreaId)?.label || businessAreaId,
    category: normalizeText(item?.category) || "General",
    itemType: normalizeText(item?.itemType).toLowerCase() === "service" ? "service" : "stock",
    quantity,
    unitPrice: Number(safeUnitPrice.toFixed(2)),
    lineTotal: Number((safeUnitPrice * quantity).toFixed(2)),
    notes: normalizeText(item?.notes)
  };
}

function createStoredOrder(payload, request) {
  const items = Array.isArray(payload.items)
    ? payload.items.map(sanitizePublicOrderItem).filter(Boolean)
    : [];
  const customerName = normalizeText(payload.customerName);
  const customerPhone = normalizePhone(payload.customerPhone);
  const customerEmail = normalizeText(payload.customerEmail);
  const deliveryAddress = normalizeText(payload.deliveryAddress);
  const deliveryMode = normalizeText(payload.deliveryMode) || "Delivery";
  const paymentMethod = normalizeText(payload.paymentMethod) || "Cash On Delivery";
  const preferredDate = normalizeText(payload.preferredDate);
  const preferredTime = normalizeText(payload.preferredTime);
  const notes = normalizeText(payload.notes);

  if (!customerName || !customerPhone || items.length === 0) {
    return {
      errors: ["Customer name, customer phone, and at least one order item are required."]
    };
  }

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const includesQuoteItems = items.some((item) => item.unitPrice <= 0);
  const totalAmount = subtotal;
  const now = new Date().toISOString();

  return {
    order: {
      id: crypto.randomUUID(),
      orderNumber: createOrderNumber(),
      status: "new",
      paymentStatus: paymentMethod === "Cash On Delivery" || paymentMethod === "Pay On Pickup" ? "pending" : "awaiting-proof",
      paidAt: "",
      createdAt: now,
      updatedAt: now,
      source: "website",
      customerName,
      customerPhone,
      customerPhoneNormalized: customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryMode,
      paymentMethod,
      preferredDate,
      preferredTime,
      notes,
      items,
      subtotal,
      totalAmount,
      includesQuoteItems,
      statusHistory: [
        {
          status: "new",
          at: now,
          note: "Order created on the public website."
        }
      ],
      latestUserAgent: normalizeText(request.headers["user-agent"]),
      latestForwardedFor: normalizeText(request.headers["x-forwarded-for"] || request.socket.remoteAddress)
    }
  };
}

function updateStoredOrder(existingOrder, payload) {
  const nextStatus = normalizeText(payload.status).toLowerCase();
  const nextPaymentStatus = normalizeText(payload.paymentStatus).toLowerCase();
  const internalNote = normalizeText(payload.internalNote || payload.note);
  const allowedPaymentStatuses = new Set(["pending", "partial", "paid", "awaiting-proof", "cancelled"]);
  const now = new Date().toISOString();

  if (nextStatus && !ORDER_STATUSES.includes(nextStatus)) {
    return { errors: ["That order status is not supported."] };
  }

  if (nextPaymentStatus && !allowedPaymentStatuses.has(nextPaymentStatus)) {
    return { errors: ["That payment status is not supported."] };
  }

  const nextOrder = {
    ...existingOrder,
    updatedAt: now
  };

  if (nextStatus && nextStatus !== existingOrder.status) {
    nextOrder.status = nextStatus;
    nextOrder.statusHistory = [
      ...(Array.isArray(existingOrder.statusHistory) ? existingOrder.statusHistory : []),
      {
        status: nextStatus,
        at: now,
        note: internalNote || `Status moved to ${nextStatus}.`
      }
    ];
  }

  if (nextPaymentStatus) {
    nextOrder.paymentStatus = nextPaymentStatus;

    if (nextPaymentStatus === "paid") {
      nextOrder.paidAt = normalizeText(existingOrder.paidAt) || now;
    } else if (nextPaymentStatus !== normalizeText(existingOrder.paymentStatus).toLowerCase()) {
      nextOrder.paidAt = "";
    }
  }

  if (internalNote) {
    nextOrder.internalNote = internalNote;
  }

  return { order: nextOrder };
}

function buildPublicOrderView(order) {
  if (!order) {
    return null;
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName: order.customerName,
    deliveryMode: order.deliveryMode,
    preferredDate: order.preferredDate,
    preferredTime: order.preferredTime,
    totalAmount: order.totalAmount,
    includesQuoteItems: order.includesQuoteItems,
    items: order.items,
    statusHistory: order.statusHistory || []
  };
}

function serveWebsiteRoute(pathname, response) {
  if (pathname === "/" || pathname === "/index.html") {
    serveFile(response, path.join(WEBSITE_DIR, "index.html"));
    return true;
  }

  if (pathname === "/track-order" || pathname === "/track-order.html") {
    serveFile(response, path.join(WEBSITE_DIR, "track-order.html"));
    return true;
  }

  if (pathname.startsWith("/website/")) {
    const relativePath = pathname.replace(/^\/website\//, "");
    const safePath = assertSafeChildPath(WEBSITE_DIR, relativePath);

    if (!safePath || !fs.existsSync(safePath)) {
      sendText(response, 404, "Website asset not found.");
      return true;
    }

    serveFile(response, safePath);
    return true;
  }

  return false;
}

function serveOperationsRoute(pathname, request, response) {
  if (!pathname.startsWith("/operations")) {
    return false;
  }

  if (pathname === "/operations") {
    response.writeHead(302, {
      "Cache-Control": "no-store",
      Location: "/operations/"
    });
    response.end();
    return true;
  }

  const relativePath = pathname.replace(/^\/operations\/?/, "");

  if (!relativePath) {
    serveFile(response, path.join(ROOT_DIR, "index.html"));
    return true;
  }

  if (
    relativePath.startsWith("assets/") ||
    relativePath.startsWith("outputs/") ||
    relativePath.startsWith("vendor/") ||
    relativePath.startsWith("data/public/")
  ) {
    const safePath = assertSafeChildPath(ROOT_DIR, relativePath);

    if (!safePath || !fs.existsSync(safePath)) {
      sendText(response, 404, "Operations asset not found.");
      return true;
    }

    serveFile(response, safePath);
    return true;
  }

  if (!OPERATIONS_ALLOWED_ROOT_FILES.has(relativePath)) {
    sendText(response, 404, "Operations asset not found.");
    return true;
  }

  const safePath = assertSafeChildPath(ROOT_DIR, relativePath);

  if (!safePath || !fs.existsSync(safePath)) {
    sendText(response, 404, "Operations asset not found.");
    return true;
  }

  serveFile(response, safePath);
  return true;
}

async function handleApiRoute(request, response, pathname, url) {
  if (pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "OneRoot Shop and Operations Server",
      timestamp: new Date().toISOString(),
      storageMode: hasDatabaseConfig() ? "database-with-file-fallback" : "file"
    });
    return true;
  }

  if (pathname === "/api/public-config") {
    sendJson(response, 200, buildPublicConfig());
    return true;
  }

  if (pathname === "/api/catalog") {
    sendJson(response, 200, buildCatalogPayload());
    return true;
  }

  if (pathname === "/api/orders" && request.method === "POST") {
    try {
      const body = await readRequestBody(request);
      const { order, errors } = createStoredOrder(body, request);

      if (errors && errors.length > 0) {
        sendJson(response, 400, { ok: false, errors });
        return true;
      }

      await writeOrderStore(order);
      sendJson(response, 201, {
        ok: true,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        includesQuoteItems: order.includesQuoteItems
      });
      return true;
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        errors: [error.message || "Unable to save the order."]
      });
      return true;
    }
  }

  if (pathname === "/api/orders/track" && request.method === "GET") {
    const order = await findTrackedOrder(
      url.searchParams.get("orderNumber"),
      url.searchParams.get("phone")
    );

    if (!order) {
      sendJson(response, 404, {
        ok: false,
        error: "No order matches that order number and phone combination."
      });
      return true;
    }

    sendJson(response, 200, {
      ok: true,
      order: buildPublicOrderView(order)
    });
    return true;
  }

  if (pathname === "/api/workspace-session") {
    if (request.method === "GET") {
      await refreshWorkspaceAuthProfileCache();
      const session = getWorkspaceSession(request);
      const auth = parseBasicAuth(request);
      const credentialProfile = auth ? findWorkspaceProfileByCredentials(auth) : null;
      let refreshedToken = "";
      const validSession =
        session &&
        loadWorkspaceAuthProfiles().some(
          (item) => item.username === session.username && item.role === session.role
        )
          ? session
          : credentialProfile
            ? {
                userId: normalizeText(credentialProfile.id || credentialProfile.username),
                username: credentialProfile.username,
                fullName: credentialProfile.fullName,
                role: credentialProfile.role
              }
          : null;

      if (!session && credentialProfile) {
        refreshedToken = createWorkspaceSession(credentialProfile);
      }

      sendJson(response, 200, {
        ok: true,
        authenticated: Boolean(validSession),
        loginRequired: loadWorkspaceAuthProfiles().length > 0,
        token: refreshedToken || undefined,
        session: validSession
          ? {
              userId: normalizeText(validSession.userId),
              username: validSession.username,
              fullName: validSession.fullName,
              role: validSession.role
            }
          : null
      }, refreshedToken ? { "Set-Cookie": buildWorkspaceSessionCookie(request, refreshedToken) } : {});
      return true;
    }

    if (request.method === "POST") {
      try {
        await refreshWorkspaceAuthProfileCache();
        const body = await readRequestBody(request);
        const profile = findWorkspaceProfileByCredentials(body);

        if (!profile) {
          sendJson(response, 401, {
            ok: false,
            error: "The username or password is not correct."
          });
          return true;
        }

        const token = createWorkspaceSession(profile);
        sendJson(
          response,
          200,
          {
            ok: true,
            token,
            userId: normalizeText(profile.id || profile.username),
            username: profile.username,
            fullName: profile.fullName,
            role: profile.role
          },
          {
            "Set-Cookie": buildWorkspaceSessionCookie(request, token)
          }
        );
        return true;
      } catch (error) {
        sendJson(response, 400, {
          ok: false,
          errors: [error.message || "Unable to start the workspace session."]
        });
        return true;
      }
    }

    if (request.method === "DELETE") {
      clearWorkspaceSession(request);
      sendJson(
        response,
        200,
        {
          ok: true
        },
        {
          "Set-Cookie": buildWorkspaceSessionCookie(request, "", 0)
        }
      );
      return true;
    }
  }

  if (pathname === "/api/workspace-access" && request.method === "GET") {
    try {
      const snapshot = await readWorkspaceSnapshotStore();
      const profiles = extractWorkspaceAccessProfiles(snapshot);

      sendJson(response, 200, {
        ok: true,
        loginRequired: profiles.length > 0,
        exportedAt: normalizeText(snapshot.exportedAt),
        recordCount: countWorkspaceBusinessRecords(snapshot),
        profiles
      });
      return true;
    } catch (error) {
      sendJson(response, 200, {
        ok: true,
        loginRequired: false,
        exportedAt: "",
        recordCount: 0,
        profiles: []
      });
      return true;
    }
  }

  if (pathname === "/api/workspace-events" && request.method === "GET") {
    if (!isAuthorizedWorkspaceRequest(request)) {
      sendJson(response, 401, {
        ok: false,
        error: "Workspace sign-in is required."
      });
      return true;
    }

    const keepAliveTimer = setInterval(() => {
      try {
        response.write(": keep-alive\n\n");
      } catch (error) {
        console.error("[oneroot-storage] Workspace keep-alive failed.", error);
      }
    }, 25000);

    const client = {
      response,
      keepAliveTimer
    };

    const cleanup = () => {
      WORKSPACE_EVENT_CLIENTS.delete(client);
      clearInterval(keepAliveTimer);
    };

    request.on("close", cleanup);
    response.on("close", cleanup);

    response.writeHead(200, {
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no"
    });
    response.write(": connected\n\n");
    WORKSPACE_EVENT_CLIENTS.add(client);

    try {
      response.write(
        `event: workspace\ndata: ${JSON.stringify(
          createWorkspaceEventPayload(await readWorkspaceSnapshotStore())
        )}\n\n`
      );
    } catch (error) {
      cleanup();
      console.error("[oneroot-storage] Workspace event stream init failed.", error);
    }

    return true;
  }

  if (pathname === "/api/workspace") {
    if (!isAuthorizedWorkspaceRequest(request)) {
      sendJson(response, 401, {
        ok: false,
        error: "Workspace sign-in is required."
      });
      return true;
    }

    if (request.method === "GET") {
      sendJson(response, 200, await readWorkspaceSnapshotStore());
      return true;
    }

    if (request.method === "PUT") {
      try {
        const body = await readRequestBody(request);
        const snapshot = await writeWorkspaceSnapshotStore(body);
        sendJson(response, 200, snapshot);
        return true;
      } catch (error) {
        sendJson(response, 400, {
          ok: false,
          errors: [error.message || "Unable to save the shared workspace snapshot."]
        });
        return true;
      }
    }
  }

  if (pathname === "/api/workspace-pos-sync" && request.method === "POST") {
    if (!isAuthorizedWorkspaceRequest(request)) {
      sendJson(response, 401, {
        ok: false,
        error: "Workspace sign-in is required."
      });
      return true;
    }

    try {
      const body = await readRequestBody(request);
      const snapshot = await writeWorkspacePosSyncStore(body);
      sendJson(response, 200, snapshot);
      return true;
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        errors: [error.message || "Unable to save the POS transaction online."]
      });
      return true;
    }
  }

  if (pathname === "/api/admin/orders") {
    if (!isAuthorizedAdminRequest(request)) {
      sendUnauthorized(response);
      return true;
    }

    if (request.method === "GET") {
      const orders = (await readOrdersStore()).sort((left, right) =>
        String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))
      );
      sendJson(response, 200, {
        ok: true,
        orders,
        statuses: ORDER_STATUSES
      });
      return true;
    }
  }

  if (pathname.startsWith("/api/admin/orders/")) {
    if (!isAuthorizedAdminRequest(request)) {
      sendUnauthorized(response);
      return true;
    }

    const orderId = pathname.replace("/api/admin/orders/", "");

    if (request.method === "PATCH") {
      try {
        const body = await readRequestBody(request);
        const orders = await readOrdersStore();
        const existingOrder = orders.find((item) => item.id === orderId || item.orderNumber === orderId);

        if (!existingOrder) {
          sendJson(response, 404, {
            ok: false,
            errors: ["That order could not be found."]
          });
          return true;
        }

        const { order, errors } = updateStoredOrder(existingOrder, body);

        if (errors && errors.length > 0) {
          sendJson(response, 400, { ok: false, errors });
          return true;
        }

        await writeOrderStore(order);
        sendJson(response, 200, { ok: true, order });
        return true;
      } catch (error) {
        sendJson(response, 400, {
          ok: false,
          errors: [error.message || "Unable to update the order."]
        });
        return true;
      }
    }
  }

  if (pathname === "/api/admin/workspace-access-reset" && request.method === "POST") {
    if (!isAuthorizedAdminRequest(request)) {
      sendUnauthorized(response);
      return true;
    }

    try {
      const snapshot = await resetWorkspaceAccessToBootstrapOwner();
      sendJson(response, 200, {
        ok: true,
        mode: "bootstrap-owner",
        exportedAt: normalizeText(snapshot.exportedAt),
        recordCount: countWorkspaceBusinessRecords(snapshot),
        profiles: extractWorkspaceAccessProfiles(snapshot)
      });
      return true;
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        errors: [error.message || "Unable to reset workspace access."]
      });
      return true;
    }
  }

  return false;
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (await handleApiRoute(request, response, pathname, url)) {
    return;
  }

  if (serveWebsiteRoute(pathname, response)) {
    return;
  }

  if (serveOperationsRoute(pathname, request, response)) {
    return;
  }

  if (pathname === "/assets/oneroot-logo.png") {
    serveFile(response, path.join(ROOT_DIR, "assets", "oneroot-logo.png"));
    return;
  }

  if (pathname === "/icon.svg") {
    serveFile(response, path.join(ROOT_DIR, "icon.svg"));
    return;
  }

  sendText(response, 404, "Not found.");
}

async function startServer() {
  ensureOrdersStore();
  readWorkspaceSnapshotFile();

  try {
    await refreshWorkspaceSnapshotMirrorFromDatabase();
  } catch (error) {
    console.error("Background workspace snapshot warmup failed.", error);
  }

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error(error);
      sendJson(response, 500, {
        ok: false,
        errors: ["Internal server error."]
      });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(
      `OneRoot server running on http://${HOST}:${PORT} using ${
        hasDatabaseConfig() ? "database-backed" : "file-based"
      } storage.`
    );
  });

  refreshWorkspaceAuthProfileCache().catch((error) => {
    console.error("Background workspace auth refresh failed.", error);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
