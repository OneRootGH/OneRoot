(function initOneRootShop() {
  const SHOP_CART_STORAGE_KEY = "oneroot-shop:cart:v1";
  const SHOP_CUSTOMER_STORAGE_KEY = "oneroot-shop:customer:v1";
  const INITIAL_VISIBLE_ITEM_COUNT = 48;
  const VISIBLE_ITEM_STEP = 24;

  const state = {
    config: null,
    catalog: [],
    businessAreas: [],
    paymentMethods: [],
    cart: loadStoredCart(),
    customerDraft: loadStoredCustomerDraft(),
    filters: {
      search: "",
      area: "",
      sort: "featured"
    },
    visibleItemCount: INITIAL_VISIBLE_ITEM_COUNT
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    captureElements();
    bindEvents();

    if (elements.checkoutForm) {
      restoreCustomerDraftIntoForm();
      void loadStorefront();
    }

    if (elements.trackingForm) {
      void loadPublicConfig();
    }
  }

  function captureElements() {
    [
      "heroContactLine",
      "footerContactLine",
      "businessAreaGrid",
      "catalogMeta",
      "catalogSearchInput",
      "catalogAreaFilter",
      "catalogSortFilter",
      "catalogResultsMeta",
      "catalogGrid",
      "cartToggleBtn",
      "cartToggleCount",
      "closeCartBtn",
      "cartPanel",
      "cartItems",
      "cartSubtotalValue",
      "checkoutForm",
      "customerNameInput",
      "customerPhoneInput",
      "customerEmailInput",
      "deliveryModeInput",
      "deliveryAddressInput",
      "preferredDateInput",
      "preferredTimeInput",
      "paymentMethodInput",
      "orderNotesInput",
      "checkoutMessage",
      "trackingForm",
      "trackingOrderNumber",
      "trackingPhoneNumber",
      "trackingMessage",
      "trackingResult"
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    elements.catalogSearchInput?.addEventListener("input", (event) => {
      state.filters.search = normalizeText(event.target.value);
      state.visibleItemCount = INITIAL_VISIBLE_ITEM_COUNT;
      renderCatalog();
    });

    elements.catalogAreaFilter?.addEventListener("change", (event) => {
      state.filters.area = normalizeText(event.target.value);
      state.visibleItemCount = INITIAL_VISIBLE_ITEM_COUNT;
      renderCatalog();
    });

    elements.catalogSortFilter?.addEventListener("change", (event) => {
      state.filters.sort = normalizeText(event.target.value) || "featured";
      renderCatalog();
    });

    elements.checkoutForm?.addEventListener("submit", handleCheckoutSubmit);
    elements.trackingForm?.addEventListener("submit", handleTrackingSubmit);

    elements.checkoutForm?.addEventListener("input", persistCustomerDraftFromForm);
    elements.cartToggleBtn?.addEventListener("click", toggleCartPanel);
    elements.closeCartBtn?.addEventListener("click", closeCartPanel);

    document.body.addEventListener("click", handleBodyClick);
  }

  async function loadStorefront() {
    setText(elements.catalogMeta, "Loading OneRoot catalog...");

    try {
      const [catalogResponse, configResponse] = await Promise.all([
        fetch("/api/catalog", { cache: "no-store" }),
        fetch("/api/public-config", { cache: "no-store" })
      ]);

      if (!catalogResponse.ok) {
        throw new Error(`Catalog request failed with ${catalogResponse.status}.`);
      }

      if (!configResponse.ok) {
        throw new Error(`Config request failed with ${configResponse.status}.`);
      }

      const catalogPayload = await catalogResponse.json();
      const configPayload = await configResponse.json();

      state.catalog = Array.isArray(catalogPayload.items) ? catalogPayload.items : [];
      state.businessAreas = Array.isArray(catalogPayload.businessAreas)
        ? catalogPayload.businessAreas
        : [];
      state.paymentMethods = Array.isArray(configPayload.paymentMethods)
        ? configPayload.paymentMethods
        : Array.isArray(catalogPayload.paymentMethods)
          ? catalogPayload.paymentMethods
          : [];
      state.config = configPayload;

      populateAreaFilter();
      populatePaymentMethods();
      renderContactLines();
      renderBusinessAreas();
      renderCatalog();
      renderCart();
    } catch (error) {
      console.error(error);
      setText(
        elements.catalogMeta,
        "The catalog could not load right now. Refresh the page or check the server."
      );

      if (elements.catalogGrid) {
        elements.catalogGrid.innerHTML = `
          <article class="catalog-card">
            <strong>Catalog unavailable</strong>
            <p>The OneRoot online ordering catalog could not be loaded.</p>
          </article>
        `;
      }
    }
  }

  async function loadPublicConfig() {
    try {
      const response = await fetch("/api/public-config", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Config request failed with ${response.status}.`);
      }

      state.config = await response.json();
      renderContactLines();
    } catch (error) {
      console.error(error);
    }
  }

  function populateAreaFilter() {
    if (!elements.catalogAreaFilter) {
      return;
    }

    elements.catalogAreaFilter.innerHTML = [
      `<option value="">All Areas</option>`,
      ...state.businessAreas.map(
        (area) =>
          `<option value="${escapeHtml(area.id)}">${escapeHtml(area.label)}</option>`
      )
    ].join("");
  }

  function populatePaymentMethods() {
    if (!elements.paymentMethodInput) {
      return;
    }

    const methods = state.paymentMethods.length
      ? state.paymentMethods
      : ["Cash On Delivery", "Mobile Money", "Bank Transfer", "Pay On Pickup"];

    elements.paymentMethodInput.innerHTML = methods
      .map((method) => `<option value="${escapeHtml(method)}">${escapeHtml(method)}</option>`)
      .join("");

    if (state.customerDraft.paymentMethod) {
      elements.paymentMethodInput.value = state.customerDraft.paymentMethod;
    }
  }

  function renderContactLines() {
    if (!state.config) {
      return;
    }

    const contactParts = [
      state.config.supportPhone ? `Phone: ${state.config.supportPhone}` : "",
      state.config.whatsappNumber ? `WhatsApp: ${state.config.whatsappNumber}` : "",
      state.config.supportEmail ? `Email: ${state.config.supportEmail}` : "",
      state.config.pickupNote || ""
    ].filter(Boolean);

    if (elements.heroContactLine) {
      elements.heroContactLine.innerHTML = contactParts
        .slice(0, 3)
        .map((part) => `<span>${escapeHtml(part)}</span>`)
        .join("");
    }

    if (elements.footerContactLine) {
      elements.footerContactLine.textContent = contactParts.join(" • ");
    }
  }

  function renderBusinessAreas() {
    if (!elements.businessAreaGrid) {
      return;
    }

    elements.businessAreaGrid.innerHTML = state.businessAreas
      .map((area) => {
        const helperText = getAreaHelperText(area.id);
        return `
          <article class="area-card">
            <span class="count-pill">${escapeHtml(String(area.itemCount || 0))} items</span>
            <strong>${escapeHtml(area.label)}</strong>
            <p>${escapeHtml(helperText)}</p>
            <button class="button button-secondary" data-area-jump="${escapeHtml(area.id)}" type="button">
              Shop This Area
            </button>
          </article>
        `;
      })
      .join("");
  }

  function getAreaHelperText(areaId) {
    switch (areaId) {
      case "water-equipment":
        return "Water delivery, construction support requests, and rental equipment enquiries.";
      case "cold-store-groceries":
        return "Frozen foods, groceries, household staples, and quick daily replenishment items.";
      case "laundry-services":
        return "Normal and express laundry requests with pickup, delivery, or special notes.";
      case "mobile-money":
        return "Mobile money service requests, float support, and follow-up transactions.";
      case "rentals-apartments":
        return "Apartment viewing requests, tenant follow-up, and accommodation enquiries.";
      case "fresh-foods-drinks":
        return "Ice Kenkey, Sobolo, bottled ice cream, and other fast-moving refreshments.";
      case "kitchen":
        return "Kitchen orders, family pack requests, and made-to-order meal follow-up.";
      default:
        return "Order across the OneRoot essentials ecosystem in one checkout.";
    }
  }

  function getFilteredCatalog() {
    const searchValue = state.filters.search.toLowerCase();
    const areaValue = state.filters.area;

    const filtered = state.catalog.filter((item) => {
      const matchesArea = areaValue === "" || item.businessAreaId === areaValue;
      const haystack = [
        item.name,
        item.category,
        item.sourceCategory,
        getAreaLabel(item.businessAreaId),
        item.notes
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchValue === "" || haystack.includes(searchValue);

      return matchesArea && matchesSearch;
    });

    const sortMode = state.filters.sort;
    const sorted = [...filtered].sort((left, right) => {
      if (sortMode === "price-asc") {
        return getComparablePrice(left) - getComparablePrice(right) || left.name.localeCompare(right.name);
      }

      if (sortMode === "price-desc") {
        return getComparablePrice(right) - getComparablePrice(left) || left.name.localeCompare(right.name);
      }

      if (sortMode === "name") {
        return left.name.localeCompare(right.name);
      }

      const areaDifference = getAreaLabel(left.businessAreaId).localeCompare(
        getAreaLabel(right.businessAreaId)
      );

      if (areaDifference !== 0) {
        return areaDifference;
      }

      const quoteDifference =
        Number(Boolean(left.salesPrice > 0)) - Number(Boolean(right.salesPrice > 0));

      if (quoteDifference !== 0) {
        return quoteDifference;
      }

      return left.name.localeCompare(right.name);
    });

    return sorted;
  }

  function renderCatalog() {
    if (!elements.catalogGrid) {
      return;
    }

    const filteredItems = getFilteredCatalog();
    const visibleItems = filteredItems.slice(0, state.visibleItemCount);
    const moreItemsAvailable = filteredItems.length > visibleItems.length;

    setText(
      elements.catalogMeta,
      filteredItems.length === 0
        ? "No items match the current search."
        : `${filteredItems.length} catalog item${filteredItems.length === 1 ? "" : "s"} ready for order.`
    );

    if (elements.catalogResultsMeta) {
      elements.catalogResultsMeta.textContent =
        filteredItems.length > visibleItems.length
          ? `Showing ${visibleItems.length} of ${filteredItems.length} items. Use search or Show More to narrow faster.`
          : `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} shown.`;
    }

    if (filteredItems.length === 0) {
      elements.catalogGrid.innerHTML = `
        <article class="catalog-card">
          <strong>No matching items</strong>
          <p>Try another business area or search term.</p>
        </article>
      `;
      return;
    }

    elements.catalogGrid.innerHTML = [
      ...visibleItems.map((item) => buildCatalogCardMarkup(item)),
      moreItemsAvailable
        ? `
          <article class="catalog-card">
            <strong>More items available</strong>
            <p>${escapeHtml(
              `${filteredItems.length - visibleItems.length} more catalog item${
                filteredItems.length - visibleItems.length === 1 ? "" : "s"
              } are hidden for speed.`
            )}</p>
            <button class="button button-secondary" data-shop-action="show-more" type="button">
              Show More
            </button>
          </article>
        `
        : ""
    ].join("");
  }

  function buildCatalogCardMarkup(item) {
    const displayPrice = getItemPriceMarkup(item);

    return `
      <article class="catalog-card">
        <div class="catalog-card-header">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(getAreaLabel(item.businessAreaId))}</p>
          </div>
          <span class="catalog-price">${displayPrice}</span>
        </div>

        <div class="catalog-meta">
          <span>${escapeHtml(item.category || "General")}</span>
          <span>${escapeHtml(item.itemType === "service" ? "Service" : "Stock")}</span>
          ${item.salesPrice > 0 ? "" : `<span class="quote-pill">Quote</span>`}
        </div>

        <p>${escapeHtml(item.notes || "Available for quick OneRoot order capture.")}</p>

        <div class="catalog-card-footer">
          <input
            type="number"
            min="1"
            step="1"
            value="1"
            inputmode="numeric"
            data-item-quantity="${escapeHtml(item.id)}"
            aria-label="Quantity for ${escapeHtml(item.name)}"
          />
          <button class="button button-primary" data-shop-action="add-to-cart" data-item-id="${escapeHtml(
            item.id
          )}" type="button">
            Add
          </button>
        </div>
      </article>
    `;
  }

  function getItemPriceMarkup(item) {
    if (Number(item.salesPrice || 0) > 0) {
      return escapeHtml(formatCurrency(item.salesPrice));
    }

    return `<span class="quote-pill">Quote</span>`;
  }

  function renderCart() {
    if (!elements.cartItems || !elements.cartSubtotalValue || !elements.cartToggleCount) {
      return;
    }

    const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(
      state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    );

    elements.cartToggleCount.textContent = String(totalQuantity);
    elements.cartSubtotalValue.textContent = formatCurrency(subtotal);

    if (state.cart.length === 0) {
      elements.cartItems.innerHTML = `
        <article class="cart-item">
          <strong>Your cart is empty</strong>
          <p>Add groceries, requests, drinks, or services to start an online order.</p>
        </article>
      `;
      return;
    }

    elements.cartItems.innerHTML = state.cart
      .map(
        (item) => `
          <article class="cart-item">
            <div class="cart-item-row">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <p>${escapeHtml(getAreaLabel(item.businessAreaId))} • ${escapeHtml(item.category || "General")}</p>
              </div>
              <strong>${
                item.unitPrice > 0
                  ? escapeHtml(formatCurrency(item.unitPrice * item.quantity))
                  : "Quote"
              }</strong>
            </div>

            <div class="cart-item-actions">
              <div class="cart-item-qty">
                <button data-cart-action="decrease" data-item-id="${escapeHtml(item.id)}" type="button">-</button>
                <span>${escapeHtml(String(item.quantity))}</span>
                <button data-cart-action="increase" data-item-id="${escapeHtml(item.id)}" type="button">+</button>
              </div>
              <button class="button button-secondary" data-cart-action="remove" data-item-id="${escapeHtml(
                item.id
              )}" type="button">
                Remove
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function handleBodyClick(event) {
    const addButton = event.target.closest("button[data-shop-action='add-to-cart']");

    if (addButton) {
      const itemId = addButton.dataset.itemId;
      const quantityInput = document.querySelector(
        `input[data-item-quantity="${cssEscape(itemId)}"]`
      );
      const quantity = Math.max(Number(quantityInput?.value || 1), 1);
      addToCart(itemId, quantity);
      return;
    }

    if (event.target.closest("button[data-shop-action='show-more']")) {
      state.visibleItemCount += VISIBLE_ITEM_STEP;
      renderCatalog();
      return;
    }

    const areaJumpButton = event.target.closest("button[data-area-jump]");

    if (areaJumpButton) {
      state.filters.area = areaJumpButton.dataset.areaJump || "";
      state.visibleItemCount = INITIAL_VISIBLE_ITEM_COUNT;

      if (elements.catalogAreaFilter) {
        elements.catalogAreaFilter.value = state.filters.area;
      }

      renderCatalog();
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const cartButton = event.target.closest("button[data-cart-action]");

    if (cartButton) {
      const itemId = cartButton.dataset.itemId;
      const action = cartButton.dataset.cartAction;

      if (action === "increase") {
        updateCartQuantity(itemId, 1);
      } else if (action === "decrease") {
        updateCartQuantity(itemId, -1);
      } else if (action === "remove") {
        removeFromCart(itemId);
      }
    }
  }

  function addToCart(itemId, quantity) {
    const item = state.catalog.find((record) => record.id === itemId);

    if (!item) {
      return;
    }

    const existing = state.cart.find((record) => record.id === itemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push({
        id: item.id,
        sku: item.sku || "",
        name: item.name,
        businessAreaId: item.businessAreaId,
        category: item.category || "General",
        itemType: item.itemType || "stock",
        unitPrice: Number(item.salesPrice || 0),
        quantity,
        notes: item.notes || ""
      });
    }

    persistCart();
    renderCart();
    openCartPanel();
  }

  function updateCartQuantity(itemId, delta) {
    const item = state.cart.find((record) => record.id === itemId);

    if (!item) {
      return;
    }

    item.quantity = Math.max(item.quantity + delta, 0);
    state.cart = state.cart.filter((record) => record.quantity > 0);
    persistCart();
    renderCart();
  }

  function removeFromCart(itemId) {
    state.cart = state.cart.filter((record) => record.id !== itemId);
    persistCart();
    renderCart();
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (state.cart.length === 0) {
      renderCheckoutMessage("error", "Add at least one item before sending the order.");
      return;
    }

    const payload = {
      customerName: normalizeText(elements.customerNameInput?.value),
      customerPhone: normalizeText(elements.customerPhoneInput?.value),
      customerEmail: normalizeText(elements.customerEmailInput?.value),
      deliveryMode: normalizeText(elements.deliveryModeInput?.value) || "Delivery",
      deliveryAddress: normalizeText(elements.deliveryAddressInput?.value),
      preferredDate: normalizeText(elements.preferredDateInput?.value),
      preferredTime: normalizeText(elements.preferredTimeInput?.value),
      paymentMethod: normalizeText(elements.paymentMethodInput?.value),
      notes: normalizeText(elements.orderNotesInput?.value),
      items: state.cart.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        businessAreaId: item.businessAreaId,
        category: item.category,
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes
      }))
    };

    if (!payload.customerName || !payload.customerPhone) {
      renderCheckoutMessage("error", "Customer name and phone number are required.");
      return;
    }

    renderCheckoutMessage("success", "Sending your OneRoot order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(Array.isArray(result.errors) ? result.errors[0] : "Unable to save order.");
      }

      const amountLine =
        result.includesQuoteItems && Number(result.totalAmount || 0) > 0
          ? `${formatCurrency(result.totalAmount)} plus quote-confirmed items`
          : result.includesQuoteItems
            ? "Quote request captured for staff confirmation"
            : formatCurrency(result.totalAmount || 0);

      renderCheckoutMessage(
        "success",
        `Order received. Your order number is <strong>${escapeHtml(
          result.orderNumber
        )}</strong>. Total captured: <strong>${escapeHtml(
          amountLine
        )}</strong>. You can track it on the tracking page using the same phone number.`
      );

      state.cart = [];
      persistCart();
      renderCart();

      if (elements.orderNotesInput) {
        elements.orderNotesInput.value = "";
      }
    } catch (error) {
      console.error(error);
      renderCheckoutMessage(
        "error",
        normalizeText(error.message) || "The order could not be sent right now."
      );
    }
  }

  async function handleTrackingSubmit(event) {
    event.preventDefault();

    const orderNumber = normalizeText(elements.trackingOrderNumber?.value).toUpperCase();
    const phone = normalizeText(elements.trackingPhoneNumber?.value);

    if (!orderNumber || !phone) {
      renderTrackingMessage("error", "Enter both the order number and phone number.");
      return;
    }

    renderTrackingMessage("success", "Checking your order...");
    hideTrackingResult();

    try {
      const url = new URL("/api/orders/track", window.location.origin);
      url.searchParams.set("orderNumber", orderNumber);
      url.searchParams.set("phone", phone);

      const response = await fetch(url.toString(), { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.ok || !result.order) {
        throw new Error(result.error || "No order was found for that order number and phone.");
      }

      renderTrackingMessage("success", `Order ${escapeHtml(orderNumber)} found.`);
      renderTrackingResult(result.order);
    } catch (error) {
      console.error(error);
      renderTrackingMessage("error", normalizeText(error.message) || "Order lookup failed.");
      hideTrackingResult();
    }
  }

  function renderTrackingResult(order) {
    if (!elements.trackingResult) {
      return;
    }

    const itemMarkup = Array.isArray(order.items)
      ? order.items
          .map(
            (item) => `
              <article class="timeline-item">
                <strong>${escapeHtml(item.name)}</strong>
                <p>${escapeHtml(
                  `${item.quantity} x ${
                    item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "Quote"
                  } • ${getAreaLabel(item.businessAreaId)}`
                )}</p>
              </article>
            `
          )
          .join("")
      : "";

    const historyMarkup = Array.isArray(order.statusHistory)
      ? order.statusHistory
          .map(
            (entry) => `
              <article class="timeline-item">
                <strong>${escapeHtml(formatStatusLabel(entry.status || "update"))}</strong>
                <p>${escapeHtml(formatDateTime(entry.at))}</p>
                <p>${escapeHtml(entry.note || "Status updated.")}</p>
              </article>
            `
          )
          .join("")
      : "";

    const totalLabel =
      order.includesQuoteItems && Number(order.totalAmount || 0) > 0
        ? `${formatCurrency(order.totalAmount)} plus quote-confirmed items`
        : order.includesQuoteItems
          ? "Quote request"
          : formatCurrency(order.totalAmount || 0);

    elements.trackingResult.innerHTML = `
      <div class="tracking-status">
        <span class="status-pill ${escapeHtml(getStatusClassName(order.status))}">
          ${escapeHtml(formatStatusLabel(order.status))}
        </span>
        <span class="status-pill ${escapeHtml(getStatusClassName(order.paymentStatus || "pending"))}">
          Payment: ${escapeHtml(formatStatusLabel(order.paymentStatus || "pending"))}
        </span>
        <strong>${escapeHtml(order.orderNumber)}</strong>
        <p>${escapeHtml(order.customerName || "Customer")} • ${escapeHtml(order.deliveryMode || "Delivery")}</p>
        <p>${escapeHtml(`Created ${formatDateTime(order.createdAt)} • Updated ${formatDateTime(order.updatedAt)}`)}</p>
        <p>${escapeHtml(`Order total: ${totalLabel}`)}</p>
        ${
          order.preferredDate || order.preferredTime
            ? `<p>${escapeHtml(
                `Preferred time: ${[
                  order.preferredDate ? formatDate(order.preferredDate) : "",
                  order.preferredTime || ""
                ]
                  .filter(Boolean)
                  .join(" at ")}`
              )}</p>`
            : ""
        }
      </div>

      <div class="timeline">
        <article class="timeline-item">
          <strong>Order Items</strong>
          <p>${escapeHtml(
            `${Array.isArray(order.items) ? order.items.length : 0} item${
              Array.isArray(order.items) && order.items.length === 1 ? "" : "s"
            } captured in this order.`
          )}</p>
        </article>
        ${itemMarkup}
      </div>

      <div class="timeline">
        <article class="timeline-item">
          <strong>Status History</strong>
          <p>Follow the latest progress below.</p>
        </article>
        ${historyMarkup || `<article class="timeline-item"><p>No history is available yet.</p></article>`}
      </div>
    `;

    elements.trackingResult.classList.remove("hidden");
  }

  function renderCheckoutMessage(type, html) {
    if (!elements.checkoutMessage) {
      return;
    }

    elements.checkoutMessage.innerHTML = html;
    elements.checkoutMessage.classList.remove("hidden", "checkout-message-success", "checkout-message-error");
    elements.checkoutMessage.classList.add(
      type === "error" ? "checkout-message-error" : "checkout-message-success"
    );
  }

  function renderTrackingMessage(type, html) {
    if (!elements.trackingMessage) {
      return;
    }

    elements.trackingMessage.innerHTML = html;
    elements.trackingMessage.classList.remove("hidden", "checkout-message-success", "checkout-message-error");
    elements.trackingMessage.classList.add(
      type === "error" ? "checkout-message-error" : "checkout-message-success"
    );
  }

  function hideTrackingResult() {
    if (!elements.trackingResult) {
      return;
    }

    elements.trackingResult.classList.add("hidden");
    elements.trackingResult.innerHTML = "";
  }

  function persistCart() {
    window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(state.cart));
  }

  function loadStoredCart() {
    try {
      const raw = window.localStorage.getItem(SHOP_CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => ({
          id: normalizeText(item.id),
          sku: normalizeText(item.sku),
          name: normalizeText(item.name),
          businessAreaId: normalizeText(item.businessAreaId),
          category: normalizeText(item.category),
          itemType: normalizeText(item.itemType) || "stock",
          unitPrice: Number(item.unitPrice || 0),
          quantity: Math.max(Number(item.quantity || 0), 0),
          notes: normalizeText(item.notes)
        }))
        .filter((item) => item.id && item.name && item.businessAreaId && item.quantity > 0);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function loadStoredCustomerDraft() {
    try {
      const raw = window.localStorage.getItem(SHOP_CUSTOMER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  function persistCustomerDraftFromForm() {
    if (!elements.checkoutForm) {
      return;
    }

    state.customerDraft = {
      customerName: normalizeText(elements.customerNameInput?.value),
      customerPhone: normalizeText(elements.customerPhoneInput?.value),
      customerEmail: normalizeText(elements.customerEmailInput?.value),
      deliveryMode: normalizeText(elements.deliveryModeInput?.value),
      deliveryAddress: normalizeText(elements.deliveryAddressInput?.value),
      preferredDate: normalizeText(elements.preferredDateInput?.value),
      preferredTime: normalizeText(elements.preferredTimeInput?.value),
      paymentMethod: normalizeText(elements.paymentMethodInput?.value),
      notes: normalizeText(elements.orderNotesInput?.value)
    };

    window.localStorage.setItem(
      SHOP_CUSTOMER_STORAGE_KEY,
      JSON.stringify(state.customerDraft)
    );
  }

  function restoreCustomerDraftIntoForm() {
    if (!elements.checkoutForm || !state.customerDraft) {
      return;
    }

    setInputValue(elements.customerNameInput, state.customerDraft.customerName);
    setInputValue(elements.customerPhoneInput, state.customerDraft.customerPhone);
    setInputValue(elements.customerEmailInput, state.customerDraft.customerEmail);
    setInputValue(elements.deliveryModeInput, state.customerDraft.deliveryMode || "Delivery");
    setInputValue(elements.deliveryAddressInput, state.customerDraft.deliveryAddress);
    setInputValue(elements.preferredDateInput, state.customerDraft.preferredDate);
    setInputValue(elements.preferredTimeInput, state.customerDraft.preferredTime);
    setInputValue(elements.orderNotesInput, state.customerDraft.notes);
  }

  function toggleCartPanel() {
    elements.cartPanel?.classList.toggle("hidden");
  }

  function openCartPanel() {
    elements.cartPanel?.classList.remove("hidden");
  }

  function closeCartPanel() {
    elements.cartPanel?.classList.add("hidden");
  }

  function getComparablePrice(item) {
    return Number(item.salesPrice || 0);
  }

  function getAreaLabel(areaId) {
    return (
      state.businessAreas.find((area) => area.id === areaId)?.shortLabel ||
      state.businessAreas.find((area) => area.id === areaId)?.label ||
      areaId ||
      "Business Area"
    );
  }

  function getStatusClassName(value) {
    return `status-${normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  function formatStatusLabel(value) {
    return normalizeText(value)
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
      .format(Number(amount || 0))
      .replace("GHS", "GH¢");
  }

  function formatDate(value) {
    if (!value) {
      return "Not set";
    }

    const normalized = `${value}T00:00:00`;
    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(parsed);
  }

  function formatDateTime(value) {
    if (!value) {
      return "Not set";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(parsed);
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(String(value || ""));
    }

    return String(value || "").replace(/"/g, '\\"');
  }

  function setInputValue(element, value) {
    if (!element) {
      return;
    }

    element.value = normalizeText(value);
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }
})();
