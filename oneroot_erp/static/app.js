(function () {
  const searchInput = document.getElementById("pos-search");
  const barcodeInput = document.getElementById("pos-barcode");
  const clearSearchButton = document.getElementById("pos-clear-search");
  const resultsContainer = document.getElementById("pos-results");
  const resultCountNode = document.getElementById("pos-result-count");
  const resultsPageNode = document.getElementById("pos-results-page");
  const resultsHelperNode = document.getElementById("pos-results-helper");
  const resultsPrevButton = document.getElementById("pos-results-prev");
  const resultsNextButton = document.getElementById("pos-results-next");
  const categoryButtonNodes = Array.from(document.querySelectorAll("[data-category]"));
  const paymentButtonNodes = Array.from(document.querySelectorAll("[data-payment-method]"));
  const cartContainer = document.getElementById("pos-cart-lines");
  const totalNodes = document.querySelectorAll("[data-pos-total]");
  const cartItemCountNode = document.getElementById("pos-cart-item-count");
  const cartItemCountDuplicateNode = document.getElementById("pos-cart-item-count-duplicate");
  const counterTotalNode = document.getElementById("pos-counter-total");
  const ledgerTotalNode = document.getElementById("pos-ledger-total");
  const areaLabelNode = document.getElementById("pos-area-label");
  const paymentMixNode = document.getElementById("pos-payment-mix");
  const paymentLabelNode = document.getElementById("pos-payment-label");
  const summaryDateNode = document.getElementById("pos-summary-date");
  const summaryTotalNode = document.getElementById("pos-summary-total");
  const closeoutMetaNode = document.getElementById("pos-closeout-meta");
  const closeoutButton = document.getElementById("pos-closeout");
  const orderDateInput = document.getElementById("pos-order-date");
  const areaFilterInput = document.getElementById("pos-area-filter");
  const paymentMethodInput = document.getElementById("pos-payment-method");
  const customerNameInput = document.getElementById("pos-customer-name");
  const customerPhoneInput = document.getElementById("pos-customer-phone");
  const notesInput = document.getElementById("pos-notes");
  const saveButton = document.getElementById("pos-save");
  const clearButton = document.getElementById("pos-clear");
  const historyBody = document.getElementById("pos-history-body");
  const statusNode = document.getElementById("pos-status");
  const lastOrderNode = document.getElementById("pos-last-order-number");
  const lastReceiptLink = document.getElementById("pos-last-receipt");

  if (!searchInput || !resultsContainer || !cartContainer || !saveButton) {
    return;
  }

  const state = {
    cart: [],
    searchTimer: null,
    latestResults: [],
    activeSearchRequest: 0,
    selectedCategory: "",
    resultPage: 0
  };
  const initiallyActiveCategory = categoryButtonNodes.find((button) => button.classList.contains("is-active"));
  state.selectedCategory = initiallyActiveCategory?.dataset.category || "";
  const RESULTS_PER_PAGE = 8;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2
    }).format(Number(value || 0)).replace("GHS", "GH₵");
  }

  function setStatus(message, type = "info") {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = message || "";
    statusNode.className = type === "error" ? "danger-text" : "muted";
  }

  function getSelectedArea() {
    return areaFilterInput?.value?.trim() || "";
  }

  function getSelectedCategory() {
    return state.selectedCategory || "";
  }

  function getOrderDate() {
    return orderDateInput?.value || new Date().toISOString().slice(0, 10);
  }

  function setActiveButton(buttons, predicate) {
    buttons.forEach((button) => {
      button.classList.toggle("is-active", Boolean(predicate(button)));
    });
  }

  function getCartTotal() {
    return state.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  function getCartItemCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function setLastReceipt(order) {
    if (lastOrderNode) {
      lastOrderNode.textContent = order?.orderNumber || "No sale saved yet";
    }
    if (!lastReceiptLink) {
      return;
    }
    if (order?.receiptUrl) {
      lastReceiptLink.href = order.receiptUrl;
      lastReceiptLink.classList.remove("is-disabled");
      lastReceiptLink.removeAttribute("aria-disabled");
    } else {
      lastReceiptLink.href = "#";
      lastReceiptLink.classList.add("is-disabled");
      lastReceiptLink.setAttribute("aria-disabled", "true");
    }
  }

  function renderCart() {
    const total = getCartTotal();
    const itemCount = getCartItemCount();

    totalNodes.forEach((node) => {
      node.textContent = formatCurrency(total);
    });
    if (cartItemCountNode) {
      cartItemCountNode.textContent = String(itemCount);
    }
    if (cartItemCountDuplicateNode) {
      cartItemCountDuplicateNode.textContent = String(itemCount);
    }
    if (saveButton) {
      saveButton.disabled = state.cart.length === 0;
    }

    cartContainer.innerHTML = "";
    if (!state.cart.length) {
      cartContainer.innerHTML = "<div class='muted'>No items added yet. Search or scan a product to start this sale.</div>";
      return;
    }

    state.cart.forEach((item) => {
      const line = document.createElement("div");
      line.className = "stack-list-item pos-cart-line";
      line.innerHTML = `
        <div class="pos-cart-line-head">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="muted">${escapeHtml(item.businessAreaLabel)}${item.category ? ` · ${escapeHtml(item.category)}` : ""}</div>
          </div>
          <strong>${formatCurrency(item.quantity * item.unitPrice)}</strong>
        </div>
        <div class="pos-cart-line-controls">
          <div class="pos-qty-cluster">
            <button class="button subtle pos-qty-btn" type="button" data-action="decrease">-</button>
            <input type="number" min="1" step="1" value="${escapeHtml(item.quantity)}">
            <button class="button subtle pos-qty-btn" type="button" data-action="increase">+</button>
          </div>
          <span class="muted">${formatCurrency(item.unitPrice)} each</span>
          <button class="text-button danger-text" type="button" data-action="remove">Remove</button>
        </div>
      `;

      line.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.getAttribute("data-action");
          if (action === "remove") {
            state.cart = state.cart.filter((entry) => entry.productId !== item.productId);
          }
          if (action === "increase") {
            item.quantity += 1;
          }
          if (action === "decrease") {
            item.quantity = Math.max(item.quantity - 1, 1);
          }
          renderCart();
        });
      });

      line.querySelector("input").addEventListener("input", (event) => {
        const nextQuantity = Math.max(Number(event.target.value || 1), 1);
        item.quantity = Number.isFinite(nextQuantity) ? nextQuantity : 1;
        renderCart();
      });

      cartContainer.appendChild(line);
    });
  }

  function addProduct(product, quantity = 1) {
    const existing = state.cart.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      state.cart.push({
        productId: product.id,
        name: product.name,
        category: product.category,
        businessAreaLabel: product.businessAreaLabel,
        quantity,
        unitPrice: Number(product.salesPrice || 0)
      });
    }
    renderCart();
    setStatus(`${product.name} added to cart.`);
  }

  function renderResults(products, { resetPage = true } = {}) {
    state.latestResults = Array.isArray(products) ? products : [];
    if (resetPage) {
      state.resultPage = 0;
    }
    const totalResults = state.latestResults.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE));
    state.resultPage = Math.min(state.resultPage, totalPages - 1);
    const startIndex = state.resultPage * RESULTS_PER_PAGE;
    const visibleResults = state.latestResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);

    if (resultCountNode) {
      resultCountNode.textContent = totalResults
        ? `${totalResults} match${totalResults === 1 ? "" : "es"}`
        : "No products found";
    }
    if (resultsPageNode) {
      resultsPageNode.textContent = totalResults ? `Page ${state.resultPage + 1} of ${totalPages}` : "No matches";
    }
    if (resultsHelperNode) {
      resultsHelperNode.textContent = totalResults
        ? `Showing ${startIndex + 1}-${Math.min(startIndex + visibleResults.length, totalResults)} of ${totalResults}.`
        : "Try another name, SKU, barcode, or serving area.";
    }
    if (resultsPrevButton) {
      resultsPrevButton.disabled = state.resultPage <= 0;
    }
    if (resultsNextButton) {
      resultsNextButton.disabled = state.resultPage >= totalPages - 1 || totalResults === 0;
    }

    if (!totalResults) {
      resultsContainer.innerHTML = "<div class='mini-card'><strong>No matching item</strong><small>Try another name, SKU, barcode, or serving area.</small></div>";
      return;
    }

    resultsContainer.innerHTML = visibleResults
      .map((product) => `
        <button class="pos-result-row" type="button" data-product='${JSON.stringify(product).replaceAll("'", "&apos;")}'>
          <span class="pos-result-primary">
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.businessAreaLabel)}${product.category ? ` · ${escapeHtml(product.category)}` : ""}</small>
          </span>
          <span class="pos-result-meta">
            <strong>${formatCurrency(product.salesPrice)}</strong>
            <small>${product.trackInventory ? `Stock ${escapeHtml(product.quantityOnHand)}` : "Service item"}</small>
          </span>
          <span class="pos-result-action">Add</span>
        </button>
      `)
      .join("");

    resultsContainer.querySelectorAll("[data-product]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = JSON.parse(button.getAttribute("data-product").replaceAll("&apos;", "'"));
        addProduct(product);
      });
    });
  }

  async function fetchProducts(query) {
    const requestId = state.activeSearchRequest + 1;
    state.activeSearchRequest = requestId;
    const url = new URL("/app/api/pos/products", window.location.origin);
    const area = getSelectedArea();
    const category = getSelectedCategory();
    if (query) {
      url.searchParams.set("q", query);
    }
    if (area) {
      url.searchParams.set("area", area);
    }
    if (category) {
      url.searchParams.set("category", category);
    }

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    const payload = await response.json();
    if (requestId !== state.activeSearchRequest) {
      return [];
    }
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "Products could not be loaded.", "error");
      return [];
    }
    return payload.products || [];
  }

  async function searchProducts(query) {
    renderResults(await fetchProducts(query));
  }

  async function addByBarcode(rawCode) {
    const code = String(rawCode || "").trim();
    if (!code) {
      return;
    }
    setStatus("Looking up scanned item...");
    const products = await fetchProducts(code);
    renderResults(products);
    const exactMatch = products.find((product) => {
      const barcode = String(product.barcode || "").trim().toLowerCase();
      const sku = String(product.sku || "").trim().toLowerCase();
      const name = String(product.name || "").trim().toLowerCase();
      const needle = code.toLowerCase();
      return barcode === needle || sku === needle || name === needle;
    }) || products[0];

    if (!exactMatch) {
      setStatus(`No product matched ${code}.`, "error");
      return;
    }

    addProduct(exactMatch);
    if (barcodeInput) {
      barcodeInput.value = "";
    }
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  function renderPaymentMix(paymentMix) {
    if (!paymentMixNode) {
      return;
    }
    const entries = Object.entries(paymentMix || {});
    paymentMixNode.textContent = entries.length
      ? entries.map(([label, amount]) => `${label} ${formatCurrency(amount)}`).join(" · ")
      : "No payment mix recorded yet.";
  }

  function buildHistoryRowMarkup(order) {
    return `
      <tr>
        <td>${escapeHtml(order.orderNumber)}</td>
        <td>${escapeHtml(order.orderDate)}</td>
        <td>${escapeHtml(order.customerName || "Walk-in")}</td>
        <td>${escapeHtml(order.itemCount)}</td>
        <td>${escapeHtml(order.paymentMethod || "Unspecified")}</td>
        <td>${formatCurrency(order.totalAmount)}</td>
        <td>
          <div class="row-actions pos-history-actions">
            ${order.receiptUrl ? `<a class="table-link" href="${escapeHtml(order.receiptUrl)}" target="_blank" rel="noopener">Receipt</a>` : ""}
            ${order.id ? `<button class="text-button danger-text" type="button" data-action="delete-order" data-order-id="${escapeHtml(order.id)}" data-order-number="${escapeHtml(order.orderNumber)}">Delete</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  }

  function renderHistory(orders) {
    if (!historyBody) {
      return;
    }
    if (!orders || !orders.length) {
      historyBody.innerHTML = "<tr><td colspan='7' class='history-empty'>No POS orders saved yet.</td></tr>";
      return;
    }
    historyBody.innerHTML = orders.map(buildHistoryRowMarkup).join("");
  }

  function renderSummary(summary) {
    if (!summary) {
      return;
    }
    if (counterTotalNode) {
      counterTotalNode.textContent = formatCurrency(summary.totalAmount);
    }
    if (ledgerTotalNode) {
      ledgerTotalNode.textContent = formatCurrency(summary.dailySalesLedgerTotal);
    }
    if (areaLabelNode) {
      areaLabelNode.textContent = summary.areaLabel || "All POS Areas";
    }
    if (summaryDateNode) {
      summaryDateNode.textContent = summary.orderDate;
    }
    if (summaryTotalNode) {
      summaryTotalNode.textContent = formatCurrency(summary.totalAmount);
    }
    if (closeoutMetaNode) {
      closeoutMetaNode.textContent = summary.lastCloseout
        ? `Last closeout saved ${String(summary.lastCloseout.closedAt || "").slice(0, 16).replace("T", " ")} by ${summary.lastCloseout.closedBy || "staff"}.`
        : "No closeout has been saved for this counter day yet.";
    }
    if (closeoutButton) {
      closeoutButton.textContent = summary.lastCloseout ? "Update Close Counter" : "Close Counter";
    }
    renderPaymentMix(summary.paymentMix);
    renderHistory(summary.orders || []);
  }

  async function refreshSummary() {
    const url = new URL("/app/api/pos/summary", window.location.origin);
    url.searchParams.set("orderDate", getOrderDate());
    const area = getSelectedArea();
    if (area) {
      url.searchParams.set("area", area);
    }

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatus(payload.error || "POS summary could not be loaded.", "error");
      return;
    }
    renderSummary(payload.summary);
  }

  function resetDraftFields() {
    if (customerNameInput) {
      customerNameInput.value = "";
    }
    if (customerPhoneInput) {
      customerPhoneInput.value = "";
    }
    if (notesInput) {
      notesInput.value = "";
    }
  }

  function queueProductSearch() {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(() => {
      void searchProducts(searchInput.value.trim());
    }, 120);
  }

  async function deleteSavedOrder(orderId, orderNumber) {
    const response = await fetch(`/app/api/pos/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      setStatus(result.error || "The POS order could not be deleted.", "error");
      return;
    }
    if (lastOrderNode?.textContent === orderNumber) {
      setLastReceipt(null);
    }
    await refreshSummary();
    setStatus(`${result.deleted.orderNumber} deleted and added to the audit trail.`);
  }

  searchInput.addEventListener("input", queueProductSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && state.latestResults.length === 1) {
      event.preventDefault();
      addProduct(state.latestResults[0]);
      searchInput.select();
    }
  });

  barcodeInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    void addByBarcode(barcodeInput.value);
  });

  clearSearchButton?.addEventListener("click", () => {
    searchInput.value = "";
    if (barcodeInput) {
      barcodeInput.value = "";
    }
    void searchProducts("");
    searchInput.focus();
  });

  areaFilterInput?.addEventListener("change", () => {
    void searchProducts(searchInput.value.trim());
    void refreshSummary();
  });

  categoryButtonNodes.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category || "";
      setActiveButton(categoryButtonNodes, (entry) => entry === button);
      void searchProducts(searchInput.value.trim());
    });
  });

  resultsPrevButton?.addEventListener("click", () => {
    if (state.resultPage <= 0) {
      return;
    }
    state.resultPage -= 1;
    renderResults(state.latestResults, { resetPage: false });
  });

  resultsNextButton?.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(state.latestResults.length / RESULTS_PER_PAGE));
    if (state.resultPage >= totalPages - 1) {
      return;
    }
    state.resultPage += 1;
    renderResults(state.latestResults, { resetPage: false });
  });

  orderDateInput?.addEventListener("change", () => {
    void refreshSummary();
  });

  paymentMethodInput?.addEventListener("change", () => {
    if (paymentLabelNode) {
      paymentLabelNode.textContent = paymentMethodInput.value || "Cash";
    }
    setActiveButton(paymentButtonNodes, (button) => button.dataset.paymentMethod === paymentMethodInput.value);
  });

  paymentButtonNodes.forEach((button) => {
    button.addEventListener("click", () => {
      const paymentMethod = button.dataset.paymentMethod || "Cash";
      if (paymentMethodInput) {
        paymentMethodInput.value = paymentMethod;
        paymentMethodInput.dispatchEvent(new Event("change"));
      }
    });
  });

  clearButton?.addEventListener("click", () => {
    state.cart = [];
    renderCart();
    setStatus("Cart cleared.");
  });

  closeoutButton?.addEventListener("click", async () => {
    closeoutButton.disabled = true;
    setStatus("Saving counter closeout...");
    const response = await fetch("/app/api/pos/closeout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        orderDate: getOrderDate(),
        areaId: getSelectedArea()
      })
    });
    const result = await response.json();
    closeoutButton.disabled = false;
    if (!response.ok || !result.ok) {
      setStatus(result.error || "The closeout could not be saved.", "error");
      return;
    }
    renderSummary(result.summary);
    setStatus(`Counter closeout saved for ${result.closeout.areaLabel} at ${formatCurrency(result.closeout.totalAmount)}.`);
  });

  historyBody?.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-action="delete-order"]');
    if (!button) {
      return;
    }
    const orderId = button.getAttribute("data-order-id") || "";
    const orderNumber = button.getAttribute("data-order-number") || "This POS order";
    if (!orderId) {
      return;
    }
    if (!window.confirm(`Delete ${orderNumber}? This will remove it from POS and re-sync daily sales.`)) {
      return;
    }
    button.disabled = true;
    setStatus(`Deleting ${orderNumber}...`);
    try {
      await deleteSavedOrder(orderId, orderNumber);
    } finally {
      button.disabled = false;
    }
  });

  saveButton.addEventListener("click", async () => {
    if (!state.cart.length) {
      setStatus("Add at least one item before saving.", "error");
      return;
    }

    saveButton.disabled = true;
    setStatus("Saving sale...");

    const payload = {
      orderDate: getOrderDate(),
      paymentMethod: paymentMethodInput?.value,
      customerName: customerNameInput?.value,
      customerPhone: customerPhoneInput?.value,
      notes: notesInput?.value,
      items: state.cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    const response = await fetch("/app/api/pos/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    saveButton.disabled = false;

    if (!response.ok || !result.ok) {
      setStatus(result.error || "The sale could not be saved.", "error");
      return;
    }

    state.cart = [];
    renderCart();
    resetDraftFields();
    setLastReceipt(result.order || null);
    await refreshSummary();
    setStatus(`${result.orderNumber} saved at ${formatCurrency(result.totalAmount)}. Receipt is ready.`);
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/") {
      return;
    }
    const tagName = String(document.activeElement?.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tagName)) {
      return;
    }
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  });

  if (paymentLabelNode && paymentMethodInput) {
    paymentLabelNode.textContent = paymentMethodInput.value || "Cash";
  }
  if (paymentMethodInput) {
    setActiveButton(paymentButtonNodes, (button) => button.dataset.paymentMethod === paymentMethodInput.value);
  }

  setLastReceipt(null);
  renderCart();
  void searchProducts(searchInput.value.trim());
  void refreshSummary();
})();
