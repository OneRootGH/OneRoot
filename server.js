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
const WORKSPACE_AUTH_FILES = [
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

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return normalizeText(value).replace(/[^\d+]/g, "");
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

function readOrders() {
  ensureOrdersStore();
  const parsed = readJsonFile(ORDERS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeOrders(orders) {
  ensureOrdersStore();
  writeJsonFile(ORDERS_FILE, orders);
}

function createOrderNumber() {
  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ORO-${dateStamp}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function getMimeType(filePath) {
  return WEBSITE_STATIC_MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(body);
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": contentType
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

function sanitizeWorkspaceAuthProfile(record) {
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

  if (!fullName || !username || !role || !passwordHash || !active || !loginEnabled) {
    return null;
  }

  return {
    fullName,
    username,
    role,
    passwordHash
  };
}

function loadWorkspaceAuthProfiles() {
  for (const filePath of WORKSPACE_AUTH_FILES) {
    const parsed = readJsonFile(filePath, null);
    const profiles = Array.isArray(parsed?.userProfiles)
      ? parsed.userProfiles.map(sanitizeWorkspaceAuthProfile).filter(Boolean)
      : [];

    if (profiles.length > 0) {
      return profiles;
    }
  }

  return [];
}

function isAuthorizedWorkspaceOrderUser(auth) {
  const username = normalizeText(auth?.username).toLowerCase();
  const password = String(auth?.password || "");

  if (!username || !password) {
    return false;
  }

  const profile = loadWorkspaceAuthProfiles().find(
    (item) =>
      item.username === username &&
      ONLINE_ORDER_ALLOWED_ROLES.has(item.role) &&
      item.passwordHash === buildPasswordDigest(password)
  );

  return Boolean(profile);
}

function isAuthorizedAdminRequest(request) {
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
  }

  if (internalNote) {
    nextOrder.internalNote = internalNote;
  }

  return { order: nextOrder };
}

function getTrackedOrder(orderNumber, phone) {
  const normalizedNumber = normalizeText(orderNumber).toUpperCase();
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedNumber || !normalizedPhone) {
    return null;
  }

  return readOrders().find(
    (order) =>
      normalizeText(order.orderNumber).toUpperCase() === normalizedNumber &&
      normalizePhone(order.customerPhoneNormalized || order.customerPhone) === normalizedPhone
  );
}

function buildPublicOrderView(order) {
  if (!order) {
    return null;
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
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
      timestamp: new Date().toISOString()
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

      const orders = readOrders();
      orders.unshift(order);
      writeOrders(orders);
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
    const order = getTrackedOrder(
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

  if (pathname === "/api/admin/orders") {
    if (!isAuthorizedAdminRequest(request)) {
      sendUnauthorized(response);
      return true;
    }

    if (request.method === "GET") {
      const orders = readOrders().sort((left, right) =>
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
        const orders = readOrders();
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

        const nextOrders = orders.map((item) => (item.id === existingOrder.id ? order : item));
        writeOrders(nextOrders);
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

ensureOrdersStore();

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
  console.log(`OneRoot server running on http://${HOST}:${PORT}`);
});
