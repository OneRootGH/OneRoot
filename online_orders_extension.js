(function initOnlineOrdersModule() {
  const ADMIN_ORDERS_ENDPOINT = "/api/admin/orders";
  const ONLINE_ORDERS_AUTH_STORAGE_KEY = "oneroot-expense-register:online-orders-auth:v1";
  const AUDIT_TRAIL_STORAGE_KEY = "oneroot-expense-register:audit-trail:v1";
  const AUDIT_TRAIL_LIMIT = 2500;
  const PAYMENT_STATUS_OPTIONS = [
    "pending",
    "awaiting-proof",
    "partial",
    "paid",
    "cancelled"
  ];

  const originalRender = render;
  const originalExportCurrentView = exportCurrentView;
  const originalBuildRecentActivities = buildRecentActivities;
  const originalBuildGlobalSearchResults = buildGlobalSearchResults;
  const originalGetSearchModuleOptions = getSearchModuleOptions;

  extendViewMeta();
  extendRolePresets();

  state.onlineOrders = [];
  state.onlineOrderFilters = createDefaultOnlineOrderFilters();
  state.onlineOrdersAuth = loadOnlineOrdersAuth();
  state.onlineOrdersMeta = {
    loading: false,
    loaded: false,
    error: "",
    lastLoadedAt: "",
    authRequired: false,
    statuses: ["new", "confirmed", "preparing", "ready", "completed", "cancelled"]
  };

  render = function patchedRender() {
    originalRender();
    renderOnlineOrdersPage();
  };

  exportCurrentView = async function patchedExportCurrentView() {
    if (state.currentView === "online-orders") {
      await exportOnlineOrdersCsv();
      return;
    }

    await originalExportCurrentView();
  };

  buildRecentActivities = function patchedBuildRecentActivities() {
    const items = originalBuildRecentActivities();
    const onlineItems = state.onlineOrders.map((order) => ({
      sortKey: order.updatedAt || order.createdAt,
      module: "Online Orders",
      title: `${order.orderNumber} • ${formatOnlineOrderAmount(order)}`,
      detail: `${order.customerName} • ${formatStatusLabel(order.status)} • ${buildOrderAreaSummary(order)}`,
      view: "online-orders"
    }));

    return [...items, ...onlineItems].sort((left, right) =>
      (right.sortKey || "").localeCompare(left.sortKey || "")
    );
  };

  buildGlobalSearchResults = function patchedBuildGlobalSearchResults() {
    const baseResults = originalBuildGlobalSearchResults();
    const query = normalizeText(state.searchFilters.query).toLowerCase();
    const moduleFilter = normalizeText(state.searchFilters.module).toLowerCase();
    const matchesModule = (view) =>
      moduleFilter === "" || moduleFilter === "all" || view === moduleFilter;

    const orderResults = state.onlineOrders.map((order) => ({
      module: "Online Orders",
      view: "online-orders",
      sortKey: order.updatedAt || order.createdAt,
      title: `${order.orderNumber} • ${order.customerName}`,
      detail: `${formatDisplayDate(extractDatePart(order.createdAt))} • ${formatStatusLabel(
        order.status
      )} • ${formatOnlineOrderAmount(order)}`,
      searchText: [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.deliveryMode,
        order.deliveryAddress,
        order.paymentMethod,
        order.paymentStatus,
        order.notes,
        order.internalNote,
        buildOrderAreaSummary(order),
        buildOrderItemSummary(order)
      ].join(" ")
    }));

    return [...baseResults, ...orderResults]
      .filter((result) => matchesModule(result.view))
      .filter((result) => {
        if (!query) {
          return true;
        }

        return [result.module, result.title, result.detail, result.searchText]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => (right.sortKey || "").localeCompare(left.sortKey || ""));
  };

  getSearchModuleOptions = function patchedGetSearchModuleOptions() {
    const options = originalGetSearchModuleOptions();

    if (!options.find((option) => option.value === "online-orders")) {
      options.push({ value: "online-orders", label: "Online Orders" });
    }

    return options;
  };

  document.body.addEventListener("click", handleOnlineOrdersClick);
  document.body.addEventListener("submit", handleOnlineOrdersSubmit);
  document.body.addEventListener("input", handleOnlineOrdersInput);
  document.body.addEventListener("change", handleOnlineOrdersInput);
  window.addEventListener("focus", () => {
    if (state.currentView === "online-orders") {
      void ensureOnlineOrdersLoaded({ force: true });
    }
  });

  function extendViewMeta() {
    VIEW_META["online-orders"] = {
      eyebrow: "Website Orders",
      title: "Online Orders",
      summary:
        "Review customer orders from OneRoot.shop, update fulfillment, follow payment status, and export order activity."
    };

    VIEW_VISUALS["online-orders"] = {
      icon: "cart",
      accent: "#f2c48c",
      soft: "rgba(242, 196, 140, 0.2)"
    };
  }

  function extendRolePresets() {
    ["owner", "admin", "finance", "operations", "cashier"].forEach((roleKey) => {
      const preset = ROLE_PRESET_MAP[roleKey];

      if (preset && !preset.views.includes("online-orders")) {
        preset.views.splice(preset.views.indexOf("inventory") + 1 || preset.views.length, 0, "online-orders");
      }
    });
  }

  function createDefaultOnlineOrderFilters() {
    return {
      search: "",
      status: "",
      paymentStatus: "",
      area: ""
    };
  }

  function loadOnlineOrdersAuth() {
    try {
      if (!("sessionStorage" in window)) {
        return { username: "", password: "" };
      }

      const raw = window.sessionStorage.getItem(ONLINE_ORDERS_AUTH_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      return {
        username: normalizeText(parsed.username),
        password: String(parsed.password || "")
      };
    } catch (error) {
      console.error(error);
      return { username: "", password: "" };
    }
  }

  function loadWorkspaceSessionOrdersAuth() {
    try {
      if (typeof loadAuthSession !== "function") {
        return { username: "", password: "" };
      }

      const session = loadAuthSession() || {};
      return {
        username: normalizeText(session.username).toLowerCase(),
        password: String(session.password || "")
      };
    } catch (error) {
      console.error(error);
      return { username: "", password: "" };
    }
  }

  function getEffectiveOnlineOrdersAuth() {
    const savedUsername = normalizeText(state.onlineOrdersAuth?.username);
    const savedPassword = String(state.onlineOrdersAuth?.password || "");

    if (savedUsername && savedPassword) {
      return {
        username: savedUsername,
        password: savedPassword
      };
    }

    return loadWorkspaceSessionOrdersAuth();
  }

  function getSignedInWorkspaceProfile() {
    try {
      if (typeof getCurrentUserProfile !== "function") {
        return null;
      }

      return getCurrentUserProfile();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function getOnlineOrdersUsername() {
    const currentProfile = getSignedInWorkspaceProfile();
    return normalizeText(
      state.onlineOrdersAuth?.username ||
        currentProfile?.username ||
        loadWorkspaceSessionOrdersAuth().username
    ).toLowerCase();
  }

  function canAttemptOnlineOrdersLoad() {
    return Boolean(hasOnlineOrdersAuth() || getOnlineOrdersUsername());
  }

  function persistOnlineOrdersAuth() {
    try {
      if (!("sessionStorage" in window)) {
        return;
      }

      window.sessionStorage.setItem(
        ONLINE_ORDERS_AUTH_STORAGE_KEY,
        JSON.stringify({
          username: normalizeText(state.onlineOrdersAuth?.username),
          password: String(state.onlineOrdersAuth?.password || "")
        })
      );
    } catch (error) {
      console.error(error);
    }
  }

  function clearOnlineOrdersAuth() {
    state.onlineOrdersAuth = { username: "", password: "" };

    try {
      if (!("sessionStorage" in window)) {
        return;
      }

      window.sessionStorage.removeItem(ONLINE_ORDERS_AUTH_STORAGE_KEY);
    } catch (error) {
      console.error(error);
    }
  }

  function hasOnlineOrdersAuth() {
    const auth = getEffectiveOnlineOrdersAuth();
    return Boolean(auth.username && auth.password);
  }

  function buildOnlineOrdersAuthHeader() {
    const auth = getEffectiveOnlineOrdersAuth();
    const username = normalizeText(auth.username);
    const password = String(auth.password || "");

    if (!username || !password) {
      return "";
    }

    try {
      return `Basic ${window.btoa(`${username}:${password}`)}`;
    } catch (error) {
      return `Basic ${window.btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
    }
  }

  function buildOnlineOrdersRequestHeaders(baseHeaders = {}) {
    const headers = { ...baseHeaders };
    const authorization = buildOnlineOrdersAuthHeader();

    if (authorization) {
      headers.Authorization = authorization;
    }

    return headers;
  }

  function supportsOrdersApi() {
    return ["http:", "https:"].includes(window.location.protocol);
  }

  async function ensureOnlineOrdersLoaded(options = {}) {
    if (!supportsOrdersApi()) {
      state.onlineOrdersMeta.error =
        "Online orders need the local or hosted server. Start the app with node server.js and open /operations/.";
      state.onlineOrdersMeta.loaded = false;
      renderOnlineOrdersPage();
      return;
    }

    if (state.onlineOrdersMeta.loading) {
      return;
    }

    if (state.onlineOrdersMeta.loaded && !options.force) {
      return;
    }

    if (!canAttemptOnlineOrdersLoad()) {
      state.onlineOrders = [];
      state.onlineOrdersMeta.loading = false;
      state.onlineOrdersMeta.loaded = false;
      state.onlineOrdersMeta.authRequired = true;
      state.onlineOrdersMeta.error =
        "Sign in to the workspace first. If online orders need to reconnect, enter the same workspace password here.";
      renderOnlineOrdersPage();

      if (options.toast) {
        showToast(state.onlineOrdersMeta.error);
      }
      return;
    }

    state.onlineOrdersMeta.loading = true;
    state.onlineOrdersMeta.error = "";
    state.onlineOrdersMeta.authRequired = false;
    renderOnlineOrdersPage();

    try {
      const response = await fetch(ADMIN_ORDERS_ENDPOINT, {
        cache: "no-store",
        headers: buildOnlineOrdersRequestHeaders()
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        state.onlineOrders = [];
        state.onlineOrdersMeta.authRequired = true;
        throw new Error(
          getOnlineOrdersUsername()
            ? "The workspace password could not reconnect online orders. Enter the same password you used to sign in and try again."
            : "Sign in to the workspace first, then reconnect online orders with the same password."
        );
      }

      if (!response.ok) {
        throw new Error(
          Array.isArray(payload.errors) ? payload.errors[0] : `Order request failed with ${response.status}.`
        );
      }

      state.onlineOrders = sortOnlineOrders(Array.isArray(payload.orders) ? payload.orders : []);
      state.onlineOrdersMeta.statuses = Array.isArray(payload.statuses)
        ? payload.statuses
        : state.onlineOrdersMeta.statuses;
      state.onlineOrdersMeta.loading = false;
      state.onlineOrdersMeta.loaded = true;
      state.onlineOrdersMeta.lastLoadedAt = new Date().toISOString();
      state.onlineOrdersMeta.error = "";
      state.onlineOrdersMeta.authRequired = false;

      if (options.toast) {
        showToast(`Online orders refreshed. ${state.onlineOrders.length} order${state.onlineOrders.length === 1 ? "" : "s"} loaded.`);
      }

      render();
    } catch (error) {
      console.error(error);
      state.onlineOrdersMeta.loading = false;
      state.onlineOrdersMeta.loaded = false;
      state.onlineOrdersMeta.error =
        normalizeText(error.message) ||
        "The online orders feed could not be loaded right now.";
      renderOnlineOrdersPage();

      if (options.toast) {
        showToast(state.onlineOrdersMeta.error);
      }
    }
  }

  function sortOnlineOrders(records) {
    return [...records].sort((left, right) =>
      String(right.updatedAt || right.createdAt || "").localeCompare(
        String(left.updatedAt || left.createdAt || "")
      )
    );
  }

  function getFilteredOnlineOrders() {
    const filters = state.onlineOrderFilters;
    const searchValue = normalizeText(filters.search).toLowerCase();

    return state.onlineOrders.filter((order) => {
      const matchesStatus = filters.status === "" || normalizeText(order.status) === filters.status;
      const matchesPayment =
        filters.paymentStatus === "" || normalizeText(order.paymentStatus) === filters.paymentStatus;
      const areas = getOrderAreaIds(order);
      const matchesArea = filters.area === "" || areas.includes(filters.area);
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.deliveryMode,
        order.deliveryAddress,
        order.paymentMethod,
        order.paymentStatus,
        order.notes,
        order.internalNote,
        buildOrderAreaSummary(order),
        buildOrderItemSummary(order)
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchValue === "" || haystack.includes(searchValue);

      return matchesStatus && matchesPayment && matchesArea && matchesSearch;
    });
  }

  function renderOnlineOrdersPage() {
    const root = document.getElementById("onlineOrdersViewRoot");

    if (!root) {
      return;
    }

    if (state.currentView !== "online-orders") {
      return;
    }

    if (
      !state.onlineOrdersMeta.loaded &&
      !state.onlineOrdersMeta.loading &&
      supportsOrdersApi() &&
      canAttemptOnlineOrdersLoad() &&
      !state.onlineOrdersMeta.authRequired
    ) {
      void ensureOnlineOrdersLoaded();
    }

    if (!supportsOrdersApi()) {
      root.innerHTML = buildUnavailableMarkup(state.onlineOrdersMeta.error);
      return;
    }

    const showAuthForm =
      state.onlineOrdersMeta.authRequired ||
      (!state.onlineOrdersMeta.loaded &&
        !state.onlineOrdersMeta.loading &&
        !canAttemptOnlineOrdersLoad());
    const orders = getFilteredOnlineOrders();
    const stats = buildOnlineOrderStats(orders);

    root.innerHTML = `
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">OneRoot.shop</p>
            <h3>Online Order Desk</h3>
          </div>
          <div class="module-actions">
            <button class="button button-secondary" data-online-orders-action="refresh" type="button">
              Refresh
            </button>
            <button class="button button-secondary" data-online-orders-action="export" type="button">
              Export CSV
            </button>
          </div>
        </div>

        <p class="muted-text">
          Website orders are stored on the server so staff can confirm, prepare, complete, and follow up from one place.
        </p>

        ${showAuthForm ? buildOnlineOrdersAuthMarkup() : ""}
        ${
          state.onlineOrdersMeta.error && !showAuthForm
            ? `<div class="status-banner warning">${escapeHtml(state.onlineOrdersMeta.error)}</div>`
            : ""
        }

        <div class="results-meta">
          <strong>${escapeHtml(String(state.onlineOrders.length))} total order${
      state.onlineOrders.length === 1 ? "" : "s"
    }</strong>
          <span>${
            state.onlineOrdersMeta.loading
              ? "Refreshing orders now..."
              : state.onlineOrdersMeta.lastLoadedAt
                ? `Last synced ${escapeHtml(formatTimestampLabel(state.onlineOrdersMeta.lastLoadedAt))}.`
                : "Orders will appear here after the first sync."
          }</span>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="stat-card dashboard-metric-card">
          <span>Orders In View</span>
          <strong>${escapeHtml(String(orders.length))}</strong>
          <p class="module-meta">Filtered online orders.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Open / Active</span>
          <strong>${escapeHtml(String(stats.activeCount))}</strong>
          <p class="module-meta">${escapeHtml(String(stats.newCount))} still new.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Completed</span>
          <strong>${escapeHtml(String(stats.completedCount))}</strong>
          <p class="module-meta">${escapeHtml(String(stats.cancelledCount))} cancelled.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Captured Value</span>
          <strong>${escapeHtml(formatCurrency(stats.totalAmount))}</strong>
          <p class="module-meta">Numeric order totals in this view.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Quote Requests</span>
          <strong>${escapeHtml(String(stats.quoteCount))}</strong>
          <p class="module-meta">Orders with price confirmation items.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Pending Payment</span>
          <strong>${escapeHtml(String(stats.pendingPaymentCount))}</strong>
          <p class="module-meta">Not yet marked fully paid.</p>
        </article>
      </section>

      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Filter Orders</p>
            <h3>Review Queue</h3>
          </div>
          <button class="button button-ghost" data-online-orders-action="clear-filters" type="button">
            Clear Filters
          </button>
        </div>

        <div class="filter-grid">
          <label>
            <span>Search</span>
            <input
              id="onlineOrdersSearchFilter"
              data-online-orders-filter="search"
              type="search"
              value="${escapeHtml(state.onlineOrderFilters.search)}"
              placeholder="Order no, customer, item, note..."
            />
          </label>

          <label>
            <span>Status</span>
            <select id="onlineOrdersStatusFilter" data-online-orders-filter="status">
              ${buildSelectMarkup(
                state.onlineOrdersMeta.statuses.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status)
                })),
                state.onlineOrderFilters.status,
                "All Statuses"
              )}
            </select>
          </label>

          <label>
            <span>Payment</span>
            <select id="onlineOrdersPaymentFilter" data-online-orders-filter="paymentStatus">
              ${buildSelectMarkup(
                PAYMENT_STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: formatStatusLabel(status)
                })),
                state.onlineOrderFilters.paymentStatus,
                "All Payment Statuses"
              )}
            </select>
          </label>

          <label>
            <span>Business Area</span>
            <select id="onlineOrdersAreaFilter" data-online-orders-filter="area">
              ${buildSelectMarkup(getOnlineOrderAreaOptions(), state.onlineOrderFilters.area, "All Areas")}
            </select>
          </label>
        </div>
      </section>

      <section class="section-card">
        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Areas & Items</th>
                <th>Total</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                orders.length === 0
                  ? `
                    <tr>
                      <td colspan="7" class="empty-state">
                        No online orders match the current filters yet.
                      </td>
                    </tr>
                  `
                  : orders.map((order) => buildOnlineOrderRowMarkup(order)).join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function buildOnlineOrdersAuthMarkup() {
    const currentProfile = getSignedInWorkspaceProfile();
    const username = getOnlineOrdersUsername();
    const errorMessage = normalizeText(state.onlineOrdersMeta.error);
    const helperText = currentProfile
      ? `Online orders use the same sign-in as the staff app. Enter the password for ${currentProfile.fullName} only when this browser needs to reconnect to the order server.`
      : "Sign in to the workspace first, then use the same password here if online orders need to reconnect.";

    return `
      <section class="section-card inset-card">
        <div class="section-heading compact">
          <div>
            <p class="kicker">Workspace Access</p>
            <h3>Reconnect Online Orders</h3>
          </div>
        </div>
        <p class="muted-text">
          ${escapeHtml(helperText)}
        </p>
        ${
          errorMessage
            ? `<div class="status-banner warning">${escapeHtml(errorMessage)}</div>`
            : ""
        }
        <form id="onlineOrdersAuthForm" novalidate>
          <div class="mini-form-grid">
            ${
              currentProfile
                ? `
                  <label>
                    <span>Signed-in Workspace User</span>
                    <input
                      id="onlineOrdersAuthUsername"
                      name="onlineOrdersAuthUsername"
                      type="text"
                      value="${escapeHtml(username)}"
                      autocomplete="username"
                      readonly
                    />
                  </label>
                `
                : `
                  <label>
                    <span>Workspace Username</span>
                    <input
                      id="onlineOrdersAuthUsername"
                      name="onlineOrdersAuthUsername"
                      type="text"
                      value="${escapeHtml(username)}"
                      autocomplete="username"
                      placeholder="Enter your workspace username"
                      required
                    />
                  </label>
                `
            }
            <label>
              <span>Workspace Password</span>
              <input
                id="onlineOrdersAuthPassword"
                name="onlineOrdersAuthPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Enter the same password you used to sign in"
                required
              />
            </label>
          </div>
          <div class="form-actions">
            <button class="button button-primary" type="submit">Use Workspace Password</button>
            <button class="button button-ghost" data-online-orders-action="clear-auth" type="button">
              Clear Saved Password
            </button>
          </div>
        </form>
      </section>
    `;
  }

  function buildUnavailableMarkup(message) {
    return `
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">OneRoot.shop</p>
            <h3>Online Order Desk</h3>
          </div>
        </div>
        <p class="body-copy">
          Online orders only work when the staff app is opened through the server route.
        </p>
        <div class="guide-list">
          <p>1. Start the server with <code>node server.js</code>.</p>
          <p>2. Open <code>/operations/</code> instead of the plain file preview.</p>
          <p>3. Use the public website at <code>/</code> for customer ordering.</p>
        </div>
        ${
          message
            ? `<p class="muted-text">${escapeHtml(message)}</p>`
            : ""
        }
      </section>
    `;
  }

  function buildOnlineOrderRowMarkup(order) {
    const status = getOnlineOrderStatusConfig(order.status);
    const paymentStatus = getOnlinePaymentStatusConfig(order.paymentStatus);
    const nextStatus = getNextOrderStatus(order.status);
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const scheduleText = [order.preferredDate ? formatDisplayDate(order.preferredDate) : "", order.preferredTime]
      .filter(Boolean)
      .join(" • ");

    return `
      <tr>
        <td>
          <span class="table-primary">${escapeHtml(order.orderNumber || "No number")}</span>
          <span class="table-secondary">${escapeHtml(formatTimestampLabel(order.createdAt || order.updatedAt))}</span>
        </td>
        <td>
          <span class="table-primary">${escapeHtml(order.customerName || "No customer")}</span>
          <span class="table-secondary">${escapeHtml(order.customerPhone || "")}</span>
          ${
            order.customerEmail
              ? `<span class="table-secondary">${escapeHtml(order.customerEmail)}</span>`
              : ""
          }
        </td>
        <td>
          <span class="table-primary">${escapeHtml(buildOrderAreaSummary(order) || "No area")}</span>
          <span class="table-secondary">${escapeHtml(buildOrderItemSummary(order))}</span>
          <span class="table-secondary">${escapeHtml(`${itemCount} item${itemCount === 1 ? "" : "s"}`)}</span>
        </td>
        <td>
          <span class="table-primary">${escapeHtml(formatOnlineOrderAmount(order))}</span>
          <span class="table-secondary">${escapeHtml(order.paymentMethod || "No payment method")}</span>
        </td>
        <td>
          <span class="table-primary">${escapeHtml(order.deliveryMode || "Delivery")}</span>
          <span class="table-secondary">${escapeHtml(scheduleText || "No preferred schedule")}</span>
          ${
            order.deliveryAddress
              ? `<span class="table-secondary">${escapeHtml(order.deliveryAddress)}</span>`
              : ""
          }
        </td>
        <td>
          <span class="tag ${escapeHtml(status.className)}">${escapeHtml(status.label)}</span>
          <span class="tag ${escapeHtml(paymentStatus.className)}">${escapeHtml(paymentStatus.label)}</span>
          <span class="table-secondary">${escapeHtml(
            `Updated ${formatTimestampLabel(order.updatedAt || order.createdAt)}`
          )}</span>
          ${
            order.internalNote
              ? `<span class="table-secondary">${escapeHtml(order.internalNote)}</span>`
              : ""
          }
        </td>
        <td>
          <div class="table-action-group">
            ${
              nextStatus
                ? `
                  <button
                    class="edit-btn"
                    data-online-orders-action="advance-status"
                    data-order-id="${escapeHtml(order.id)}"
                    data-next-status="${escapeHtml(nextStatus)}"
                    type="button"
                  >
                    ${escapeHtml(getNextStatusLabel(nextStatus))}
                  </button>
                `
                : ""
            }
            ${
              order.paymentStatus !== "paid"
                ? `
                  <button
                    class="edit-btn"
                    data-online-orders-action="mark-paid"
                    data-order-id="${escapeHtml(order.id)}"
                    type="button"
                  >
                    Mark Paid
                  </button>
                `
                : ""
            }
            ${
              !["completed", "cancelled"].includes(normalizeText(order.status))
                ? `
                  <button
                    class="delete-btn"
                    data-online-orders-action="cancel-order"
                    data-order-id="${escapeHtml(order.id)}"
                    type="button"
                  >
                    Cancel
                  </button>
                `
                : ""
            }
            <button
              class="edit-btn"
              data-online-orders-action="copy-update"
              data-order-id="${escapeHtml(order.id)}"
              type="button"
            >
              Copy Update
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function buildOnlineOrderStats(orders) {
    return orders.reduce(
      (summary, order) => {
        const status = normalizeText(order.status);
        const paymentStatus = normalizeText(order.paymentStatus);

        summary.totalAmount += Number(order.totalAmount || 0);

        if (status === "new") {
          summary.newCount += 1;
        }

        if (!["completed", "cancelled"].includes(status)) {
          summary.activeCount += 1;
        }

        if (status === "completed") {
          summary.completedCount += 1;
        }

        if (status === "cancelled") {
          summary.cancelledCount += 1;
        }

        if (order.includesQuoteItems) {
          summary.quoteCount += 1;
        }

        if (paymentStatus !== "paid") {
          summary.pendingPaymentCount += 1;
        }

        return summary;
      },
      {
        totalAmount: 0,
        newCount: 0,
        activeCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        quoteCount: 0,
        pendingPaymentCount: 0
      }
    );
  }

  function getOnlineOrderAreaOptions() {
    const areaMap = new Map();

    state.onlineOrders.forEach((order) => {
      getOrderAreaIds(order).forEach((areaId) => {
        if (!areaMap.has(areaId)) {
          areaMap.set(areaId, {
            value: areaId,
            label: getBusinessArea(areaId).label
          });
        }
      });
    });

    return [...areaMap.values()].sort((left, right) => left.label.localeCompare(right.label));
  }

  function getOrderAreaIds(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    return [...new Set(items.map((item) => normalizeBusinessAreaId(item.businessAreaId)).filter(Boolean))];
  }

  function buildOrderAreaSummary(order) {
    const areaIds = getOrderAreaIds(order);

    return areaIds
      .map((areaId) => getBusinessArea(areaId).shortLabel || getBusinessArea(areaId).label)
      .join(", ");
  }

  function buildOrderItemSummary(order) {
    const items = Array.isArray(order.items) ? order.items : [];

    if (items.length === 0) {
      return "No items";
    }

    const preview = items.slice(0, 3).map((item) => `${item.name} x${item.quantity}`);
    const extraCount = items.length - preview.length;

    return extraCount > 0 ? `${preview.join(", ")} +${extraCount} more` : preview.join(", ");
  }

  function formatOnlineOrderAmount(order) {
    const amount = Number(order.totalAmount || 0);

    if (order.includesQuoteItems && amount > 0) {
      return `${formatCurrency(amount)} + quote`;
    }

    if (order.includesQuoteItems) {
      return "Quote request";
    }

    return formatCurrency(amount);
  }

  function extractDatePart(value) {
    return normalizeText(value).slice(0, 10);
  }

  function formatStatusLabel(value) {
    return normalizeText(value)
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function getOnlineOrderStatusConfig(status) {
    switch (normalizeText(status)) {
      case "completed":
        return { label: "Completed", className: "alert-pill-on-track" };
      case "ready":
        return { label: "Ready", className: "status-tag-occupied" };
      case "preparing":
        return { label: "Preparing", className: "status-tag-reserved" };
      case "cancelled":
        return { label: "Cancelled", className: "alert-pill-overdue" };
      case "confirmed":
        return { label: "Confirmed", className: "alert-pill-due" };
      case "new":
      default:
        return { label: "New", className: "alert-pill-due" };
    }
  }

  function getOnlinePaymentStatusConfig(status) {
    switch (normalizeText(status)) {
      case "paid":
        return { label: "Paid", className: "alert-pill-on-track" };
      case "partial":
        return { label: "Part Paid", className: "alert-pill-due" };
      case "cancelled":
        return { label: "Cancelled", className: "alert-pill-overdue" };
      case "awaiting-proof":
        return { label: "Awaiting Proof", className: "status-tag-reserved" };
      case "pending":
      default:
        return { label: "Payment Pending", className: "alert-pill-due" };
    }
  }

  function getNextOrderStatus(status) {
    switch (normalizeText(status)) {
      case "new":
        return "confirmed";
      case "confirmed":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "completed";
      default:
        return "";
    }
  }

  function getNextStatusLabel(status) {
    switch (status) {
      case "confirmed":
        return "Confirm";
      case "preparing":
        return "Start Prep";
      case "ready":
        return "Mark Ready";
      case "completed":
        return "Complete";
      default:
        return "Update";
    }
  }

  function handleOnlineOrdersInput(event) {
    const target = event.target.closest("[data-online-orders-filter]");

    if (!target) {
      return;
    }

    const filterKey = target.dataset.onlineOrdersFilter;

    if (!Object.prototype.hasOwnProperty.call(state.onlineOrderFilters, filterKey)) {
      return;
    }

    state.onlineOrderFilters[filterKey] = normalizeText(target.value);
    renderOnlineOrdersPage();
  }

  function handleOnlineOrdersClick(event) {
    const button = event.target.closest("button[data-online-orders-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.onlineOrdersAction;
    const orderId = normalizeText(button.dataset.orderId);

    if (action === "refresh") {
      void ensureOnlineOrdersLoaded({ force: true, toast: true });
      return;
    }

    if (action === "export") {
      void exportOnlineOrdersCsv();
      return;
    }

    if (action === "clear-filters") {
      state.onlineOrderFilters = createDefaultOnlineOrderFilters();
      renderOnlineOrdersPage();
      showToast("Online order filters cleared.");
      return;
    }

    if (action === "clear-auth") {
      clearOnlineOrdersAuth();
      state.onlineOrders = [];
      state.onlineOrdersMeta.loaded = false;
      state.onlineOrdersMeta.authRequired = true;
      state.onlineOrdersMeta.error =
        "Saved workspace password was cleared. If the current sign-in session is still active, online orders will reconnect automatically on refresh.";
      renderOnlineOrdersPage();
      showToast("Saved workspace password cleared.");
      return;
    }

    if (!orderId) {
      return;
    }

    if (action === "advance-status") {
      const nextStatus = normalizeText(button.dataset.nextStatus);
      const note = window.prompt(
        `Optional note for ${nextStatus} status:`,
        ""
      );
      void updateOnlineOrder(orderId, { status: nextStatus, internalNote: note || "" });
      return;
    }

    if (action === "mark-paid") {
      const note = window.prompt("Optional payment note:", "");
      void updateOnlineOrder(orderId, { paymentStatus: "paid", internalNote: note || "" });
      return;
    }

    if (action === "cancel-order") {
      const confirmed = window.confirm(
        "Cancel this online order? This should only be used when the order will not be fulfilled."
      );

      if (!confirmed) {
        return;
      }

      const note = window.prompt("Reason for cancellation:", "") || "Order cancelled by staff.";
      void updateOnlineOrder(orderId, { status: "cancelled", internalNote: note });
      return;
    }

    if (action === "copy-update") {
      void copyCustomerUpdate(orderId);
    }
  }

  async function handleOnlineOrdersSubmit(event) {
    if (event.target.id !== "onlineOrdersAuthForm") {
      return;
    }

    event.preventDefault();

    const formData = new FormData(event.target);
    const username = normalizeText(formData.get("onlineOrdersAuthUsername") || getOnlineOrdersUsername()).toLowerCase();
    const password = String(formData.get("onlineOrdersAuthPassword") || "");

    if (!username) {
      showToast("Sign in to the workspace first.");
      return;
    }

    if (!password) {
      showToast("Enter the same password you used to sign in.");
      return;
    }

    state.onlineOrdersAuth = { username, password };
    persistOnlineOrdersAuth();
    if (typeof establishServerWorkspaceSession === "function") {
      await establishServerWorkspaceSession(username, password);
    }
    state.onlineOrdersMeta.authRequired = false;
    state.onlineOrdersMeta.error = "";
    void ensureOnlineOrdersLoaded({ force: true, toast: true });
  }

  async function updateOnlineOrder(orderId, payload) {
    try {
      const response = await fetch(`${ADMIN_ORDERS_ENDPOINT}/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: buildOnlineOrdersRequestHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        state.onlineOrders = [];
        state.onlineOrdersMeta.authRequired = true;
        state.onlineOrdersMeta.error =
          "The workspace password could not reconnect online orders. Enter the same password you used to sign in and try again.";
        renderOnlineOrdersPage();
        throw new Error("Online order access expired. Re-enter the same workspace password to continue.");
      }

      if (!response.ok || !result.ok || !result.order) {
        throw new Error(Array.isArray(result.errors) ? result.errors[0] : "Order update failed.");
      }

      const nextOrder = result.order;
      state.onlineOrders = sortOnlineOrders(
        state.onlineOrders.map((order) => (order.id === nextOrder.id ? nextOrder : order))
      );
      state.onlineOrdersMeta.lastLoadedAt = new Date().toISOString();

      appendOnlineOrderAuditEntry({
        action: "update",
        title: `Online order updated: ${nextOrder.orderNumber}`,
        detail: buildOrderAuditDetail(nextOrder, payload),
        recordId: nextOrder.orderNumber
      });

      renderOnlineOrdersPage();
      showToast(`Online order ${nextOrder.orderNumber} updated.`);
    } catch (error) {
      console.error(error);
      showToast(normalizeText(error.message) || "The order update could not be saved.");
    }
  }

  async function copyCustomerUpdate(orderId) {
    const order = state.onlineOrders.find((record) => record.id === orderId);

    if (!order) {
      showToast("That online order could not be found.");
      return;
    }

    const message = [
      `Hello ${order.customerName},`,
      `Your OneRoot order ${order.orderNumber} is currently ${formatStatusLabel(order.status).toLowerCase()}.`,
      `Payment status: ${formatStatusLabel(order.paymentStatus || "pending")}.`,
      `Items: ${buildOrderItemSummary(order)}.`,
      order.includesQuoteItems
        ? `Current captured amount: ${formatOnlineOrderAmount(order)}.`
        : `Total: ${formatOnlineOrderAmount(order)}.`,
      state.onlineOrdersMeta.lastLoadedAt
        ? `Last updated: ${formatTimestampLabel(order.updatedAt || order.createdAt)}.`
        : "",
      `Thank you for choosing OneRoot Essentials.`
    ]
      .filter(Boolean)
      .join(" ");

    const copied = await writeTextToClipboard(
      message,
      `Customer update copied for ${order.orderNumber}.`
    );

    if (copied) {
      appendOnlineOrderAuditEntry({
        action: "export",
        title: `Customer update copied: ${order.orderNumber}`,
        detail: `A customer-ready update message was copied for ${order.customerName}.`,
        recordId: order.orderNumber
      });
    }
  }

  function buildOrderAuditDetail(order, payload) {
    const details = [];

    if (payload.status) {
      details.push(`status ${formatStatusLabel(payload.status)}`);
    }

    if (payload.paymentStatus) {
      details.push(`payment ${formatStatusLabel(payload.paymentStatus)}`);
    }

    if (payload.internalNote) {
      details.push(`note: ${normalizeText(payload.internalNote)}`);
    }

    return details.length > 0
      ? `${order.customerName} • ${details.join(" • ")}`
      : `${order.customerName} • Order updated.`;
  }

  async function exportOnlineOrdersCsv() {
    const orders = getFilteredOnlineOrders();

    if (orders.length === 0) {
      showToast("There are no online orders to export in the current view.");
      return;
    }

    const rows = [
      [
        "orderNumber",
        "status",
        "paymentStatus",
        "createdAt",
        "updatedAt",
        "customerName",
        "customerPhone",
        "customerEmail",
        "deliveryMode",
        "deliveryAddress",
        "preferredDate",
        "preferredTime",
        "paymentMethod",
        "businessAreas",
        "itemCount",
        "items",
        "totalAmount",
        "includesQuoteItems",
        "notes",
        "internalNote"
      ],
      ...orders.map((order) => [
        order.orderNumber,
        order.status,
        order.paymentStatus,
        order.createdAt,
        order.updatedAt,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.deliveryMode,
        order.deliveryAddress,
        order.preferredDate,
        order.preferredTime,
        order.paymentMethod,
        buildOrderAreaSummary(order),
        String(Array.isArray(order.items) ? order.items.length : 0),
        buildOrderItemSummary(order),
        Number(order.totalAmount || 0).toFixed(2),
        order.includesQuoteItems ? "Yes" : "No",
        order.notes || "",
        order.internalNote || ""
      ])
    ];

    const saved = await saveCsvFile(`oneroot-online-orders-${dateStamp()}.csv`, rows);

    if (saved) {
      appendOnlineOrderAuditEntry({
        action: "export",
        title: "Online orders exported",
        detail: `${orders.length} online order${orders.length === 1 ? "" : "s"} exported to CSV.`,
        entryCount: orders.length
      });
      showToast(`Exported ${orders.length} online order${orders.length === 1 ? "" : "s"}.`);
    }
  }

  function appendOnlineOrderAuditEntry(entry) {
    if (!Array.isArray(state.auditTrail)) {
      return;
    }

    const activeProfile =
      typeof getCurrentUserProfile === "function" ? getCurrentUserProfile() : null;
    const signedInProfile = Array.isArray(state.userProfiles)
      ? state.userProfiles.find((item) => item.id === state.signedInUserId) || null
      : null;
    const profile = activeProfile || signedInProfile;
    const auditEntry = {
      id: typeof generateId === "function"
        ? generateId()
        : `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      moduleKey: "online-orders",
      moduleLabel: "Online Orders",
      action: normalizeText(entry.action || "update").toLowerCase() || "update",
      title: normalizeText(entry.title || "Online order activity"),
      detail: normalizeText(entry.detail),
      recordId: normalizeText(entry.recordId),
      actorId: normalizeText(profile?.id || state.signedInUserId),
      actorName:
        normalizeText(profile?.fullName || profile?.username || "Workspace User") ||
        "Workspace User",
      actorRole: normalizeText(profile?.role || "local") || "local",
      entryCount: Math.max(Number(entry.entryCount || 1), 1),
      view: "online-orders"
    };

    state.auditTrail = [...state.auditTrail, auditEntry]
      .sort((left, right) => (right.timestamp || "").localeCompare(left.timestamp || ""))
      .slice(0, AUDIT_TRAIL_LIMIT);

    try {
      localStorage.setItem(AUDIT_TRAIL_STORAGE_KEY, JSON.stringify(state.auditTrail));
    } catch (error) {
      console.error(error);
    }
  }
})();
