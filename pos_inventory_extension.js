(function initPosInventoryModule() {
  const PRODUCT_CATALOG = Array.isArray(window.ONE_ROOT_PRODUCT_CATALOG)
    ? window.ONE_ROOT_PRODUCT_CATALOG
    : [];
  const PRODUCT_CATALOG_VERSION =
    normalizeText(window.ONE_ROOT_PRODUCT_CATALOG_VERSION) || "20260718a";
  const POS_ORDER_STORAGE_KEY = "oneroot-expense-register:pos-orders:v1";
  const INVENTORY_ITEM_STORAGE_KEY = "oneroot-expense-register:inventory-items:v1";
  const AUDIT_TRAIL_STORAGE_KEY = "oneroot-expense-register:audit-trail:v1";
  const POS_SYNC_SOURCE_TYPE = "pos-summary";
  const MANUAL_SALE_SOURCE_TYPE = "manual";
  const POS_SYNC_NOTE_PREFIX = "[POS Sync]";
  const POS_CATALOG_WORKBOOK_PATH =
    "./outputs/oneroot-products-pos/OneRoot_Products_Cleaned.xlsx?v=20260718a";
  const ONEROOT_LOGO_PATH = new URL("./assets/oneroot-logo.png?v=20260719a", window.location.href).href;
  const DEFAULT_POS_PAYMENT_METHOD = "Cash";
  const DEFAULT_REORDER_LEVEL = 5;
  const POS_CART_PREVIEW_LIMIT = 180;
  const POS_PRODUCT_GRID_LIMIT = 24;
  const POS_FREQUENT_PRODUCT_LIMIT = 10;
  const INVENTORY_LOW_STOCK_LIMIT = 10;
  const AUDIT_TRAIL_LIMIT = 2500;
  const AUDIT_BULK_CHANGE_THRESHOLD = 6;
  const uiFocusState = {
    pos: "",
    inventory: ""
  };
  const auditContext = {
    snapshotByStateKey: new Map(),
    isRefreshingSnapshots: false
  };

  const originalRender = render;
  const originalRenderDataHub = renderDataHub;
  const originalRefreshStateFromStorage = refreshStateFromStorage;
  const originalPersistAllData = persistAllData;
  const originalExportFullBackup = exportFullBackup;
  const originalHandleBackupImportFile = handleBackupImportFile;
  const originalSanitizeImportedBackup = sanitizeImportedBackup;
  const originalGetWorkspaceRecordTotal = getWorkspaceRecordTotal;
  const originalBuildHostedWorkspaceSyncPayload =
    typeof buildHostedWorkspaceSyncPayload === "function"
      ? buildHostedWorkspaceSyncPayload
      : null;
  const originalMergeHostedWorkspaceImport =
    typeof mergeHostedWorkspaceImport === "function" ? mergeHostedWorkspaceImport : null;
  const originalHandleDynamicModuleClick = handleDynamicModuleClick;
  const originalHandleDynamicModuleSubmit = handleDynamicModuleSubmit;
  const originalHandleDynamicModuleInput = handleDynamicModuleInput;
  const originalHandleDynamicModuleChange = handleDynamicModuleChange;
  const originalBuildRecentActivities = buildRecentActivities;
  const originalBuildGlobalSearchResults = buildGlobalSearchResults;
  const originalGetSearchModuleOptions = getSearchModuleOptions;
  const originalExportCurrentView = exportCurrentView;
  const originalStartEditingSale = startEditingSale;
  const originalDeleteSale = deleteSale;
  const originalSanitizeStoredSale = sanitizeStoredSale;

  extendViewMeta();
  extendRolePresets();
  extendStorageKeys();

  if (typeof originalBuildHostedWorkspaceSyncPayload === "function") {
    buildHostedWorkspaceSyncPayload = function patchedBuildHostedWorkspaceSyncPayload(
      source = state,
      options = {}
    ) {
      const payload = originalBuildHostedWorkspaceSyncPayload(source, options);
      const workspace = source && typeof source === "object" ? source : state;

      payload.workspace.posOrders = Array.isArray(workspace.posOrders) ? workspace.posOrders : [];
      payload.workspace.inventoryItems = Array.isArray(workspace.inventoryItems)
        ? workspace.inventoryItems
        : [];
      payload.workspace.auditTrail = Array.isArray(workspace.auditTrail)
        ? workspace.auditTrail
        : [];

      return payload;
    };
  }

  if (typeof originalMergeHostedWorkspaceImport === "function") {
    mergeHostedWorkspaceImport = function patchedMergeHostedWorkspaceImport(imported) {
      const nextImported = imported && typeof imported === "object" ? imported : {};
      const result = originalMergeHostedWorkspaceImport(nextImported);

      state.posOrders = mergePosOrders(state.posOrders, nextImported.posOrders || []);
      state.inventoryItems = mergeInventoryItems(
        state.inventoryItems,
        nextImported.inventoryItems || []
      );
      state.auditTrail = mergeAuditTrailEntries(
        state.auditTrail,
        nextImported.auditTrail || []
      );

      if (typeof reconcilePosGeneratedSales === "function") {
        reconcilePosGeneratedSales({ persist: false });
      }

      if (typeof primeAuditSnapshots === "function") {
        primeAuditSnapshots();
      }

      return result;
    };
  }

  sanitizeStoredSale = function patchedSanitizeStoredSale(sale) {
    const sanitized = originalSanitizeStoredSale(sale);

    if (!sanitized) {
      return null;
    }

    const sourceType = normalizeSaleSourceType(
      sale?.sourceType ||
        sale?.source ||
        (normalizeText(sale?.notes).startsWith(POS_SYNC_NOTE_PREFIX)
          ? POS_SYNC_SOURCE_TYPE
          : MANUAL_SALE_SOURCE_TYPE)
    );

    return {
      ...sanitized,
      sourceType,
      sourceLabel:
        sourceType === POS_SYNC_SOURCE_TYPE ? "POS Sync" : "Manual Daily Sales",
      linkedPosAreaDateKey:
        normalizeText(sale?.linkedPosAreaDateKey || sale?.posSyncKey) ||
        (sourceType === POS_SYNC_SOURCE_TYPE
          ? buildPosAreaDateKey(sanitized.date, sanitized.businessAreaId)
          : "")
    };
  };

  buildSalesMergeKey = function patchedBuildSalesMergeKey(sale) {
    return [
      sale.date,
      sale.businessAreaId,
      normalizeSaleSourceType(sale.sourceType),
      normalizeText(sale.notes).toLowerCase()
    ].join("|");
  };

  state.sales = sortSales(
    state.sales.map((sale) => sanitizeStoredSale(sale)).filter(Boolean)
  );
  if (typeof isHostedWorkspaceEnvironment === "function" && isHostedWorkspaceEnvironment()) {
    state.inventoryItems = Array.isArray(state.inventoryItems) ? state.inventoryItems : [];
    state.posOrders = Array.isArray(state.posOrders) ? state.posOrders : [];
    state.auditTrail = Array.isArray(state.auditTrail) ? state.auditTrail : [];
  } else {
    state.inventoryItems = loadInventoryItems();
    state.posOrders = loadPosOrders();
    state.auditTrail = loadAuditTrail();
  }
  state.editingPosOrderId = null;
  state.editingInventoryItemId = null;
  state.posDraft = createEmptyPosDraft();
  state.posFilters = createDefaultPosFilters();
  state.inventoryDraft = createEmptyInventoryDraft();
  state.inventoryFilters = createDefaultInventoryFilters();
  state.auditFilters = createDefaultAuditFilters();

  document.body.addEventListener("focusin", trackModuleFocus);
  document.body.addEventListener("keydown", handleModuleKeydown);

  if (!(typeof isHostedWorkspaceEnvironment === "function" && isHostedWorkspaceEnvironment())) {
    reconcilePosGeneratedSales({ persist: true });
  }
  initializeAuditTrailHooks();
  primeAuditSnapshots();

  render = function patchedRender() {
    originalRender();
    renderPosPage();
    renderInventoryPage();
    renderAuditTrailPage();
  };

  renderDataHub = function patchedRenderDataHub() {
    originalRenderDataHub();

    if (elements.dataHubCounts) {
      elements.dataHubCounts.insertAdjacentHTML(
        "beforeend",
        `
          <article class="module-card">
            <strong>POS Orders</strong>
            <span class="module-meta">${escapeHtml(String(state.posOrders.length))} stored</span>
          </article>
          <article class="module-card">
            <strong>Inventory Items</strong>
            <span class="module-meta">${escapeHtml(String(state.inventoryItems.length))} catalogued</span>
          </article>
          <article class="module-card">
            <strong>Audit Trail</strong>
            <span class="module-meta">${escapeHtml(String(state.auditTrail.length))} log entr${
      state.auditTrail.length === 1 ? "y" : "ies"
    }</span>
          </article>
        `
      );
    }

    if (elements.workbookStatusText) {
      elements.workbookStatusText.textContent = `${elements.workbookStatusText.textContent} POS orders now sync automatically into Daily Sales, and the product catalog has been cleaned into a separate POS / inventory workbook for stock setup and review.`;
    }

    if (elements.workbookImportHintText) {
      elements.workbookImportHintText.textContent = `${elements.workbookImportHintText.textContent} POS orders and inventory items are preserved through full app backup export/import, while the cleaned product catalog workbook is available as a download for stock review and setup.`;
    }
  };

  refreshStateFromStorage = function patchedRefreshStateFromStorage(options = {}) {
    originalRefreshStateFromStorage(options);
    state.sales = sortSales(
      state.sales.map((sale) => sanitizeStoredSale(sale)).filter(Boolean)
    );

    if (typeof isHostedWorkspaceEnvironment === "function" && isHostedWorkspaceEnvironment()) {
      state.inventoryItems = Array.isArray(state.inventoryItems)
        ? sortInventoryItems(state.inventoryItems)
        : [];
      state.posOrders = Array.isArray(state.posOrders) ? sortPosOrders(state.posOrders) : [];
      state.auditTrail = Array.isArray(state.auditTrail) ? sortAuditTrail(state.auditTrail) : [];
      primeAuditSnapshots();
      return;
    }

    state.inventoryItems = loadInventoryItems();
    state.posOrders = loadPosOrders();
    state.auditTrail = loadAuditTrail();
    reconcilePosGeneratedSales({ persist: false });
    primeAuditSnapshots();
  };

  persistAllData = function patchedPersistAllData() {
    originalPersistAllData();
    persistPosOrders();
    persistInventoryItems();
    persistAuditTrail();
  };

  exportFullBackup = async function patchedExportFullBackup() {
    const payload = {
      schemaVersion: 2,
      app: "OneRoot Operations App",
      exportedAt: new Date().toISOString(),
      settings: {
        currency: state.currency,
        activeUserId: state.activeUserId
      },
      workspace: {
        expenses: state.expenses,
        budgets: state.budgets,
        sales: state.sales,
        rentals: state.rentals,
        pettyCash: state.pettyCash,
        pettyCashBudgets: state.pettyCashBudgets,
        salaryRecords: state.salaryRecords,
        cashbookEntries: state.cashbookEntries,
        purchaseOrders: state.purchaseOrders,
        laundryTickets: state.laundryTickets,
        equipmentRentalBookings: state.equipmentRentalBookings,
        securityDepositRecords: state.securityDepositRecords,
        ledgerEntries: state.ledgerEntries,
        mobileMoneyReconciliations: state.mobileMoneyReconciliations,
        suppliers: state.suppliers,
        assetRecords: state.assetRecords,
        forecastPlans: state.forecastPlans,
        recurringControls: state.recurringControls,
        maintenanceRecords: state.maintenanceRecords,
        userProfiles: state.userProfiles,
        posOrders: state.posOrders,
        inventoryItems: state.inventoryItems,
        auditTrail: state.auditTrail
      }
    };

    const saved = await saveTextFile(
      `oneroot-operations-backup-${dateStamp()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8;"
    );

    if (saved) {
      appendAuditEntry({
        moduleKey: "data-hub",
        moduleLabel: "Data Hub",
        action: "export",
        title: "Full backup exported",
        detail: `Workspace backup exported with ${getWorkspaceRecordTotal(payload.workspace)} record${
          getWorkspaceRecordTotal(payload.workspace) === 1 ? "" : "s"
        }.`,
        entryCount: getWorkspaceRecordTotal(payload.workspace),
        view: "data-hub"
      });
      showToast("Full app backup exported.");
    }
  };

  sanitizeImportedBackup = function patchedSanitizeImportedBackup(payload) {
    const imported = originalSanitizeImportedBackup(payload);
    const root = payload && typeof payload === "object" ? payload : {};
    const workspace =
      root.workspace && typeof root.workspace === "object" ? root.workspace : root;

    imported.posOrders = sortPosOrders(
      sanitizeImportedCollection(workspace.posOrders, sanitizeStoredPosOrder)
    );
    imported.inventoryItems = mergeCatalogSeedWithStoredInventory(
      sanitizeImportedCollection(workspace.inventoryItems, sanitizeStoredInventoryItem)
    );
    imported.auditTrail = sortAuditTrail(
      sanitizeImportedCollection(workspace.auditTrail, sanitizeStoredAuditEntry)
    );

    return imported;
  };

  handleBackupImportFile = async function patchedHandleBackupImportFile(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const payload = JSON.parse(content);
      const imported = sanitizeImportedBackup(payload);
      const totalRecords = getWorkspaceRecordTotal(imported);
      const exportedDate = normalizeDateInput(imported.exportedAt);
      const sourceDate = exportedDate ? formatDisplayDate(exportedDate) : "unknown date";

      if (totalRecords === 0) {
        showToast("That backup file does not contain any valid records.");
        return;
      }

      const shouldReplace = window.confirm(
        `Replace the current workspace with this backup from ${sourceDate}? It will restore ${totalRecords} record${
          totalRecords === 1 ? "" : "s"
        }.`
      );

      if (!shouldReplace) {
        return;
      }

      state.expenses = imported.expenses;
      state.budgets = imported.budgets;
      state.sales = imported.sales;
      state.rentals = imported.rentals;
      state.pettyCash = imported.pettyCash;
      state.pettyCashBudgets = imported.pettyCashBudgets;
      state.salaryRecords = imported.salaryRecords;
      state.cashbookEntries = imported.cashbookEntries;
      state.purchaseOrders = imported.purchaseOrders;
      state.laundryTickets = imported.laundryTickets;
      state.equipmentRentalBookings = imported.equipmentRentalBookings;
      state.securityDepositRecords = imported.securityDepositRecords;
      state.ledgerEntries = imported.ledgerEntries;
      state.mobileMoneyReconciliations = imported.mobileMoneyReconciliations;
      state.suppliers = imported.suppliers;
      state.assetRecords = imported.assetRecords;
      state.forecastPlans = imported.forecastPlans;
      state.recurringControls = imported.recurringControls;
      state.maintenanceRecords = imported.maintenanceRecords;
      state.userProfiles = imported.userProfiles;
      state.posOrders = imported.posOrders;
      state.inventoryItems = imported.inventoryItems;
      state.auditTrail = imported.auditTrail;
      state.currency = imported.currency;
      state.activeUserId = imported.activeUserId;
      state.editingExpenseId = null;
      state.editingSalesId = null;
      state.editingRentalId = null;
      state.editingPettyCashId = null;
      state.editingSalaryId = null;
      state.editingCashbookId = null;
      state.editingPurchaseOrderId = null;
      state.editingLaundryTicketId = null;
      state.editingEquipmentRentalId = null;
      state.editingSecurityDepositId = null;
      state.editingLedgerId = null;
      state.editingMobileMoneyId = null;
      state.editingSupplierId = null;
      state.editingAssetId = null;
      state.editingForecastId = null;
      state.editingUserId = null;
      state.editingRecurringId = null;
      state.editingMaintenanceId = null;
      state.editingPosOrderId = null;
      state.editingInventoryItemId = null;
      state.posDraft = createEmptyPosDraft();
      state.inventoryDraft = createEmptyInventoryDraft();

      reconcilePosGeneratedSales({ persist: false });
      reconcileActiveUserProfile();
      primeAuditSnapshots();
      persistAllData();
      populateCurrencyOptions();
      resetExpenseForm({ silent: true });
      resetSalesForm({ silent: true });
      resetRentalForm({ silent: true });
      resetPettyCashForm({ silent: true });
      initializeBudgetPlanner();
      render();
      showToast(`Backup restored with ${totalRecords} record${totalRecords === 1 ? "" : "s"}.`);
      appendAuditEntry({
        moduleKey: "audit",
        moduleLabel: "Audit Trail",
        action: "restore",
        title: "Backup restored",
        detail: `Workspace restored from backup dated ${sourceDate}. ${totalRecords} record${
          totalRecords === 1 ? "" : "s"
        } were loaded.`,
        entryCount: totalRecords,
        view: "data-hub"
      });
    } catch (error) {
      console.error(error);
      showToast("That backup file could not be imported.");
    } finally {
      elements.backupImportFileInput.value = "";
    }
  };

  getWorkspaceRecordTotal = function patchedGetWorkspaceRecordTotal(workspace = state) {
    return (
      originalGetWorkspaceRecordTotal(workspace) +
      (workspace.posOrders?.length || 0) +
      (workspace.inventoryItems?.length || 0) +
      (workspace.auditTrail?.length || 0)
    );
  };

  buildRecentActivities = function patchedBuildRecentActivities() {
    const items = originalBuildRecentActivities();
    const posItems = state.posOrders.map((record) => ({
      sortKey: record.updatedAt || record.createdAt || record.orderDate,
      module: "POS",
      title: `${record.orderNumber} • ${formatCurrency(record.totalAmount)}`,
      detail: `${formatDisplayDate(record.orderDate)} • ${getPosOrderAreaLabel(record)}`,
      view: "pos"
    }));

    return [...items, ...posItems].sort((left, right) =>
      (right.sortKey || "").localeCompare(left.sortKey || "")
    );
  };

  buildGlobalSearchResults = function patchedBuildGlobalSearchResults() {
    const baseResults = originalBuildGlobalSearchResults();
    const query = normalizeText(state.searchFilters.query).toLowerCase();
    const moduleFilter = normalizeText(state.searchFilters.module).toLowerCase();
    const matchesModule = (view) =>
      moduleFilter === "" || moduleFilter === "all" || view === moduleFilter;
    const posResults = state.posOrders.map((record) => ({
      module: "POS",
      view: "pos",
      sortKey: record.updatedAt || record.orderDate,
      title: `${record.orderNumber} • ${formatCurrency(record.totalAmount)}`,
      detail: `${formatDisplayDate(record.orderDate)} • ${record.paymentMethod} • ${getPosOrderAreaLabel(record)}`,
      searchText: [
        record.orderNumber,
        record.customerName,
        record.customerPhone,
        getPosOrderAreaSummary(record),
        record.notes,
        record.items
          .map((item) => [item.name, item.sku, item.barcode, getBusinessArea(item.businessAreaId || record.businessAreaId).label].join(" "))
          .join(" ")
      ].join(" ")
    }));
    const inventoryResults = state.inventoryItems.map((record) => ({
      module: "Inventory",
      view: "inventory",
      sortKey: record.updatedAt || record.createdAt || record.name,
      title: `${record.name} • ${record.sku}`,
      detail: `${getBusinessArea(record.businessAreaId).shortLabel} • Qty ${formatInventoryQuantity(record.quantityOnHand)}`,
      searchText: [
        record.name,
        record.sku,
        record.category,
        record.notes,
        record.sourceCategory
      ].join(" ")
    }));
    const auditResults = state.auditTrail.map((record) => ({
      module: "Audit Trail",
      view: "audit",
      sortKey: record.timestamp,
      title: `${record.moduleLabel} • ${record.title}`,
      detail: `${formatTimestampLabel(record.timestamp)} • ${record.actorName || "Workspace User"}`,
      searchText: [
        record.moduleLabel,
        record.action,
        record.title,
        record.detail,
        record.actorName,
        record.actorRole
      ].join(" ")
    }));

    return [...baseResults, ...posResults, ...inventoryResults, ...auditResults]
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
    return [
      ...originalGetSearchModuleOptions(),
      { value: "pos", label: "POS" },
      { value: "inventory", label: "Inventory" },
      { value: "audit", label: "Audit Trail" }
    ];
  };

  exportCurrentView = async function patchedExportCurrentView() {
    if (state.currentView === "pos") {
      await exportPosOrdersCsv();
      return;
    }

    if (state.currentView === "inventory") {
      await exportInventoryCsv();
      return;
    }

    if (state.currentView === "audit") {
      await exportAuditTrailCsv();
      return;
    }

    await originalExportCurrentView();
  };

  getFilteredSales = function patchedGetFilteredSales() {
    const searchValue = normalizeText(elements.salesSearchFilter?.value).toLowerCase();
    const monthValue = normalizeMonthInput(elements.salesMonthFilter?.value);
    const areaValue = normalizeBusinessAreaId(elements.salesAreaFilter?.value);

    return state.sales.filter((sale) => {
      const haystack = [
        getBusinessArea(sale.businessAreaId).label,
        getBusinessArea(sale.businessAreaId).shortLabel,
        sale.sourceLabel,
        sale.notes
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchValue === "" || haystack.includes(searchValue);
      const matchesMonth = monthValue === "" || sale.date.startsWith(monthValue);
      const matchesArea = areaValue === "" || sale.businessAreaId === areaValue;

      return matchesSearch && matchesMonth && matchesArea;
    });
  };

  renderSalesPage = function patchedRenderSalesPage() {
    const sales = getFilteredSales();
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const averageSales = sales.length ? totalSales / sales.length : 0;
    const bestSales = [...sales].sort((left, right) => right.amount - left.amount)[0];
    const posSyncedCount = sales.filter(isPosSyncedSale).length;
    const manualCount = sales.length - posSyncedCount;

    elements.totalSalesValue.textContent = formatCurrency(totalSales);
    elements.salesEntriesValue.textContent = String(sales.length);
    elements.averageSalesValue.textContent = formatCurrency(averageSales);
    elements.bestSalesDayValue.textContent = bestSales
      ? `${formatDisplayDate(bestSales.date)} (${formatCurrency(bestSales.amount)})`
      : "None yet";

    elements.salesFootnote.textContent =
      sales.length === state.sales.length
        ? `${posSyncedCount} POS-synced entr${posSyncedCount === 1 ? "y" : "ies"} and ${manualCount} manual entr${
            manualCount === 1 ? "y" : "ies"
          }. Use manual Daily Sales only for amounts not already captured in POS.`
        : `Showing ${sales.length} sales entr${sales.length === 1 ? "y" : "ies"} in the current filter view.`;

    renderSalesTable(sales);
  };

  renderSalesTable = function patchedRenderSalesTable(sales) {
    if (sales.length === 0) {
      elements.salesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No daily sales records match the current view yet.
          </td>
        </tr>
      `;
      return;
    }

    elements.salesTableBody.innerHTML = sales
      .map((sale) => {
        const sourceLabel = sale.sourceLabel || "Manual Daily Sales";
        const actionMarkup = isPosSyncedSale(sale)
          ? `
              <button class="edit-btn" data-sales-action="open-pos" data-id="${escapeHtml(
                sale.id
              )}" type="button">
                Open POS
              </button>
            `
          : `
              <button class="edit-btn" data-sales-action="edit" data-id="${escapeHtml(
                sale.id
              )}" type="button">
                Edit
              </button>
              <button class="delete-btn" data-sales-action="delete" data-id="${escapeHtml(
                sale.id
              )}" type="button">
                Delete
              </button>
            `;

        return `
          <tr>
            <td>${formatDisplayDate(sale.date)}</td>
            <td><span class="tag tag-area">${escapeHtml(
              getBusinessArea(sale.businessAreaId).shortLabel
            )}</span></td>
            <td><span class="tag ${isPosSyncedSale(sale) ? "tag-pos" : "tag-manual"}">${escapeHtml(
              sourceLabel
            )}</span></td>
            <td class="amount-cell">${formatCurrency(sale.amount)}</td>
            <td>${escapeHtml(sale.notes || "—")}</td>
            <td>
              <div class="row-actions">
                ${actionMarkup}
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  handleSalesTableAction = function patchedHandleSalesTableAction(event) {
    const target = event.target.closest("button[data-sales-action]");

    if (!target) {
      return;
    }

    if (target.dataset.salesAction === "open-pos") {
      navigateTo("pos", { syncHash: true });
      state.posFilters.area = "";
      renderPosPage();
      showToast("This sales total is managed automatically from POS orders.");
      return;
    }

    if (target.dataset.salesAction === "edit") {
      startEditingSale(target.dataset.id);
    }

    if (target.dataset.salesAction === "delete") {
      deleteSale(target.dataset.id);
    }
  };

  startEditingSale = function patchedStartEditingSale(saleId) {
    const sale = state.sales.find((item) => item.id === saleId);

    if (sale && isPosSyncedSale(sale)) {
      navigateTo("pos", { syncHash: true });
      showToast("This sales total is generated from POS. Edit the related POS orders instead.");
      return;
    }

    originalStartEditingSale(saleId);
  };

  deleteSale = function patchedDeleteSale(saleId) {
    const sale = state.sales.find((item) => item.id === saleId);

    if (sale && isPosSyncedSale(sale)) {
      navigateTo("pos", { syncHash: true });
      showToast("POS-synced daily sales cannot be deleted here. Delete or edit the POS order instead.");
      return;
    }

    originalDeleteSale(saleId);
  };

  handleDynamicModuleClick = function patchedHandleDynamicModuleClick(event) {
    const target = event.target;
    const posActionTarget = target.closest("button[data-pos-action]");
    const inventoryActionTarget = target.closest("button[data-inventory-action]");
    const auditActionTarget = target.closest("button[data-audit-action]");

    if (posActionTarget) {
      const action = posActionTarget.dataset.posAction;
      const orderId = normalizeText(posActionTarget.dataset.id);
      const itemId = normalizeText(posActionTarget.dataset.itemId);
      const productId = normalizeText(posActionTarget.dataset.productId);
      const areaId = normalizeText(posActionTarget.dataset.areaId);
      const paymentMethod = normalizeText(posActionTarget.dataset.paymentMethod);
      const quantityValue = normalizeText(posActionTarget.dataset.quantity);

      if (action === "add-item") {
        addSelectedProductToPosCart();
      }

      if (action === "set-area") {
        applyPosBusinessAreaChoice(areaId);
      }

      if (action === "set-payment") {
        setPosPaymentMethod(paymentMethod);
      }

      if (action === "set-draft-quantity") {
        state.posDraft.quantity = Math.max(parsePositiveInteger(quantityValue), 1);
        renderPosPage();
      }

      if (action === "choose-product") {
        selectPosProduct(productId);
      }

      if (action === "quick-add-item") {
        const quantity =
          quantityValue === "draft" ? state.posDraft.quantity : Math.max(parsePositiveInteger(quantityValue), 1);
        addProductToPosCart(productId, quantity);
      }

      if (action === "remove-cart-item") {
        removePosCartItem(itemId);
      }

      if (action === "increment-cart-item") {
        updatePosCartItemQuantity(itemId, 1);
      }

      if (action === "decrement-cart-item") {
        updatePosCartItemQuantity(itemId, -1);
      }

      if (action === "reset-draft") {
        resetPosDraft();
      }

      if (action === "edit-order") {
        startEditingPosOrder(orderId);
      }

      if (action === "delete-order") {
        deletePosOrder(orderId);
      }

      if (action === "print-receipt") {
        printPosReceipt(orderId);
      }

      if (action === "export-csv") {
        exportPosOrdersCsv();
      }

      if (action === "focus-search") {
        uiFocusState.pos = "posDraftProductSearch";
        focusControlById("posDraftProductSearch");
      }

      if (action === "focus-order-search") {
        uiFocusState.pos = "posFilterSearch";
        focusControlById("posFilterSearch");
      }

      if (action === "clear-filters") {
        resetPosFilters();
      }

      if (action === "scan-barcode") {
        handlePosBarcodeScan();
      }

      return;
    }

    if (inventoryActionTarget) {
      const action = inventoryActionTarget.dataset.inventoryAction;
      const itemId = normalizeText(inventoryActionTarget.dataset.id);
      const quantityValue = Number(inventoryActionTarget.dataset.quantity || 0);

      if (action === "reset-draft") {
        resetInventoryDraft();
      }

      if (action === "new-item") {
        startNewInventoryItem();
      }

      if (action === "edit-item") {
        startEditingInventoryItem(itemId);
      }

      if (action === "duplicate-item") {
        duplicateInventoryItem(itemId);
      }

      if (action === "toggle-active") {
        toggleInventoryItemActive(itemId);
      }

      if (action === "adjust-stock") {
        adjustInventoryStock(itemId, quantityValue);
      }

      if (action === "set-stock") {
        promptSetInventoryQuantity(itemId);
      }

      if (action === "delete-item") {
        deleteInventoryItem(itemId);
      }

      if (action === "export-csv") {
        exportInventoryCsv();
      }

      if (action === "focus-search") {
        uiFocusState.inventory = "inventoryFilterSearch";
        focusControlById("inventoryFilterSearch");
      }

      if (action === "clear-filters") {
        resetInventoryFilters();
      }

      return;
    }

    if (auditActionTarget) {
      const action = normalizeText(auditActionTarget.dataset.auditAction);

      if (action === "clear-filters") {
        resetAuditFilters();
      }

      if (action === "export-csv") {
        exportAuditTrailCsv();
      }

      if (action === "print-log") {
        printAuditTrailSnapshot();
      }

      if (action === "go-module") {
        navigateTo(normalizeText(auditActionTarget.dataset.view), { syncHash: true });
      }

      return;
    }

    originalHandleDynamicModuleClick(event);
  };

  handleDynamicModuleSubmit = function patchedHandleDynamicModuleSubmit(event) {
    if (event.target.id === "posOrderForm") {
      handlePosOrderSubmit(event);
      return;
    }

    if (event.target.id === "inventoryItemForm") {
      handleInventorySubmit(event);
      return;
    }

    originalHandleDynamicModuleSubmit(event);
  };

  handleDynamicModuleInput = function patchedHandleDynamicModuleInput(event) {
    const { id, value } = event.target;

    if (id.startsWith("posDraft")) {
      handlePosDraftInput(id, value);
      if (shouldRenderAfterPosDraftInput(id)) {
        renderPosPage(buildPosLiveRenderOptions(event.target));
      }
      return;
    }

    if (id.startsWith("posFilter")) {
      handlePosFilterInput(id, value);
      renderPosPage(buildPosLiveRenderOptions(event.target));
      return;
    }

    if (id.startsWith("inventoryDraft")) {
      handleInventoryDraftInput(id, value, event.target);
      if (shouldRenderAfterInventoryDraftInput(id)) {
        renderInventoryPage();
      }
      return;
    }

    if (id.startsWith("inventoryFilter")) {
      handleInventoryFilterInput(id, value);
      renderInventoryPage();
      return;
    }

    if (id.startsWith("auditFilter")) {
      handleAuditFilterInput(id, value);
      renderAuditTrailPage();
      return;
    }

    originalHandleDynamicModuleInput(event);
  };

  handleDynamicModuleChange = function patchedHandleDynamicModuleChange(event) {
    const { id, value } = event.target;

    if (id.startsWith("posDraft")) {
      handlePosDraftInput(id, value);
      if (shouldRenderAfterPosDraftInput(id)) {
        renderPosPage(buildPosLiveRenderOptions(event.target));
      }
      return;
    }

    if (id.startsWith("posFilter")) {
      handlePosFilterInput(id, value);
      renderPosPage(buildPosLiveRenderOptions(event.target));
      return;
    }

    if (id.startsWith("inventoryDraft")) {
      handleInventoryDraftInput(id, value, event.target);
      if (shouldRenderAfterInventoryDraftInput(id)) {
        renderInventoryPage();
      }
      return;
    }

    if (id.startsWith("inventoryFilter")) {
      handleInventoryFilterInput(id, value);
      renderInventoryPage();
      return;
    }

    if (id.startsWith("auditFilter")) {
      handleAuditFilterInput(id, value);
      renderAuditTrailPage();
      return;
    }

    originalHandleDynamicModuleChange(event);
  };

  function extendViewMeta() {
    VIEW_META.pos = {
      eyebrow: "Sales Counter",
      title: "POS",
      summary:
        "Capture item-level sales from the cleaned product catalog and sync totals into Daily Sales automatically."
    };
    VIEW_META.inventory = {
      eyebrow: "Stock Control",
      title: "Inventory",
      summary:
        "Manage OneRoot product items, pricing, stock quantities, and low-stock visibility from the cleaned catalog."
    };
    VIEW_META.audit = {
      eyebrow: "Oversight",
      title: "Audit Trail",
      summary:
        "Review saved activity across modules, including create, update, delete, export, print, and backup actions."
    };
    VIEW_VISUALS.audit = {
      icon: "shield",
      accent: "#aeb9f0",
      soft: "rgba(174, 185, 240, 0.2)"
    };
  }

  function extendRolePresets() {
    Object.values(ROLE_PRESET_MAP).forEach((preset) => {
      if (!Array.isArray(preset.views)) {
        return;
      }

      if (["owner", "admin"].includes(
        Object.entries(ROLE_PRESET_MAP).find((entry) => entry[1] === preset)?.[0] || ""
      )) {
        preset.views = mergeUniqueOptions(preset.views, ["pos", "inventory", "audit"]);
      }
    });

    ROLE_PRESET_MAP.finance.views = mergeUniqueOptions(ROLE_PRESET_MAP.finance.views, [
      "pos",
      "inventory",
      "audit"
    ]);
    ROLE_PRESET_MAP.operations.views = mergeUniqueOptions(ROLE_PRESET_MAP.operations.views, [
      "pos",
      "inventory",
      "audit"
    ]);
    ROLE_PRESET_MAP.cashier.views = mergeUniqueOptions(ROLE_PRESET_MAP.cashier.views, [
      "pos",
      "inventory"
    ]);
  }

  function extendStorageKeys() {
    LIVE_DATA_STORAGE_KEYS.add(POS_ORDER_STORAGE_KEY);
    LIVE_DATA_STORAGE_KEYS.add(INVENTORY_ITEM_STORAGE_KEY);
    LIVE_DATA_STORAGE_KEYS.add(AUDIT_TRAIL_STORAGE_KEY);

    if (typeof registerHostedWorkspaceSyncStorageKeys === "function") {
      registerHostedWorkspaceSyncStorageKeys([
        POS_ORDER_STORAGE_KEY,
        INVENTORY_ITEM_STORAGE_KEY,
        AUDIT_TRAIL_STORAGE_KEY
      ]);
    }
  }

  function normalizeSaleSourceType(value) {
    const normalized = normalizeText(value).toLowerCase();
    return normalized === POS_SYNC_SOURCE_TYPE ? POS_SYNC_SOURCE_TYPE : MANUAL_SALE_SOURCE_TYPE;
  }

  function isPosSyncedSale(sale) {
    return normalizeSaleSourceType(sale?.sourceType) === POS_SYNC_SOURCE_TYPE;
  }

  function buildPosAreaDateKey(date, businessAreaId) {
    return `${normalizeDateInput(date)}|${normalizeBusinessAreaId(businessAreaId)}`;
  }

  function getUniquePosAreaIds(areaIds = []) {
    return Array.from(
      new Set(
        areaIds
          .map((areaId) => normalizeBusinessAreaId(areaId))
          .filter(Boolean)
      )
    );
  }

  function getPosOrderAreaIdsFromItems(items = [], fallbackAreaId = "") {
    return getUniquePosAreaIds(
      items.map((item) => item?.businessAreaId || fallbackAreaId)
    );
  }

  function getPosOrderAreaIds(order) {
    if (Array.isArray(order?.businessAreaIds) && order.businessAreaIds.length > 0) {
      return getUniquePosAreaIds(order.businessAreaIds);
    }

    const areaIds = getPosOrderAreaIdsFromItems(order?.items || [], order?.businessAreaId || "");

    if (areaIds.length > 0) {
      return areaIds;
    }

    return getUniquePosAreaIds([order?.businessAreaId]);
  }

  function getPosOrderPrimaryAreaId(order) {
    return normalizeBusinessAreaId(order?.businessAreaId) || getPosOrderAreaIds(order)[0] || "";
  }

  function getPosOrderAreaLabel(order) {
    const areaIds = getPosOrderAreaIds(order);

    if (areaIds.length === 0) {
      return "No Area";
    }

    if (areaIds.length === 1) {
      return getBusinessArea(areaIds[0]).shortLabel;
    }

    return `Multi-Area (${areaIds.length})`;
  }

  function getPosOrderAreaSummary(order) {
    return getPosOrderAreaIds(order)
      .map((areaId) => getBusinessArea(areaId).shortLabel)
      .join(", ");
  }

  function getPosCartAreaIds() {
    return getPosOrderAreaIdsFromItems(state.posDraft.items);
  }

  function getPosCartAreaLabel() {
    const areaIds = getPosCartAreaIds();

    if (areaIds.length === 0) {
      return normalizeBusinessAreaId(state.posDraft.businessAreaId)
        ? getBusinessArea(state.posDraft.businessAreaId).shortLabel
        : "All POS Areas";
    }

    if (areaIds.length === 1) {
      return getBusinessArea(areaIds[0]).shortLabel;
    }

    return `Multi-Area (${areaIds.length})`;
  }

  function buildPosOrderAreaTotals(order) {
    const totals = new Map();

    (order?.items || []).forEach((item) => {
      const areaId = normalizeBusinessAreaId(item?.businessAreaId || order?.businessAreaId);

      if (!areaId) {
        return;
      }

      const nextAmount = Number((((totals.get(areaId) || 0) + parseOptionalAmount(item.totalAmount)).toFixed(2)));
      totals.set(areaId, nextAmount);
    });

    return totals;
  }

  function createDefaultPosFilters() {
    return {
      search: "",
      month: "",
      area: "",
      paymentMethod: ""
    };
  }

  function createEmptyPosDraft() {
    return {
      orderDate: getTodayInputValue(),
      businessAreaId: "",
      paymentMethod: DEFAULT_POS_PAYMENT_METHOD,
      barcodeInput: "",
      customerName: "",
      customerPhone: "",
      notes: "",
      productSearch: "",
      categoryFilter: "",
      selectedProductId: "",
      quantity: 1,
      items: []
    };
  }

  function createDefaultInventoryFilters() {
    return {
      search: "",
      area: "",
      category: "",
      status: "",
      itemType: ""
    };
  }

  function resetPosFilters(options = {}) {
    state.posFilters = createDefaultPosFilters();
    renderPosPage();

    if (!options.silent) {
      showToast("POS filters cleared.");
    }
  }

  function resetInventoryFilters(options = {}) {
    state.inventoryFilters = createDefaultInventoryFilters();
    renderInventoryPage();

    if (!options.silent) {
      showToast("Inventory filters cleared.");
    }
  }

  function createEmptyInventoryDraft() {
    return {
      id: "",
      businessAreaId: "",
      sku: "",
      barcode: "",
      name: "",
      category: "",
      sourceCategory: "",
      itemType: "stock",
      trackInventory: true,
      quantityOnHand: 0,
      quantityKnown: true,
      minStockLevel: DEFAULT_REORDER_LEVEL,
      salesPrice: 0,
      costPrice: 0,
      active: true,
      notes: "",
      sourceCatalogId: "",
      userCreated: true
    };
  }

  function shouldRenderAfterPosDraftInput(id) {
    return [
      "posDraftBusinessArea",
      "posDraftProductSearch",
      "posDraftCategoryFilter",
      "posDraftSelectedProduct"
    ].includes(id);
  }

  function shouldRenderAfterInventoryDraftInput(id) {
    return ["inventoryDraftItemType", "inventoryDraftTrackInventory"].includes(id);
  }

  function trackModuleFocus(event) {
    const targetId = normalizeText(event.target?.id);

    if (targetId.startsWith("pos")) {
      uiFocusState.pos = targetId;
    }

    if (targetId.startsWith("inventory")) {
      uiFocusState.inventory = targetId;
    }
  }

  function handleModuleKeydown(event) {
    if (state.currentView === "pos" && event.target?.id === "posDraftProductSearch" && event.key === "Enter") {
      event.preventDefault();
      addSelectedProductToPosCart();
      return;
    }

    if (state.currentView === "pos" && event.target?.id === "posDraftBarcode" && event.key === "Enter") {
      event.preventDefault();
      handlePosBarcodeScan();
      return;
    }

    if (event.key !== "/" || isTextEntryTarget(event.target)) {
      return;
    }

    if (state.currentView === "pos") {
      event.preventDefault();
      uiFocusState.pos = "posDraftProductSearch";
      focusControlById("posDraftProductSearch");
      return;
    }

    if (state.currentView === "inventory") {
      event.preventDefault();
      uiFocusState.inventory = "inventoryFilterSearch";
      focusControlById("inventoryFilterSearch");
    }
  }

  function isTextEntryTarget(target) {
    const tagName = target?.tagName?.toLowerCase();
    return tagName === "input" || tagName === "textarea" || Boolean(target?.isContentEditable);
  }

  function buildControlViewportState(control) {
    return {
      targetId: normalizeText(control?.id),
      scrollX: window.scrollX || 0,
      scrollY: window.scrollY || 0,
      selectionStart:
        typeof control?.selectionStart === "number" ? control.selectionStart : null,
      selectionEnd:
        typeof control?.selectionEnd === "number" ? control.selectionEnd : null
    };
  }

  function restoreWindowScrollPosition(scrollState) {
    if (!scrollState) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo(scrollState.scrollX || 0, scrollState.scrollY || 0);
      });
    });
  }

  function buildPosLiveRenderOptions(control) {
    const viewportState = buildControlViewportState(control);
    return {
      preserveScroll: true,
      focusState: viewportState,
      scrollState: viewportState
    };
  }

  function focusControlById(id, options = {}) {
    const control = document.getElementById(id);

    if (!control || control.disabled) {
      return;
    }

    window.requestAnimationFrame(() => {
      try {
        control.focus({ preventScroll: true });
      } catch (error) {
        console.error(error);
        control.focus();
      }

      if (
        typeof control.setSelectionRange === "function" &&
        typeof control.value === "string"
      ) {
        const valueLength = control.value.length;
        const selectionStart = Number.isFinite(options.selectionStart)
          ? Math.max(Math.min(options.selectionStart, valueLength), 0)
          : valueLength;
        const selectionEnd = Number.isFinite(options.selectionEnd)
          ? Math.max(Math.min(options.selectionEnd, valueLength), selectionStart)
          : selectionStart;
        control.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  function restoreModuleFocus(moduleName, options = {}) {
    if (state.currentView !== moduleName) {
      return;
    }

    const targetId = normalizeText(options.targetId) || uiFocusState[moduleName];

    if (!targetId) {
      return;
    }

    focusControlById(targetId, options);
  }

  function loadPosOrders() {
    try {
      const raw = localStorage.getItem(POS_ORDER_STORAGE_KEY);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return sortPosOrders(
        parsed
          .filter((record) => record && typeof record === "object")
          .map(sanitizeStoredPosOrder)
          .filter(Boolean)
      );
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function loadInventoryItems() {
    try {
      const raw = localStorage.getItem(INVENTORY_ITEM_STORAGE_KEY);

      if (!raw) {
        return sortInventoryItems(buildCatalogSeedItems());
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return sortInventoryItems(buildCatalogSeedItems());
      }

      return mergeCatalogSeedWithStoredInventory(
        parsed
          .filter((item) => item && typeof item === "object")
          .map(sanitizeStoredInventoryItem)
          .filter(Boolean)
      );
    } catch (error) {
      console.error(error);
      return sortInventoryItems(buildCatalogSeedItems());
    }
  }

  function buildCatalogSeedItems() {
    const seedTimestamp = `catalog-${PRODUCT_CATALOG_VERSION}`;

    return PRODUCT_CATALOG.map((item) =>
      sanitizeStoredInventoryItem({
        ...item,
        id: item.id,
        sourceCatalogId: item.id,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
        active: true,
        minStockLevel: item.trackInventory ? DEFAULT_REORDER_LEVEL : 0,
        userCreated: false
      })
    ).filter(Boolean);
  }

  function mergeCatalogSeedWithStoredInventory(storedItems = []) {
    const seedItems = buildCatalogSeedItems();
    const mergedByKey = new Map(seedItems.map((item) => [buildInventorySyncKey(item), item]));
    const customItems = [];

    storedItems.forEach((storedItem) => {
      const key = buildInventorySyncKey(storedItem);

      if (storedItem.sourceCatalogId && mergedByKey.has(key)) {
        const seedItem = mergedByKey.get(key);
        mergedByKey.set(key, {
          ...seedItem,
          ...storedItem,
          id: storedItem.id || seedItem.id,
          createdAt: storedItem.createdAt || seedItem.createdAt,
          updatedAt: storedItem.updatedAt || seedItem.updatedAt,
          userCreated: false
        });
        return;
      }

      customItems.push(storedItem);
    });

    return sortInventoryItems([...mergedByKey.values(), ...customItems]);
  }

  function buildInventorySyncKey(item) {
    return normalizeText(item.sourceCatalogId)
      ? `catalog:${normalizeText(item.sourceCatalogId)}`
      : `custom:${item.businessAreaId}|${normalizeText(item.name).toLowerCase()}`;
  }

  function sanitizeStoredPosOrder(record) {
    const orderDate = normalizeDateInput(record.orderDate || record.date);
    const businessAreaId = normalizeBusinessAreaId(record.businessAreaId || record.businessArea);
    const items = Array.isArray(record.items)
      ? record.items
          .map((item) =>
            sanitizeStoredPosOrderItem({
              ...item,
              businessAreaId: item?.businessAreaId || item?.businessArea || businessAreaId
            })
          )
          .filter(Boolean)
      : [];
    const businessAreaIds = getPosOrderAreaIdsFromItems(items, businessAreaId);
    const primaryAreaId = businessAreaId || businessAreaIds[0];
    const totalAmount = Number(
      (items.reduce((sum, item) => sum + item.totalAmount, 0) || parseOptionalAmount(record.totalAmount)).toFixed(2)
    );

    if (!orderDate || !primaryAreaId || items.length === 0 || totalAmount <= 0) {
      return null;
    }

    return {
      id: record.id || generateId(),
      orderNumber:
        normalizeText(record.orderNumber || record.reference) ||
        buildPosOrderNumber(orderDate),
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
      orderDate,
      businessAreaId: primaryAreaId,
      businessAreaIds: businessAreaIds.length > 0 ? businessAreaIds : [primaryAreaId],
      paymentMethod: normalizeText(record.paymentMethod) || DEFAULT_POS_PAYMENT_METHOD,
      customerName: normalizeText(record.customerName || record.customer),
      customerPhone: normalizeText(record.customerPhone || record.phone),
      notes: normalizeText(record.notes),
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: totalAmount,
      totalAmount
    };
  }

  function sanitizeStoredPosOrderItem(item) {
    const productId = normalizeText(item.productId || item.inventoryItemId || item.id);
    const quantity = Math.max(parsePositiveInteger(item.quantity), 1);
    const unitPrice = parseOptionalAmount(item.unitPrice || item.salesPrice || item.price);
    const name = normalizeText(item.name || item.productName);
    const businessAreaId = normalizeBusinessAreaId(item.businessAreaId || item.businessArea);

    if (!productId || !name || unitPrice < 0) {
      return null;
    }

    const itemType = normalizeText(item.itemType).toLowerCase() === "service" ? "service" : "stock";
    const trackInventory =
      itemType === "stock" &&
      !(
        item.trackInventory === false ||
        item.trackInventory === "false" ||
        item.trackInventory === 0 ||
        item.trackInventory === "0"
      );

    return {
      productId,
      businessAreaId,
      sku: normalizeText(item.sku),
      barcode: normalizeText(item.barcode),
      name,
      category: normalizeText(item.category),
      itemType,
      trackInventory,
      quantity,
      unitPrice,
      totalAmount: Number((quantity * unitPrice).toFixed(2))
    };
  }

  function sanitizeStoredInventoryItem(item) {
    const businessAreaId =
      normalizeBusinessAreaId(item.businessAreaId || item.businessArea || inferBusinessAreaId(item)) ||
      DEFAULT_BUSINESS_AREA_ID;
    const name = normalizeText(item.name || item.productName);
    const category = normalizeText(item.category) || "Uncategorized";
    const itemType = normalizeText(item.itemType).toLowerCase() === "service" ? "service" : "stock";
    const trackInventory =
      itemType === "stock" &&
      !(
        item.trackInventory === false ||
        item.trackInventory === "false" ||
        item.trackInventory === 0 ||
        item.trackInventory === "0"
      );

    if (!businessAreaId || !name) {
      return null;
    }

    return {
      id: normalizeText(item.id) || generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      sourceCatalogId: normalizeText(item.sourceCatalogId || item.catalogId),
      sku: normalizeText(item.sku) || buildInventorySku(businessAreaId, name),
      barcode: normalizeText(item.barcode || item.upc || item.ean || item.code),
      name,
      businessAreaId,
      category,
      sourceCategory: normalizeText(item.sourceCategory),
      itemType,
      trackInventory,
      quantityOnHand:
        itemType === "stock" ? Number(parseOptionalAmount(item.quantityOnHand).toFixed(2)) : 0,
      quantityKnown:
        item.itemType === "service"
          ? false
          : item.quantityKnown === true ||
            item.quantityKnown === "true" ||
            normalizeText(item.quantityKnown).toLowerCase() === "yes" ||
            normalizeText(item.quantityKnown).toLowerCase() === "true" ||
            item.quantityOnHand !== undefined,
      minStockLevel:
        trackInventory
          ? Math.max(parsePositiveInteger(item.minStockLevel || item.reorderLevel), 0)
          : 0,
      salesPrice: Number(parseOptionalAmount(item.salesPrice || item.unitPrice).toFixed(2)),
      costPrice: Number(parseOptionalAmount(item.costPrice || item.cost).toFixed(2)),
      active:
        item.active === false ||
        item.active === "false" ||
        item.active === 0 ||
        item.active === "0"
          ? false
          : true,
      notes: normalizeText(item.notes),
      userCreated:
        item.userCreated === true ||
        item.userCreated === "true" ||
        (!normalizeText(item.sourceCatalogId || item.catalogId) && normalizeText(item.id) !== "")
    };
  }

  function sortPosOrders(records) {
    return [...records].sort((left, right) => {
      const dateDifference = right.orderDate.localeCompare(left.orderDate);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return (right.updatedAt || "").localeCompare(left.updatedAt || "");
    });
  }

  function sortInventoryItems(records) {
    return [...records].sort((left, right) => {
      const activeDifference = Number(right.active) - Number(left.active);

      if (activeDifference !== 0) {
        return activeDifference;
      }

      const areaDifference = getBusinessArea(left.businessAreaId).shortLabel.localeCompare(
        getBusinessArea(right.businessAreaId).shortLabel
      );

      if (areaDifference !== 0) {
        return areaDifference;
      }

      const categoryDifference = normalizeText(left.category).localeCompare(
        normalizeText(right.category)
      );

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return normalizeText(left.name).localeCompare(normalizeText(right.name));
    });
  }

  function buildPosOrderMergeKey(order) {
    return (
      normalizeText(order.orderNumber) ||
      normalizeText(order.id) ||
      [
        normalizeDateInput(order.orderDate),
        getPosOrderPrimaryAreaId(order),
        Number(order.totalAmount || 0).toFixed(2),
        normalizeText(order.customerPhone),
        normalizeText(order.customerName).toLowerCase()
      ].join("|")
    );
  }

  function mergePosOrders(existing, imported) {
    return mergeCollectionsByKey(existing, imported, buildPosOrderMergeKey, sortPosOrders);
  }

  function mergeInventoryItems(existing, imported) {
    return mergeCatalogSeedWithStoredInventory([...(existing || []), ...(imported || [])]);
  }

  function buildAuditTrailMergeKey(record) {
    return (
      normalizeText(record.id) ||
      [
        normalizeText(record.timestamp),
        normalizeText(record.moduleKey).toLowerCase(),
        normalizeText(record.action).toLowerCase(),
        normalizeText(record.recordId),
        normalizeText(record.title).toLowerCase()
      ].join("|")
    );
  }

  function mergeAuditTrailEntries(existing, imported) {
    return mergeCollectionsByKey(
      existing,
      imported,
      buildAuditTrailMergeKey,
      sortAuditTrail
    ).slice(0, AUDIT_TRAIL_LIMIT);
  }

  function persistPosOrders() {
    localStorage.setItem(POS_ORDER_STORAGE_KEY, JSON.stringify(state.posOrders));
    if (typeof queueHostedWorkspaceSyncAfterPersist === "function") {
      queueHostedWorkspaceSyncAfterPersist({ reason: "pos-orders" });
    }
  }

  function persistInventoryItems() {
    localStorage.setItem(INVENTORY_ITEM_STORAGE_KEY, JSON.stringify(state.inventoryItems));
    if (typeof queueHostedWorkspaceSyncAfterPersist === "function") {
      queueHostedWorkspaceSyncAfterPersist({ reason: "inventory-items" });
    }
  }

  function reconcilePosGeneratedSales(options = {}) {
    const keys = new Set();

    state.posOrders.forEach((order) => {
      Array.from(buildPosOrderAreaTotals(order).keys()).forEach((areaId) => {
        keys.add(buildPosAreaDateKey(order.orderDate, areaId));
      });
    });

    state.sales
      .filter(isPosSyncedSale)
      .forEach((sale) => keys.add(buildPosAreaDateKey(sale.date, sale.businessAreaId)));

    let changed = false;

    Array.from(keys).forEach((key) => {
      const [date, businessAreaId] = key.split("|");
      if (syncPosDailySalesRecord(date, businessAreaId)) {
        changed = true;
      }
    });

    if (changed && options.persist !== false) {
      persistSales();
    }
  }

  function syncPosDailySalesRecord(date, businessAreaId) {
    const normalizedDate = normalizeDateInput(date);
    const normalizedAreaId = normalizeBusinessAreaId(businessAreaId);

    if (!normalizedDate || !normalizedAreaId) {
      return false;
    }

    const matchingOrders = state.posOrders.filter((order) => {
      if (order.orderDate !== normalizedDate) {
        return false;
      }

      return buildPosOrderAreaTotals(order).has(normalizedAreaId);
    });
    const existingSale = state.sales.find(
      (sale) =>
        isPosSyncedSale(sale) &&
        sale.date === normalizedDate &&
        sale.businessAreaId === normalizedAreaId
    );
    const totalAmount = Number(
      matchingOrders
        .reduce((sum, order) => sum + (buildPosOrderAreaTotals(order).get(normalizedAreaId) || 0), 0)
        .toFixed(2)
    );

    if (matchingOrders.length === 0 || totalAmount <= 0) {
      if (!existingSale) {
        return false;
      }

      state.sales = sortSales(state.sales.filter((sale) => sale.id !== existingSale.id));
      return true;
    }

    const notes = `${POS_SYNC_NOTE_PREFIX} ${matchingOrders.length} order${
      matchingOrders.length === 1 ? "" : "s"
    } captured in POS for ${getBusinessArea(normalizedAreaId).shortLabel}.`;

    if (existingSale) {
      const hasChanged =
        existingSale.amount !== totalAmount ||
        existingSale.notes !== notes ||
        existingSale.linkedPosAreaDateKey !== buildPosAreaDateKey(normalizedDate, normalizedAreaId);

      if (!hasChanged) {
        return false;
      }

      state.sales = sortSales(
        state.sales.map((sale) =>
          sale.id === existingSale.id
            ? {
                ...sale,
                amount: totalAmount,
                notes,
                sourceType: POS_SYNC_SOURCE_TYPE,
                sourceLabel: "POS Sync",
                linkedPosAreaDateKey: buildPosAreaDateKey(normalizedDate, normalizedAreaId),
                updatedAt: new Date().toISOString()
              }
            : sale
        )
      );
      return true;
    }

    state.sales = sortSales([
      ...state.sales,
      {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessAreaId: normalizedAreaId,
        date: normalizedDate,
        amount: totalAmount,
        notes,
        sourceType: POS_SYNC_SOURCE_TYPE,
        sourceLabel: "POS Sync",
        linkedPosAreaDateKey: buildPosAreaDateKey(normalizedDate, normalizedAreaId)
      }
    ]);

    return true;
  }

  function buildPosOrderNumber(orderDate) {
    return `POS-${normalizeDateInput(orderDate).replaceAll("-", "")}-${generateId()
      .slice(0, 4)
      .toUpperCase()}`;
  }

  function buildInventorySku(businessAreaId, name) {
    const areaCode = normalizeBusinessAreaId(businessAreaId)
      .split("-")
      .map((part) => part.slice(0, 3).toUpperCase())
      .join("");
    const nameCode = normalizeText(name)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 8);
    return `${areaCode || "INV"}-${nameCode || "ITEM"}-${generateId()
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase()}`;
  }

  function handlePosDraftInput(id, value) {
    if (id === "posDraftOrderDate") {
      state.posDraft.orderDate = normalizeDateInput(value) || getTodayInputValue();
    }

    if (id === "posDraftBarcode") {
      state.posDraft.barcodeInput = value;
    }

    if (id === "posDraftBusinessArea") {
      applyPosBusinessAreaChoice(value, { render: false });
    }

    if (id === "posDraftPaymentMethod") {
      state.posDraft.paymentMethod = normalizeText(value) || DEFAULT_POS_PAYMENT_METHOD;
    }

    if (id === "posDraftCustomerName") {
      state.posDraft.customerName = value;
    }

    if (id === "posDraftCustomerPhone") {
      state.posDraft.customerPhone = value;
    }

    if (id === "posDraftNotes") {
      state.posDraft.notes = value;
    }

    if (id === "posDraftProductSearch") {
      state.posDraft.productSearch = value;
      state.posDraft.selectedProductId = "";
    }

    if (id === "posDraftCategoryFilter") {
      state.posDraft.categoryFilter = normalizeText(value);
      state.posDraft.selectedProductId = "";
    }

    if (id === "posDraftSelectedProduct") {
      state.posDraft.selectedProductId = normalizeText(value);
    }

    if (id === "posDraftQuantity") {
      state.posDraft.quantity = Math.max(parsePositiveInteger(value), 1);
    }
  }

  function handlePosFilterInput(id, value) {
    if (id === "posFilterSearch") {
      state.posFilters.search = value;
    }

    if (id === "posFilterMonth") {
      state.posFilters.month = normalizeMonthInput(value);
    }

    if (id === "posFilterArea") {
      state.posFilters.area = normalizeBusinessAreaId(value);
    }

    if (id === "posFilterPaymentMethod") {
      state.posFilters.paymentMethod = normalizeText(value);
    }
  }

  function handleInventoryDraftInput(id, value, target) {
    if (id === "inventoryDraftArea") {
      state.inventoryDraft.businessAreaId = normalizeBusinessAreaId(value);
    }

    if (id === "inventoryDraftSku") {
      state.inventoryDraft.sku = value;
    }

    if (id === "inventoryDraftBarcode") {
      state.inventoryDraft.barcode = value;
    }

    if (id === "inventoryDraftName") {
      state.inventoryDraft.name = value;
    }

    if (id === "inventoryDraftCategory") {
      state.inventoryDraft.category = value;
    }

    if (id === "inventoryDraftSourceCategory") {
      state.inventoryDraft.sourceCategory = value;
    }

    if (id === "inventoryDraftItemType") {
      state.inventoryDraft.itemType = normalizeText(value).toLowerCase() === "service" ? "service" : "stock";
      if (state.inventoryDraft.itemType === "service") {
        state.inventoryDraft.trackInventory = false;
        state.inventoryDraft.quantityOnHand = 0;
        state.inventoryDraft.minStockLevel = 0;
      } else if (!state.inventoryDraft.trackInventory) {
        state.inventoryDraft.trackInventory = true;
        state.inventoryDraft.minStockLevel = DEFAULT_REORDER_LEVEL;
      }
    }

    if (id === "inventoryDraftTrackInventory") {
      state.inventoryDraft.trackInventory = target.checked;
      if (!target.checked) {
        state.inventoryDraft.minStockLevel = 0;
      } else if (state.inventoryDraft.itemType === "stock" && state.inventoryDraft.minStockLevel === 0) {
        state.inventoryDraft.minStockLevel = DEFAULT_REORDER_LEVEL;
      }
    }

    if (id === "inventoryDraftQuantity") {
      state.inventoryDraft.quantityOnHand = parseOptionalAmount(value);
      state.inventoryDraft.quantityKnown = true;
    }

    if (id === "inventoryDraftMinStockLevel") {
      state.inventoryDraft.minStockLevel = Math.max(parsePositiveInteger(value), 0);
    }

    if (id === "inventoryDraftSalesPrice") {
      state.inventoryDraft.salesPrice = parseOptionalAmount(value);
    }

    if (id === "inventoryDraftCostPrice") {
      state.inventoryDraft.costPrice = parseOptionalAmount(value);
    }

    if (id === "inventoryDraftActive") {
      state.inventoryDraft.active = target.checked;
    }

    if (id === "inventoryDraftNotes") {
      state.inventoryDraft.notes = value;
    }
  }

  function handleInventoryFilterInput(id, value) {
    if (id === "inventoryFilterSearch") {
      state.inventoryFilters.search = value;
    }

    if (id === "inventoryFilterArea") {
      state.inventoryFilters.area = normalizeBusinessAreaId(value);
    }

    if (id === "inventoryFilterCategory") {
      state.inventoryFilters.category = normalizeText(value);
    }

    if (id === "inventoryFilterStatus") {
      state.inventoryFilters.status = normalizeText(value);
    }

    if (id === "inventoryFilterItemType") {
      state.inventoryFilters.itemType = normalizeText(value).toLowerCase();
    }
  }

  function getPosBusinessAreaOptions() {
    const areaIds = Array.from(
      new Set(
        state.inventoryItems
          .filter((item) => item.active)
          .map((item) => item.businessAreaId)
          .filter((value) => value && value !== "rentals-apartments")
      )
    );

    return BUSINESS_AREAS.filter((area) => areaIds.includes(area.id)).map((area) => ({
      value: area.id,
      label: area.label
    }));
  }

  function applyPosBusinessAreaChoice(areaId, options = {}) {
    const normalizedAreaId = normalizeBusinessAreaId(areaId);

    if (!normalizedAreaId) {
      state.posDraft.businessAreaId = "";
      state.posDraft.categoryFilter = "";
      state.posDraft.selectedProductId = "";

      if (options.render !== false) {
        renderPosPage();
      }

      return;
    }

    state.posDraft.businessAreaId = normalizedAreaId;
    state.posDraft.categoryFilter = "";
    state.posDraft.selectedProductId = "";

    if (options.render !== false) {
      renderPosPage();
    }
  }

  function setPosPaymentMethod(paymentMethod) {
    state.posDraft.paymentMethod = normalizeText(paymentMethod) || DEFAULT_POS_PAYMENT_METHOD;
    renderPosPage();
  }

  function getPosVisibleProducts(limit = POS_PRODUCT_GRID_LIMIT) {
    const searchValue = normalizeText(state.posDraft.productSearch).toLowerCase();
    const businessAreaId = normalizeBusinessAreaId(state.posDraft.businessAreaId);
    const categoryFilter = normalizeText(state.posDraft.categoryFilter);

    const visibleItems = state.inventoryItems
      .filter((item) => item.active)
      .filter((item) => businessAreaId === "" || item.businessAreaId === businessAreaId)
      .filter((item) => categoryFilter === "" || item.category === categoryFilter)
      .filter((item) => {
        if (!searchValue) {
          return true;
        }

        return [item.name, item.sku, item.barcode, item.category, item.notes]
          .join(" ")
          .toLowerCase()
          .includes(searchValue);
      });

    if (!searchValue) {
      return visibleItems.slice(0, limit);
    }

    return visibleItems
      .slice()
      .sort((left, right) => buildInventorySearchScore(right, searchValue) - buildInventorySearchScore(left, searchValue))
      .slice(0, limit);
  }

  function getPosCategoryOptions() {
    const businessAreaId = normalizeBusinessAreaId(state.posDraft.businessAreaId);
    const categories = state.inventoryItems
      .filter((item) => item.active)
      .filter((item) => businessAreaId === "" || item.businessAreaId === businessAreaId)
      .map((item) => item.category);
    return mergeUniqueOptions([], categories).map((category) => ({
      value: category,
      label: category
    }));
  }

  function normalizeInventoryCode(value) {
    return normalizeText(value)
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  function buildInventoryIdentityLabel(item) {
    const values = [];

    if (normalizeText(item.sku)) {
      values.push(`SKU ${normalizeText(item.sku)}`);
    }

    if (normalizeText(item.barcode)) {
      values.push(`Barcode ${normalizeText(item.barcode)}`);
    }

    return values.join(" • ");
  }

  function findInventoryItemByScannedCode(code, options = {}) {
    const normalizedCode = normalizeInventoryCode(code);

    if (!normalizedCode) {
      return null;
    }

    const activeOnly = options.activeOnly !== false;
    const areaId = normalizeBusinessAreaId(options.businessAreaId);
    const candidateItems = state.inventoryItems
      .filter((item) => (activeOnly ? item.active : true))
      .filter((item) => !areaId || item.businessAreaId === areaId);

    const exactBarcodeMatch =
      candidateItems.find((item) => normalizeInventoryCode(item.barcode) === normalizedCode) ||
      state.inventoryItems.find(
        (item) =>
          (activeOnly ? item.active : true) && normalizeInventoryCode(item.barcode) === normalizedCode
      );

    if (exactBarcodeMatch) {
      return exactBarcodeMatch;
    }

    const exactSkuMatch =
      candidateItems.find((item) => normalizeInventoryCode(item.sku) === normalizedCode) ||
      state.inventoryItems.find(
        (item) =>
          (activeOnly ? item.active : true) && normalizeInventoryCode(item.sku) === normalizedCode
      );

    if (exactSkuMatch) {
      return exactSkuMatch;
    }

    return null;
  }

  function buildInventorySearchScore(item, searchValue) {
    const name = normalizeText(item.name).toLowerCase();
    const sku = normalizeText(item.sku).toLowerCase();
    const barcode = normalizeText(item.barcode).toLowerCase();
    const category = normalizeText(item.category).toLowerCase();
    const sourceCategory = normalizeText(item.sourceCategory).toLowerCase();
    const notes = normalizeText(item.notes).toLowerCase();
    let score = 0;

    if (barcode === searchValue) {
      score += 700;
    } else if (barcode.startsWith(searchValue)) {
      score += 520;
    } else if (barcode.includes(searchValue)) {
      score += 320;
    }

    if (sku === searchValue) {
      score += 500;
    } else if (sku.startsWith(searchValue)) {
      score += 320;
    } else if (sku.includes(searchValue)) {
      score += 200;
    }

    if (name === searchValue) {
      score += 460;
    } else if (name.startsWith(searchValue)) {
      score += 340;
    } else if (name.includes(searchValue)) {
      score += 240;
    }

    if (category === searchValue) {
      score += 180;
    } else if (category.includes(searchValue)) {
      score += 120;
    }

    if (sourceCategory.includes(searchValue)) {
      score += 80;
    }

    if (notes.includes(searchValue)) {
      score += 40;
    }

    if (item.trackInventory && item.quantityOnHand > 0) {
      score += 5;
    }

    return score;
  }

  function buildPosProductUsageMap() {
    const usageMap = new Map();

    state.posOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = usageMap.get(item.productId) || {
          quantity: 0,
          orderCount: 0,
          lastSoldAt: ""
        };
        usageMap.set(item.productId, {
          quantity: current.quantity + item.quantity,
          orderCount: current.orderCount + 1,
          lastSoldAt: order.orderDate > current.lastSoldAt ? order.orderDate : current.lastSoldAt
        });
      });
    });

    return usageMap;
  }

  function getFrequentPosProducts() {
    const businessAreaId = normalizeBusinessAreaId(state.posDraft.businessAreaId);
    const usageMap = buildPosProductUsageMap();

    return state.inventoryItems
      .filter((item) => item.active)
      .filter((item) => businessAreaId === "" || item.businessAreaId === businessAreaId)
      .filter((item) => usageMap.has(item.id))
      .sort((left, right) => {
        const leftUsage = usageMap.get(left.id);
        const rightUsage = usageMap.get(right.id);

        if (rightUsage.quantity !== leftUsage.quantity) {
          return rightUsage.quantity - leftUsage.quantity;
        }

        if (rightUsage.lastSoldAt !== leftUsage.lastSoldAt) {
          return rightUsage.lastSoldAt.localeCompare(leftUsage.lastSoldAt);
        }

        return left.name.localeCompare(right.name);
      })
      .slice(0, POS_FREQUENT_PRODUCT_LIMIT);
  }

  function getSelectedPosProduct() {
    const visibleProducts = getPosVisibleProducts();
    const selectedProduct =
      visibleProducts.find((item) => item.id === state.posDraft.selectedProductId) || visibleProducts[0] || null;

    if (selectedProduct && selectedProduct.id !== state.posDraft.selectedProductId) {
      state.posDraft.selectedProductId = selectedProduct.id;
    }

    if (!selectedProduct) {
      state.posDraft.selectedProductId = "";
    }

    return selectedProduct;
  }

  function selectPosProduct(productId, options = {}) {
    const selectedProduct = state.inventoryItems.find((item) => item.id === productId && item.active);

    if (!selectedProduct) {
      showToast("Choose a product first.");
      return null;
    }

    if (
      normalizeBusinessAreaId(state.posDraft.businessAreaId) &&
      state.posDraft.businessAreaId !== selectedProduct.businessAreaId
    ) {
      showToast("This item is outside the selected POS area filter. Switch the filter or use All POS Areas.");
      return null;
    }

    state.posDraft.selectedProductId = selectedProduct.id;

    if (options.render !== false) {
      renderPosPage();
    }

    return selectedProduct;
  }

  function addSelectedProductToPosCart() {
    const selectedProduct = getSelectedPosProduct();

    if (!selectedProduct) {
      showToast("Choose a product first.");
      return;
    }

    addProductToPosCart(selectedProduct.id, state.posDraft.quantity);
  }

  function handlePosBarcodeScan() {
    const scannedCode = normalizeText(state.posDraft.barcodeInput);

    if (!scannedCode) {
      showToast("Scan or type a barcode first.");
      uiFocusState.pos = "posDraftBarcode";
      focusControlById("posDraftBarcode");
      return;
    }

    const selectedProduct = findInventoryItemByScannedCode(scannedCode, {
      activeOnly: true,
      businessAreaId: state.posDraft.businessAreaId
    });

    if (!selectedProduct) {
      showToast(`No active POS item matches barcode ${scannedCode}. Save it on the inventory item first.`);
      uiFocusState.pos = "posDraftBarcode";
      focusControlById("posDraftBarcode");
      return;
    }

    addProductToPosCart(selectedProduct.id, state.posDraft.quantity, {
      focusTarget: "posDraftBarcode",
      clearBarcodeInput: true
    });
  }

  function addProductToPosCart(productId, quantityValue = 1, options = {}) {
    const selectedProduct = state.inventoryItems.find((item) => item.id === productId && item.active);

    if (!selectedProduct) {
      showToast("That product is no longer available in inventory.");
      return;
    }

    if (
      normalizeBusinessAreaId(state.posDraft.businessAreaId) &&
      state.posDraft.businessAreaId !== selectedProduct.businessAreaId
    ) {
      showToast("This item is outside the selected POS area filter. Switch the filter or use All POS Areas.");
      return;
    }

    const quantity = Math.max(parsePositiveInteger(quantityValue), 1);
    const existingItem = state.posDraft.items.find((item) => item.productId === selectedProduct.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalAmount = Number((existingItem.quantity * existingItem.unitPrice).toFixed(2));
    } else {
      state.posDraft.items.push({
        productId: selectedProduct.id,
        businessAreaId: selectedProduct.businessAreaId,
        sku: selectedProduct.sku,
        barcode: selectedProduct.barcode,
        name: selectedProduct.name,
        category: selectedProduct.category,
        itemType: selectedProduct.itemType,
        trackInventory: selectedProduct.trackInventory,
        quantity,
        unitPrice: selectedProduct.salesPrice,
        totalAmount: Number((quantity * selectedProduct.salesPrice).toFixed(2))
      });
    }

    state.posDraft.quantity = 1;
    if (options.clearBarcodeInput !== false) {
      state.posDraft.barcodeInput = "";
    }
    state.posDraft.selectedProductId = selectedProduct.id;
    uiFocusState.pos = options.focusTarget || "posDraftProductSearch";
    renderPosPage();
    showToast(`${selectedProduct.name} added to the POS cart.`);
  }

  function removePosCartItem(productId) {
    state.posDraft.items = state.posDraft.items.filter((item) => item.productId !== productId);
    renderPosPage();
  }

  function updatePosCartItemQuantity(productId, delta) {
    state.posDraft.items = state.posDraft.items
      .map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const nextQuantity = Math.max(item.quantity + delta, 0);

        if (nextQuantity === 0) {
          return null;
        }

        return {
          ...item,
          quantity: nextQuantity,
          totalAmount: Number((nextQuantity * item.unitPrice).toFixed(2))
        };
      })
      .filter(Boolean);
    renderPosPage();
  }

  function resetPosDraft(options = {}) {
    const freshDraft = createEmptyPosDraft();
    state.posDraft = options.keepCounterContext
      ? {
          ...freshDraft,
          orderDate: state.posDraft.orderDate || freshDraft.orderDate,
          businessAreaId: state.posDraft.businessAreaId,
          paymentMethod: state.posDraft.paymentMethod || DEFAULT_POS_PAYMENT_METHOD
        }
      : freshDraft;
    state.editingPosOrderId = null;
    uiFocusState.pos = "posDraftProductSearch";
    renderPosPage();

    if (!options.silent) {
      showToast("POS form cleared.");
    }
  }

  function handlePosOrderSubmit(event) {
    event.preventDefault();
    const submitMode = normalizeText(event.submitter?.dataset.posSubmit).toLowerCase();

    const orderDate = normalizeDateInput(state.posDraft.orderDate);
    const items = state.posDraft.items.map(sanitizeStoredPosOrderItem).filter(Boolean);
    const businessAreaIds = getPosOrderAreaIdsFromItems(
      items,
      normalizeBusinessAreaId(state.posDraft.businessAreaId)
    );
    const businessAreaId = businessAreaIds[0] || normalizeBusinessAreaId(state.posDraft.businessAreaId);
    const totalAmount = Number(items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2));

    if (!orderDate || !businessAreaId || items.length === 0 || totalAmount <= 0) {
      showToast("Add at least one POS item and choose the sales date before saving.");
      return;
    }

    const existingOrder = state.posOrders.find((order) => order.id === state.editingPosOrderId);

    if (existingOrder) {
      applyInventoryMovementFromOrder(existingOrder, 1);
    }

    const orderRecord = {
      id: existingOrder?.id || generateId(),
      orderNumber: existingOrder?.orderNumber || buildPosOrderNumber(orderDate),
      createdAt: existingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderDate,
      businessAreaId,
      businessAreaIds,
      paymentMethod: normalizeText(state.posDraft.paymentMethod) || DEFAULT_POS_PAYMENT_METHOD,
      customerName: normalizeText(state.posDraft.customerName),
      customerPhone: normalizeText(state.posDraft.customerPhone),
      notes: normalizeText(state.posDraft.notes),
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: totalAmount,
      totalAmount
    };

    applyInventoryMovementFromOrder(orderRecord, -1);

    if (existingOrder) {
      state.posOrders = sortPosOrders(
        state.posOrders.map((order) => (order.id === existingOrder.id ? orderRecord : order))
      );
    } else {
      state.posOrders = sortPosOrders([...state.posOrders, orderRecord]);
    }

    persistInventoryItems();
    persistPosOrders();
    reconcilePosGeneratedSales({ persist: true });
    render();
    showToast(existingOrder ? "POS order updated and Daily Sales re-synced." : "POS order saved and Daily Sales synced.");

    if (submitMode === "save-and-print") {
      printPosReceipt(orderRecord.id, { silent: true });
    }

    resetPosDraft({ silent: true, keepCounterContext: true });
  }

  function applyInventoryMovementFromOrder(order, direction) {
    const multiplier = Number(direction || 0);

    if (!Number.isFinite(multiplier) || multiplier === 0) {
      return;
    }

    const adjustments = new Map();

    order.items
      .filter((item) => item.trackInventory)
      .forEach((item) => {
        adjustments.set(
          item.productId,
          Number(((adjustments.get(item.productId) || 0) + item.quantity * multiplier).toFixed(2))
        );
      });

    if (adjustments.size === 0) {
      return;
    }

    state.inventoryItems = sortInventoryItems(
      state.inventoryItems.map((item) => {
        if (!adjustments.has(item.id) || !item.trackInventory) {
          return item;
        }

        return {
          ...item,
          quantityOnHand: Number((item.quantityOnHand + adjustments.get(item.id)).toFixed(2)),
          quantityKnown: true,
          updatedAt: new Date().toISOString()
        };
      })
    );
  }

  function getFilteredPosOrders() {
    const searchValue = normalizeText(state.posFilters.search).toLowerCase();
    const monthValue = normalizeMonthInput(state.posFilters.month);
    const areaValue = normalizeBusinessAreaId(state.posFilters.area);
    const paymentValue = normalizeText(state.posFilters.paymentMethod);

    return state.posOrders.filter((record) => {
      const haystack = [
        record.orderNumber,
        record.customerName,
        record.customerPhone,
        record.paymentMethod,
        record.notes,
        getPosOrderAreaSummary(record),
        record.items
          .map((item) =>
            [item.name, item.sku, item.barcode, getBusinessArea(item.businessAreaId || record.businessAreaId).label].join(" ")
          )
          .join(" ")
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchValue === "" || haystack.includes(searchValue);
      const matchesMonth = monthValue === "" || record.orderDate.startsWith(monthValue);
      const matchesArea = areaValue === "" || getPosOrderAreaIds(record).includes(areaValue);
      const matchesPayment = paymentValue === "" || record.paymentMethod === paymentValue;

      return matchesSearch && matchesMonth && matchesArea && matchesPayment;
    });
  }

  function startEditingPosOrder(orderId) {
    const record = state.posOrders.find((order) => order.id === orderId);

    if (!record) {
      showToast("That POS order could not be found.");
      return;
    }

    state.editingPosOrderId = record.id;
    state.posDraft = {
      orderDate: record.orderDate,
      businessAreaId: getPosOrderAreaIds(record).length > 1 ? "" : getPosOrderPrimaryAreaId(record),
      paymentMethod: record.paymentMethod,
      barcodeInput: "",
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      notes: record.notes,
      productSearch: "",
      categoryFilter: "",
      selectedProductId: "",
      quantity: 1,
      items: record.items.map((item) => ({ ...item }))
    };
    uiFocusState.pos = "posDraftProductSearch";
    navigateTo("pos", { syncHash: true });
    renderPosPage();
    showToast(`Editing ${record.orderNumber}.`);
  }

  function deletePosOrder(orderId) {
    const record = state.posOrders.find((order) => order.id === orderId);

    if (!record) {
      showToast("That POS order could not be found.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${record.orderNumber} for ${formatCurrency(record.totalAmount)}? Inventory and Daily Sales sync will be updated.`
    );

    if (!shouldDelete) {
      return;
    }

    applyInventoryMovementFromOrder(record, 1);
    state.posOrders = sortPosOrders(state.posOrders.filter((order) => order.id !== orderId));
    persistInventoryItems();
    persistPosOrders();
    reconcilePosGeneratedSales({ persist: true });

    if (state.editingPosOrderId === orderId) {
      resetPosDraft({ silent: true });
    }

    render();
    showToast("POS order deleted and Daily Sales re-synced.");
  }

  function getLowStockInventoryItems(limit = INVENTORY_LOW_STOCK_LIMIT) {
    return state.inventoryItems
      .filter((item) => item.active && item.trackInventory && item.itemType === "stock")
      .filter((item) => item.quantityOnHand <= item.minStockLevel)
      .sort((left, right) => {
        const leftGap = left.quantityOnHand - left.minStockLevel;
        const rightGap = right.quantityOnHand - right.minStockLevel;

        if (leftGap !== rightGap) {
          return leftGap - rightGap;
        }

        return left.name.localeCompare(right.name);
      })
      .slice(0, limit);
  }

  function startNewInventoryItem() {
    state.editingInventoryItemId = null;
    state.inventoryDraft = {
      ...createEmptyInventoryDraft(),
      businessAreaId: state.inventoryFilters.area || state.inventoryDraft.businessAreaId || "",
      category: state.inventoryFilters.category || ""
    };
    uiFocusState.inventory = "inventoryDraftName";
    navigateTo("inventory", { syncHash: true });
    renderInventoryPage();
    showToast("Ready to add a new inventory item.");
  }

  function getInventoryStatus(item) {
    if (!item.active) {
      return {
        label: "Archived",
        className: "tag-neutral"
      };
    }

    if (!item.trackInventory || item.itemType === "service") {
      return {
        label: "Service / Not Tracked",
        className: "tag-manual"
      };
    }

    if (item.quantityOnHand <= 0) {
      return {
        label: "Out of Stock",
        className: "tag-risk"
      };
    }

    if (item.minStockLevel > 0 && item.quantityOnHand <= item.minStockLevel) {
      return {
        label: "Low Stock",
        className: "tag-warning"
      };
    }

    return {
      label: "In Stock",
      className: "tag-pos"
    };
  }

  function getInventoryStockValue(item) {
    return item.trackInventory ? Number((Math.max(item.quantityOnHand, 0) * item.costPrice).toFixed(2)) : 0;
  }

  function getFilteredInventoryItems() {
    const searchValue = normalizeText(state.inventoryFilters.search).toLowerCase();
    const areaValue = normalizeBusinessAreaId(state.inventoryFilters.area);
    const categoryValue = normalizeText(state.inventoryFilters.category);
    const statusValue = normalizeText(state.inventoryFilters.status);
    const itemTypeValue = normalizeText(state.inventoryFilters.itemType).toLowerCase();

    const filteredItems = state.inventoryItems.filter((item) => {
      const status = getInventoryStatus(item);
      const haystack = [
        item.name,
        item.sku,
        item.barcode,
        item.category,
        item.sourceCategory,
        item.notes,
        getBusinessArea(item.businessAreaId).label
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchValue === "" || haystack.includes(searchValue);
      const matchesArea = areaValue === "" || item.businessAreaId === areaValue;
      const matchesCategory = categoryValue === "" || item.category === categoryValue;
      const matchesStatus = statusValue === "" || status.label === statusValue;
      const matchesType = itemTypeValue === "" || item.itemType === itemTypeValue;

      return matchesSearch && matchesArea && matchesCategory && matchesStatus && matchesType;
    });

    if (!searchValue) {
      return filteredItems;
    }

    return filteredItems
      .slice()
      .sort((left, right) => buildInventorySearchScore(right, searchValue) - buildInventorySearchScore(left, searchValue));
  }

  function getInventoryCategoryOptions() {
    const areaValue = normalizeBusinessAreaId(state.inventoryFilters.area);
    const categories = state.inventoryItems
      .filter((item) => areaValue === "" || item.businessAreaId === areaValue)
      .map((item) => item.category);

    return mergeUniqueOptions([], categories).map((category) => ({
      value: category,
      label: category
    }));
  }

  function duplicateInventoryItem(itemId) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    state.editingInventoryItemId = null;
    state.inventoryDraft = {
      ...item,
      id: "",
      sku: "",
      barcode: "",
      sourceCatalogId: "",
      name: `${item.name} Copy`,
      active: true,
      userCreated: true
    };
    uiFocusState.inventory = "inventoryDraftName";
    navigateTo("inventory", { syncHash: true });
    renderInventoryPage();
    showToast(`${item.name} copied into a new inventory draft.`);
  }

  function adjustInventoryStock(itemId, quantityChange) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    if (item.itemType === "service" || !item.trackInventory) {
      showToast("This item is marked as a service and does not use stock quantity.");
      return;
    }

    const nextQuantity = Math.max(
      Number((parseOptionalAmount(item.quantityOnHand) + Number(quantityChange || 0)).toFixed(2)),
      0
    );

    state.inventoryItems = sortInventoryItems(
      state.inventoryItems.map((record) =>
        record.id === itemId
          ? {
              ...record,
              quantityOnHand: nextQuantity,
              quantityKnown: true,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    persistInventoryItems();
    renderInventoryPage();
    showToast(`${item.name} stock is now ${formatInventoryQuantity(nextQuantity)}.`);
  }

  function promptSetInventoryQuantity(itemId) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    if (item.itemType === "service" || !item.trackInventory) {
      showToast("This item is marked as a service and does not use stock quantity.");
      return;
    }

    const nextValue = window.prompt(
      `Set the quantity on hand for ${item.name}.`,
      String(item.quantityOnHand || 0)
    );

    if (nextValue === null) {
      return;
    }

    const parsedValue = parseAmount(nextValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      showToast("Enter a valid stock quantity.");
      return;
    }

    state.inventoryItems = sortInventoryItems(
      state.inventoryItems.map((record) =>
        record.id === itemId
          ? {
              ...record,
              quantityOnHand: Number(parsedValue.toFixed(2)),
              quantityKnown: true,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    persistInventoryItems();
    renderInventoryPage();
    showToast(`${item.name} stock updated.`);
  }

  function resetInventoryDraft(options = {}) {
    state.editingInventoryItemId = null;
    state.inventoryDraft = {
      ...createEmptyInventoryDraft(),
      businessAreaId: options.keepContext
        ? normalizeBusinessAreaId(options.businessAreaId || state.inventoryFilters.area)
        : "",
      category: options.keepContext
        ? normalizeText(options.category || state.inventoryFilters.category)
        : ""
    };
    if (options.focusTarget) {
      uiFocusState.inventory = options.focusTarget;
    }
    renderInventoryPage();

    if (!options.silent) {
      showToast("Inventory form cleared.");
    }
  }

  function startEditingInventoryItem(itemId) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    state.editingInventoryItemId = item.id;
    state.inventoryDraft = { ...item };
    uiFocusState.inventory = "inventoryDraftName";
    navigateTo("inventory", { syncHash: true });
    renderInventoryPage();
    showToast(`Editing ${item.name}.`);
  }

  function handleInventorySubmit(event) {
    event.preventDefault();

    const draft = {
      ...state.inventoryDraft,
      businessAreaId: normalizeBusinessAreaId(state.inventoryDraft.businessAreaId),
      name: normalizeText(state.inventoryDraft.name),
      category: normalizeText(state.inventoryDraft.category),
      sourceCategory: normalizeText(state.inventoryDraft.sourceCategory),
      barcode: normalizeText(state.inventoryDraft.barcode),
      notes: normalizeText(state.inventoryDraft.notes),
      itemType:
        normalizeText(state.inventoryDraft.itemType).toLowerCase() === "service"
          ? "service"
          : "stock",
      trackInventory:
        normalizeText(state.inventoryDraft.itemType).toLowerCase() === "service"
          ? false
          : Boolean(state.inventoryDraft.trackInventory),
      quantityOnHand: parseOptionalAmount(state.inventoryDraft.quantityOnHand),
      minStockLevel: Math.max(parsePositiveInteger(state.inventoryDraft.minStockLevel), 0),
      salesPrice: parseOptionalAmount(state.inventoryDraft.salesPrice),
      costPrice: parseOptionalAmount(state.inventoryDraft.costPrice)
    };

    if (!draft.businessAreaId || !draft.name || !draft.category) {
      showToast("Business area, item name, and category are required.");
      return;
    }

    if (
      draft.barcode &&
      state.inventoryItems.some(
        (item) => item.id !== state.editingInventoryItemId && normalizeInventoryCode(item.barcode) === normalizeInventoryCode(draft.barcode)
      )
    ) {
      showToast("That barcode is already assigned to another inventory item.");
      return;
    }

    if (!draft.sku) {
      draft.sku = buildInventorySku(draft.businessAreaId, draft.name);
    }

    if (draft.itemType === "service") {
      draft.trackInventory = false;
      draft.quantityOnHand = 0;
      draft.minStockLevel = 0;
    }

    const nextRecord = sanitizeStoredInventoryItem({
      ...draft,
      id: state.editingInventoryItemId || draft.id || generateId(),
      sourceCatalogId: draft.sourceCatalogId,
      createdAt:
        state.inventoryItems.find((item) => item.id === state.editingInventoryItemId)?.createdAt ||
        new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: draft.active !== false,
      userCreated:
        draft.userCreated ||
        !normalizeText(draft.sourceCatalogId)
    });

    if (!nextRecord) {
      showToast("That inventory item could not be saved.");
      return;
    }

    const existing = state.inventoryItems.find((item) => item.id === nextRecord.id);

    if (existing) {
      state.inventoryItems = sortInventoryItems(
        state.inventoryItems.map((item) => (item.id === nextRecord.id ? nextRecord : item))
      );
    } else {
      state.inventoryItems = sortInventoryItems([...state.inventoryItems, nextRecord]);
    }

    persistInventoryItems();
    render();
    resetInventoryDraft({
      silent: true,
      keepContext: true,
      businessAreaId: nextRecord.businessAreaId,
      category: nextRecord.category,
      focusTarget: "inventoryDraftName"
    });
    showToast(existing ? "Inventory item updated." : "Inventory item added.");
  }

  function toggleInventoryItemActive(itemId) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    state.inventoryItems = sortInventoryItems(
      state.inventoryItems.map((record) =>
        record.id === itemId
          ? {
              ...record,
              active: !record.active,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    );
    persistInventoryItems();
    renderInventoryPage();
    showToast(item.active ? "Inventory item archived." : "Inventory item restored.");
  }

  function deleteInventoryItem(itemId) {
    const item = state.inventoryItems.find((record) => record.id === itemId);

    if (!item) {
      showToast("That inventory item could not be found.");
      return;
    }

    if (!item.userCreated) {
      showToast("Catalog items are archived instead of deleted. Use the archive button.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${item.name} from inventory? This should only be used for items you added manually.`
    );

    if (!shouldDelete) {
      return;
    }

    state.inventoryItems = sortInventoryItems(state.inventoryItems.filter((record) => record.id !== itemId));
    persistInventoryItems();

    if (state.editingInventoryItemId === itemId) {
      resetInventoryDraft({ silent: true });
    }

    renderInventoryPage();
    showToast("Inventory item deleted.");
  }

  function buildDataAttributes(attributes = {}) {
    return Object.entries(attributes)
      .filter(([, value]) => value !== undefined && value !== null && String(value) !== "")
      .map(([key, value]) => `data-${key}="${escapeHtml(String(value))}"`)
      .join(" ");
  }

  function buildPosProductCardMarkup(item, options = {}) {
    const selected = options.selectedProductId === item.id;
    const draftQuantity = Math.max(parsePositiveInteger(options.draftQuantity), 1);
    const stockLabel = item.trackInventory
      ? `Stock ${formatInventoryQuantity(item.quantityOnHand)}`
      : "Service / not deducted";
    const secondaryAddLabel = draftQuantity > 1 ? `+${draftQuantity}` : "Add";
    const identityLabel = buildInventoryIdentityLabel(item) || getBusinessArea(item.businessAreaId).shortLabel;

    return `
      <article class="product-card ${selected ? "is-selected" : ""} ${options.compact ? "is-compact" : ""}">
        <div class="product-card-top">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="tag tag-category">${escapeHtml(item.category)}</span>
        </div>
        <span class="table-secondary">${escapeHtml(identityLabel)}</span>
        <div class="product-card-meta">
          <strong>${formatCurrency(item.salesPrice)}</strong>
          <span>${escapeHtml(stockLabel)}</span>
        </div>
        <div class="product-card-actions">
          <button
            class="edit-btn"
            data-pos-action="choose-product"
            ${buildDataAttributes({ "product-id": item.id })}
            type="button"
          >
            Preview
          </button>
          <button
            class="button button-primary quick-action-button"
            data-pos-action="quick-add-item"
            ${buildDataAttributes({ "product-id": item.id, quantity: 1 })}
            type="button"
          >
            +1
          </button>
          <button
            class="button button-secondary quick-action-button"
            data-pos-action="quick-add-item"
            ${buildDataAttributes({ "product-id": item.id, quantity: draftQuantity })}
            type="button"
          >
            ${escapeHtml(secondaryAddLabel)}
          </button>
        </div>
      </article>
    `;
  }

  function buildPosProductRowMarkup(item, options = {}) {
    const selected = options.selectedProductId === item.id;
    const draftQuantity = Math.max(parsePositiveInteger(options.draftQuantity), 1);
    const stockLabel = item.trackInventory
      ? `Stock ${formatInventoryQuantity(item.quantityOnHand)}`
      : "Service item";
    const areaLabel = getBusinessArea(item.businessAreaId).shortLabel;
    const identityLabel = buildInventoryIdentityLabel(item);
    const addLabel = draftQuantity > 1 ? `+${draftQuantity}` : "Add";

    return `
      <article class="pos-product-row ${selected ? "is-selected" : ""}">
        <div class="pos-product-row-main">
          <div class="pos-product-row-top">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="tag tag-category">${escapeHtml(item.category)}</span>
          </div>
          <span class="table-secondary">${escapeHtml(areaLabel)} • ${escapeHtml(stockLabel)}${
      identityLabel ? ` • ${escapeHtml(identityLabel)}` : ""
    }</span>
        </div>
        <div class="pos-product-row-price">
          <strong>${formatCurrency(item.salesPrice)}</strong>
        </div>
        <div class="pos-product-row-actions">
          <button
            class="edit-btn"
            data-pos-action="choose-product"
            ${buildDataAttributes({ "product-id": item.id })}
            type="button"
          >
            View
          </button>
          <button
            class="button button-primary quick-action-button"
            data-pos-action="quick-add-item"
            ${buildDataAttributes({ "product-id": item.id, quantity: draftQuantity })}
            type="button"
          >
            ${escapeHtml(addLabel)}
          </button>
          <button
            class="button button-secondary quick-action-button"
            data-pos-action="quick-add-item"
            ${buildDataAttributes({ "product-id": item.id, quantity: 1 })}
            type="button"
          >
            +1
          </button>
        </div>
      </article>
    `;
  }

  function hasActivePosOrderFilters() {
    return Boolean(
      normalizeText(state.posFilters.search) ||
        normalizeMonthInput(state.posFilters.month) ||
        normalizeBusinessAreaId(state.posFilters.area) ||
        normalizeText(state.posFilters.paymentMethod)
    );
  }

  function buildInventoryLowStockCardMarkup(item) {
    return `
      <article class="inventory-low-stock-card">
        <div class="inventory-low-stock-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="tag ${escapeHtml(getInventoryStatus(item).className)}">${escapeHtml(
            getInventoryStatus(item).label
          )}</span>
        </div>
        <span class="table-secondary">${escapeHtml(getBusinessArea(item.businessAreaId).shortLabel)} • ${escapeHtml(
          item.category
        )}</span>
        <div class="inventory-low-stock-meta">
          <span>On hand ${escapeHtml(formatInventoryQuantity(item.quantityOnHand))}</span>
          <span>Min ${escapeHtml(String(item.minStockLevel || 0))}</span>
        </div>
        <div class="stock-adjust-row">
          <button
            class="edit-btn"
            data-inventory-action="adjust-stock"
            ${buildDataAttributes({ id: item.id, quantity: -1 })}
            type="button"
          >
            -1
          </button>
          <button
            class="edit-btn"
            data-inventory-action="adjust-stock"
            ${buildDataAttributes({ id: item.id, quantity: 1 })}
            type="button"
          >
            +1
          </button>
          <button
            class="edit-btn"
            data-inventory-action="adjust-stock"
            ${buildDataAttributes({ id: item.id, quantity: 5 })}
            type="button"
          >
            +5
          </button>
          <button
            class="edit-btn"
            data-inventory-action="set-stock"
            ${buildDataAttributes({ id: item.id })}
            type="button"
          >
            Set Qty
          </button>
        </div>
      </article>
    `;
  }

  function renderPosPage(options = {}) {
    const root = document.getElementById("posViewRoot");

    if (!root) {
      return;
    }

    const areaOptions = getPosBusinessAreaOptions();
    const paymentOptions = mergeUniqueOptions(BASE_PAYMENT_METHODS, ["Mixed"]);
    const visibleProducts = getPosVisibleProducts();
    const matchingProductCount = getPosVisibleProducts(Number.MAX_SAFE_INTEGER).length;
    const frequentProducts = getFrequentPosProducts();
    const selectedProduct = getSelectedPosProduct();
    const filteredOrders = getFilteredPosOrders();
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsSold = filteredOrders.reduce((sum, order) => sum + order.itemCount, 0);
    const todayKey = getTodayInputValue();
    const todaySales = state.posOrders
      .filter((order) => order.orderDate === todayKey)
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const cartTotal = state.posDraft.items.reduce((sum, item) => sum + item.totalAmount, 0);
    const currentAreaLabel = state.posDraft.businessAreaId
      ? getBusinessArea(state.posDraft.businessAreaId).shortLabel
      : "All POS Areas";
    const cartAreaLabel = getPosCartAreaLabel();
    const cartAreaSummary = getPosCartAreaIds()
      .map((areaId) => getBusinessArea(areaId).shortLabel)
      .join(", ");
    const cartItemCount = state.posDraft.items.reduce((sum, item) => sum + item.quantity, 0);
    const historyOpen = hasActivePosOrderFilters() || Boolean(state.editingPosOrderId);

    root.innerHTML = `
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Counter Sales</p>
            <h3>${escapeHtml(
              state.editingPosOrderId ? "Edit POS Order" : "Fast POS Checkout"
            )}</h3>
          </div>
          <div class="module-actions">
            <button class="button button-secondary" data-pos-action="export-csv" type="button">
              Export POS CSV
            </button>
            <a class="button button-ghost button-link" href="${escapeHtml(
              POS_CATALOG_WORKBOOK_PATH
            )}" download>
              Download Cleaned Catalog
            </a>
          </div>
        </div>

        <div class="pos-counter-strip">
          <article class="stat-card">
            <span>Today</span>
            <strong>${formatCurrency(todaySales)}</strong>
          </article>
          <article class="stat-card">
            <span>Cart</span>
            <strong>${formatCurrency(cartTotal)}</strong>
          </article>
          <article class="stat-card">
            <span>Items</span>
            <strong>${escapeHtml(String(cartItemCount))}</strong>
          </article>
          <article class="stat-card">
            <span>Serving Area</span>
            <strong>${escapeHtml(currentAreaLabel)}</strong>
          </article>
        </div>

        <p class="muted-text pos-serving-note">
          Serve faster with one compact counter view: set area and payment once, scan or search, tap add, then save. Press <strong>/</strong> to jump to product search, or scan into the barcode box and press <strong>Enter</strong>.
        </p>

        <form id="posOrderForm" novalidate>
          <div class="mini-form-grid pos-meta-grid pos-meta-grid-tight">
            <label>
              <span>Payment Method</span>
              <select id="posDraftPaymentMethod">
                ${buildSelectMarkup(
                  paymentOptions.map((item) => ({ value: item, label: item })),
                  state.posDraft.paymentMethod,
                  "Choose payment method"
                )}
              </select>
            </label>

            <label>
              <span>Order Date</span>
              <input id="posDraftOrderDate" type="date" value="${escapeHtml(
                state.posDraft.orderDate
              )}" required />
            </label>

            <label>
              <span>POS Area Filter</span>
              <select id="posDraftBusinessArea">
                ${buildSelectMarkup(areaOptions, state.posDraft.businessAreaId, "All POS Areas")}
              </select>
            </label>

            <div class="pos-quick-tools">
              <button class="button button-ghost" data-pos-action="focus-search" type="button">
                Focus Search
              </button>
              <button class="button button-ghost" data-pos-action="reset-draft" type="button">
                New Order
              </button>
            </div>
          </div>

          <div class="pos-builder-grid pos-builder-grid-tight">
            <section class="section-card inset-card pos-catalog-card">
              <div class="section-heading compact">
                <div>
                  <p class="kicker">Fast Search</p>
                  <h3>Tap To Add</h3>
                </div>
                <span class="table-secondary">${escapeHtml(String(matchingProductCount))} matching item${
      matchingProductCount === 1 ? "" : "s"
    }</span>
              </div>

              <div class="mini-form-grid pos-search-grid">
                <label class="wide-field">
                  <span>Barcode Scan</span>
                  <div class="scanner-row">
                    <input
                      id="posDraftBarcode"
                      type="text"
                      value="${escapeHtml(state.posDraft.barcodeInput)}"
                      placeholder="Scan barcode or SKU, then press Enter"
                      autocomplete="off"
                      spellcheck="false"
                    />
                    <button class="button button-primary" data-pos-action="scan-barcode" type="button">
                      Scan Add
                    </button>
                  </div>
                </label>

                <label class="wide-field">
                  <span>Search Product</span>
                  <input
                    id="posDraftProductSearch"
                    type="search"
                    value="${escapeHtml(state.posDraft.productSearch)}"
                    placeholder="Search by product, SKU, or category..."
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select id="posDraftCategoryFilter">
                    ${buildSelectMarkup(
                      getPosCategoryOptions(),
                      state.posDraft.categoryFilter,
                      "All Categories"
                    )}
                  </select>
                </label>

                <label>
                  <span>Quantity</span>
                  <input
                    id="posDraftQuantity"
                    type="number"
                    min="1"
                    step="1"
                    value="${escapeHtml(String(state.posDraft.quantity || 1))}"
                  />
                </label>
              </div>

              ${
                selectedProduct
                  ? `
                    <div class="inventory-helper-card pos-selected-product-card">
                      <strong>${escapeHtml(selectedProduct.name)}</strong>
                      <span>${escapeHtml(getBusinessArea(selectedProduct.businessAreaId).shortLabel)} • ${escapeHtml(
                        selectedProduct.category
                      )}</span>
                      ${
                        buildInventoryIdentityLabel(selectedProduct)
                          ? `<span>${escapeHtml(buildInventoryIdentityLabel(selectedProduct))}</span>`
                          : ""
                      }
                      <span>Sell ${formatCurrency(selectedProduct.salesPrice)} • ${
                        selectedProduct.trackInventory
                          ? `Stock ${formatInventoryQuantity(selectedProduct.quantityOnHand)}`
                          : "Service / not deducted from stock"
                      }</span>
                    </div>
                  `
                  : `
                    <div class="empty-state pos-inline-empty-state">Search across all POS areas, or choose one area filter if you want a narrower counter view.</div>
                  `
              }

              ${
                frequentProducts.length > 0
                  ? `
                    <div class="compact-section">
                      <div class="results-meta">
                        <strong>Frequent Items</strong>
                        <span>${escapeHtml(currentAreaLabel)}</span>
                      </div>
                      <div class="pos-frequent-rail">
                        ${frequentProducts
                          .map((item) =>
                            buildPosProductCardMarkup(item, {
                              selectedProductId: selectedProduct?.id || "",
                              draftQuantity: state.posDraft.quantity,
                              compact: true
                            })
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                  : ""
              }

              <div class="compact-section pos-results-section">
                <div class="results-meta">
                  <strong>Matching Products</strong>
                  <span>${escapeHtml(String(matchingProductCount))} match${
      matchingProductCount === 1 ? "" : "es"
    }${matchingProductCount > visibleProducts.length ? ` • showing first ${visibleProducts.length}` : ""}</span>
                </div>
                ${
                  visibleProducts.length === 0
                    ? `<div class="empty-state">No products match this search yet.</div>`
                    : `
                      <div class="pos-results-list">
                        ${visibleProducts
                          .map((item) =>
                            buildPosProductRowMarkup(item, {
                              selectedProductId: selectedProduct?.id || "",
                              draftQuantity: state.posDraft.quantity
                            })
                          )
                          .join("")}
                      </div>
                    `
                }
              </div>
            </section>

            <section class="section-card inset-card cart-summary-card pos-checkout-card">
              <div class="section-heading compact">
                <div>
                  <p class="kicker">Current Cart</p>
                  <h3>Total ${formatCurrency(cartTotal)}</h3>
                </div>
                <button class="button button-ghost" data-pos-action="reset-draft" type="button">
                  Clear Cart
                </button>
              </div>

              <div class="cart-stat-row">
                <article class="stat-card">
                  <span>Items</span>
                  <strong>${escapeHtml(String(cartItemCount))}</strong>
                </article>
                <article class="stat-card">
                  <span>Areas</span>
                  <strong>${escapeHtml(cartAreaLabel)}</strong>
                </article>
              </div>

              ${
                cartAreaSummary && getPosCartAreaIds().length > 1
                  ? `<p class="muted-text">${escapeHtml(cartAreaSummary)}. Daily Sales will split this order automatically by area.</p>`
                  : ""
              }

              ${
                state.posDraft.items.length === 0
                  ? `<div class="empty-state">No items in the cart yet.</div>`
                  : `
                    <div class="table-wrap compact-table-wrap cart-items-shell">
                      <table>
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${state.posDraft.items
                            .map(
                              (item) => `
                                <tr>
                                  <td>
                                    <span class="table-primary">${escapeHtml(item.name)}</span>
                                    <span class="table-secondary">${escapeHtml(
                                      `${item.category} • ${getBusinessArea(item.businessAreaId).shortLabel}`
                                    )}</span>
                                  </td>
                                  <td>${escapeHtml(String(item.quantity))}</td>
                                  <td>${formatCurrency(item.unitPrice)}</td>
                                  <td class="amount-cell">${formatCurrency(item.totalAmount)}</td>
                                  <td>
                                    <div class="row-actions">
                                      <button class="edit-btn" data-pos-action="decrement-cart-item" ${buildDataAttributes({
                                        "item-id": item.productId
                                      })} type="button">
                                        -1
                                      </button>
                                      <button class="edit-btn" data-pos-action="increment-cart-item" ${buildDataAttributes({
                                        "item-id": item.productId
                                      })} type="button">
                                        +1
                                      </button>
                                      <button class="delete-btn" data-pos-action="remove-cart-item" ${buildDataAttributes({
                                        "item-id": item.productId
                                      })} type="button">
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                  `
              }

              <details class="pos-optional-panel">
                <summary>Customer details and notes</summary>
                <div class="mini-form-grid">
                  <label>
                    <span>Customer Name</span>
                    <input id="posDraftCustomerName" type="text" value="${escapeHtml(
                      state.posDraft.customerName
                    )}" placeholder="Optional customer name" />
                  </label>

                  <label>
                    <span>Customer Phone</span>
                    <input id="posDraftCustomerPhone" type="text" value="${escapeHtml(
                      state.posDraft.customerPhone
                    )}" placeholder="Optional phone number" />
                  </label>

                  <label class="wide-field">
                    <span>Notes</span>
                    <textarea id="posDraftNotes" rows="2" placeholder="Promo, split payment, or special note">${escapeHtml(
                      state.posDraft.notes
                    )}</textarea>
                  </label>
                </div>
              </details>

              <div class="form-actions pos-checkout-actions">
                <button class="button button-primary" data-pos-submit="save" type="submit">
                  ${escapeHtml(state.editingPosOrderId ? "Update POS Order" : "Save POS Order")}
                </button>
                <button class="button button-secondary" data-pos-submit="save-and-print" type="submit">
                  ${escapeHtml(state.editingPosOrderId ? "Update & Print Receipt" : "Save & Print Receipt")}
                </button>
                <button class="button button-secondary" data-pos-action="reset-draft" type="button">
                  New Order
                </button>
              </div>
            </section>
          </div>

          <div class="quick-panel-grid pos-quick-panel-grid">
            <article class="quick-panel-card">
              <span class="kicker">Quick Area</span>
              <div class="quick-chip-row">
                <button
                  class="quick-chip ${state.posDraft.businessAreaId === "" ? "is-active" : ""}"
                  data-pos-action="set-area"
                  type="button"
                >
                  All POS Areas
                </button>
                ${areaOptions
                  .map(
                    (area) => `
                      <button
                        class="quick-chip ${state.posDraft.businessAreaId === area.value ? "is-active" : ""}"
                        data-pos-action="set-area"
                        ${buildDataAttributes({ "area-id": area.value })}
                        type="button"
                      >
                        ${escapeHtml(getBusinessArea(area.value).shortLabel)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </article>

            <article class="quick-panel-card">
              <span class="kicker">Quick Quantity</span>
              <div class="quick-chip-row">
                ${[1, 2, 3, 5]
                  .map(
                    (quantity) => `
                      <button
                        class="quick-chip ${state.posDraft.quantity === quantity ? "is-active" : ""}"
                        data-pos-action="set-draft-quantity"
                        ${buildDataAttributes({ quantity })}
                        type="button"
                      >
                        x${escapeHtml(String(quantity))}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </article>
          </div>
        </form>
      </section>

      <section class="section-card pos-history-shell">
        <details ${historyOpen ? "open" : ""}>
          <summary class="pos-history-summary">
            <div>
              <p class="kicker">Saved Orders</p>
              <h3>POS Order History</h3>
            </div>
            <div class="pos-history-summary-meta">
              <strong>${escapeHtml(String(filteredOrders.length))} order${
      filteredOrders.length === 1 ? "" : "s"
    } in view</strong>
              <span>POS sales ${formatCurrency(totalSales)} • Items sold ${escapeHtml(
      String(totalItemsSold)
    )} • Today ${formatCurrency(todaySales)}</span>
            </div>
          </summary>

          <div class="pos-history-body">
            <div class="module-actions">
              <button class="button button-secondary" data-pos-action="focus-order-search" type="button">
                Focus Order Search
              </button>
              <button class="button button-ghost" data-pos-action="clear-filters" type="button">
                Clear Filters
              </button>
            </div>

            <div class="filter-grid">
              <label>
                <span>Search</span>
                <input id="posFilterSearch" type="search" value="${escapeHtml(
                  state.posFilters.search
                )}" placeholder="Order number, customer, or item..." />
              </label>

              <label>
                <span>Month</span>
                <input id="posFilterMonth" type="month" value="${escapeHtml(state.posFilters.month)}" />
              </label>

              <label>
                <span>Business Area</span>
                <select id="posFilterArea">
                  ${buildSelectMarkup(areaOptions, state.posFilters.area, "All Areas")}
                </select>
              </label>

              <label>
                <span>Payment Method</span>
                <select id="posFilterPaymentMethod">
                  ${buildSelectMarkup(
                    paymentOptions.map((item) => ({ value: item, label: item })),
                    state.posFilters.paymentMethod,
                    "All Methods"
                  )}
                </select>
              </label>
            </div>

            <div class="table-wrap compact-table-wrap pos-history-table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Date / Order</th>
                    <th>Areas</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    filteredOrders.length === 0
                      ? `
                        <tr>
                          <td colspan="7" class="empty-state">
                            No POS orders match the current view yet.
                          </td>
                        </tr>
                      `
                      : filteredOrders
                          .map(
                            (record) => `
                              <tr>
                                <td>
                                  <span class="table-primary">${escapeHtml(
                                    formatDisplayDate(record.orderDate)
                                  )}</span>
                                  <span class="table-secondary">${escapeHtml(record.orderNumber)}</span>
                                </td>
                                <td>
                                  <span class="tag tag-area">${escapeHtml(getPosOrderAreaLabel(record))}</span>
                                  <span class="table-secondary">${escapeHtml(getPosOrderAreaSummary(record))}</span>
                                </td>
                                <td>
                                  <span class="table-primary">${escapeHtml(record.customerName || "Walk-in Customer")}</span>
                                  <span class="table-secondary">${escapeHtml(record.customerPhone || "No phone saved")}</span>
                                </td>
                                <td>${escapeHtml(record.paymentMethod)}</td>
                                <td>
                                  <span class="table-primary">${escapeHtml(String(record.itemCount))} item${
                              record.itemCount === 1 ? "" : "s"
                            }</span>
                                  <span class="table-secondary">${escapeHtml(
                                    record.items
                                      .slice(0, 3)
                                      .map((item) => item.name)
                                      .join(", ") || "No items"
                                  )}</span>
                                </td>
                                <td class="amount-cell">${formatCurrency(record.totalAmount)}</td>
                                <td>
                                  <div class="row-actions">
                                    <button class="edit-btn" data-pos-action="print-receipt" ${buildDataAttributes({
                                      id: record.id
                                    })} type="button">
                                      Receipt
                                    </button>
                                    <button class="edit-btn" data-pos-action="edit-order" ${buildDataAttributes({
                                      id: record.id
                                    })} type="button">
                                      Edit
                                    </button>
                                    <button class="delete-btn" data-pos-action="delete-order" ${buildDataAttributes({
                                      id: record.id
                                    })} type="button">
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `
                          )
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>
    `;

    restoreModuleFocus("pos", options.focusState || {});

    if (options.preserveScroll) {
      restoreWindowScrollPosition(options.scrollState);
    }
  }

  function renderInventoryPage() {
    const root = document.getElementById("inventoryViewRoot");

    if (!root) {
      return;
    }

    const filteredItems = getFilteredInventoryItems();
    const stockTrackedItems = state.inventoryItems.filter((item) => item.trackInventory && item.active);
    const lowStockCount = stockTrackedItems.filter(
      (item) => item.quantityOnHand <= item.minStockLevel
    ).length;
    const outOfStockCount = stockTrackedItems.filter((item) => item.quantityOnHand <= 0).length;
    const stockValue = stockTrackedItems.reduce((sum, item) => sum + getInventoryStockValue(item), 0);
    const categoryOptions = getInventoryCategoryOptions();
    const lowStockItems = getLowStockInventoryItems();

    root.innerHTML = `
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Stock Control</p>
            <h3>Fast Inventory Desk</h3>
          </div>
          <div class="module-actions">
            <button class="button button-secondary" data-inventory-action="focus-search" type="button">
              Focus Search
            </button>
            <button class="button button-ghost" data-inventory-action="clear-filters" type="button">
              Clear Filters
            </button>
            <button class="button button-primary" data-inventory-action="new-item" type="button">
              Add New Item
            </button>
            <button class="button button-secondary" data-inventory-action="export-csv" type="button">
              Export Inventory CSV
            </button>
            <a class="button button-ghost button-link" href="${escapeHtml(
              POS_CATALOG_WORKBOOK_PATH
            )}" download>
              Download Cleaned Catalog
            </a>
          </div>
        </div>

        <p class="muted-text">
          Search quickly, restock from the low-stock desk, or open an item into the editor when pricing or details change. Press <strong>/</strong> to jump into inventory search.
        </p>

        <div class="filter-grid">
          <label>
            <span>Search</span>
            <input id="inventoryFilterSearch" type="search" value="${escapeHtml(
              state.inventoryFilters.search
            )}" placeholder="Item, barcode, SKU, category..." />
          </label>

          <label>
            <span>Business Area</span>
            <select id="inventoryFilterArea">
              ${buildSelectMarkup(
                getBusinessAreaOptions(),
                state.inventoryFilters.area,
                "All Areas"
              )}
            </select>
          </label>

          <label>
            <span>Category</span>
            <select id="inventoryFilterCategory">
              ${buildSelectMarkup(
                categoryOptions,
                state.inventoryFilters.category,
                "All Categories"
              )}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select id="inventoryFilterStatus">
              ${buildSelectMarkup(
                [
                  { value: "In Stock", label: "In Stock" },
                  { value: "Low Stock", label: "Low Stock" },
                  { value: "Out of Stock", label: "Out of Stock" },
                  { value: "Service / Not Tracked", label: "Service / Not Tracked" },
                  { value: "Archived", label: "Archived" }
                ],
                state.inventoryFilters.status,
                "All Statuses"
              )}
            </select>
          </label>

          <label>
            <span>Item Type</span>
            <select id="inventoryFilterItemType">
              ${buildSelectMarkup(
                [
                  { value: "stock", label: "Stock Item" },
                  { value: "service", label: "Service Item" }
                ],
                state.inventoryFilters.itemType,
                "All Types"
              )}
            </select>
          </label>
        </div>

        <div class="results-meta">
          <strong>Showing ${escapeHtml(String(filteredItems.length))} of ${escapeHtml(
      String(state.inventoryItems.length)
    )} items</strong>
          <span>Tracked stock ${escapeHtml(String(stockTrackedItems.length))} • Low ${escapeHtml(
      String(lowStockCount)
    )} • Out ${escapeHtml(String(outOfStockCount))} • Value ${formatCurrency(stockValue)}</span>
        </div>
      </section>

      <section class="page-grid compact-page-grid inventory-page-grid">
        <section class="section-card">
          <div class="section-heading">
            <div>
              <p class="kicker">Item Editor</p>
              <h3>${escapeHtml(
                state.editingInventoryItemId ? "Edit Inventory Item" : "Add Or Update Item"
              )}</h3>
            </div>
          </div>

          <form id="inventoryItemForm" novalidate>
            <div class="mini-form-grid">
              <label>
                <span>Business Area</span>
                <select id="inventoryDraftArea" required>
                  ${buildSelectMarkup(
                    getBusinessAreaOptions(),
                    state.inventoryDraft.businessAreaId,
                    "Choose business area"
                  )}
                </select>
              </label>

              <label>
                <span>SKU</span>
                <input id="inventoryDraftSku" type="text" value="${escapeHtml(
                  state.inventoryDraft.sku
                )}" placeholder="Auto-generated if left blank" />
              </label>

              <label>
                <span>Barcode</span>
                <input id="inventoryDraftBarcode" type="text" value="${escapeHtml(
                  state.inventoryDraft.barcode
                )}" placeholder="Scan or type barcode" autocomplete="off" spellcheck="false" />
              </label>

              <label class="wide-field">
                <span>Item Name</span>
                <input id="inventoryDraftName" type="text" value="${escapeHtml(
                  state.inventoryDraft.name
                )}" placeholder="Product or service name" required />
              </label>

              <label>
                <span>Category</span>
                <input id="inventoryDraftCategory" type="text" value="${escapeHtml(
                  state.inventoryDraft.category
                )}" placeholder="Normalized category" required />
              </label>

              <label>
                <span>Source Category</span>
                <input id="inventoryDraftSourceCategory" type="text" value="${escapeHtml(
                  state.inventoryDraft.sourceCategory
                )}" placeholder="Original workbook category" />
              </label>

              <label>
                <span>Item Type</span>
                <select id="inventoryDraftItemType">
                  ${buildSelectMarkup(
                    [
                      { value: "stock", label: "Stock Item" },
                      { value: "service", label: "Service Item" }
                    ],
                    state.inventoryDraft.itemType,
                    "Choose type"
                  )}
                </select>
              </label>

              <label>
                <span>Sales Price</span>
                <input id="inventoryDraftSalesPrice" type="number" min="0" step="0.01" value="${escapeHtml(
                  String(state.inventoryDraft.salesPrice || 0)
                )}" />
              </label>

              <label>
                <span>Cost Price</span>
                <input id="inventoryDraftCostPrice" type="number" min="0" step="0.01" value="${escapeHtml(
                  String(state.inventoryDraft.costPrice || 0)
                )}" />
              </label>

              <label>
                <span>Quantity On Hand</span>
                <input id="inventoryDraftQuantity" type="number" min="0" step="0.01" value="${escapeHtml(
                  String(state.inventoryDraft.quantityOnHand || 0)
                )}" ${
                  state.inventoryDraft.itemType === "service" ? "disabled" : ""
                } />
              </label>

              <label>
                <span>Low Stock Level</span>
                <input id="inventoryDraftMinStockLevel" type="number" min="0" step="1" value="${escapeHtml(
                  String(state.inventoryDraft.minStockLevel || 0)
                )}" ${
                  !state.inventoryDraft.trackInventory || state.inventoryDraft.itemType === "service"
                    ? "disabled"
                    : ""
                } />
              </label>

              <label class="checkbox-field">
                <input id="inventoryDraftTrackInventory" type="checkbox" ${
                  state.inventoryDraft.trackInventory ? "checked" : ""
                } ${state.inventoryDraft.itemType === "service" ? "disabled" : ""} />
                <span>Deduct from inventory when sold in POS</span>
              </label>

              <label class="checkbox-field">
                <input id="inventoryDraftActive" type="checkbox" ${
                  state.inventoryDraft.active ? "checked" : ""
                } />
                <span>Active and available in POS</span>
              </label>

              <label class="wide-field">
                <span>Notes</span>
                <textarea id="inventoryDraftNotes" rows="2" placeholder="Stock note, supplier note, or handling note">${escapeHtml(
                  state.inventoryDraft.notes
                )}</textarea>
              </label>
            </div>

            <div class="form-actions">
              <button class="button button-primary" type="submit">
                ${escapeHtml(
                  state.editingInventoryItemId ? "Update Inventory Item" : "Save Inventory Item"
                )}
              </button>
              <button class="button button-secondary" data-inventory-action="reset-draft" type="button">
                Clear Form
              </button>
            </div>
          </form>
        </section>

        <aside class="sidebar-column">
          <section class="section-card">
            <div class="mini-stat-grid">
              <article class="stat-card">
                <span>Total Items</span>
                <strong>${escapeHtml(String(state.inventoryItems.length))}</strong>
              </article>
              <article class="stat-card">
                <span>Tracked Stock</span>
                <strong>${escapeHtml(String(stockTrackedItems.length))}</strong>
              </article>
              <article class="stat-card">
                <span>Need Attention</span>
                <strong>${escapeHtml(String(lowStockCount))}</strong>
              </article>
              <article class="stat-card">
                <span>Stock Value</span>
                <strong>${formatCurrency(stockValue)}</strong>
              </article>
            </div>
          </section>

          <section class="section-card">
            <div class="section-heading compact">
              <div>
                <p class="kicker">Low Stock Desk</p>
                <h3>Quick Restock</h3>
              </div>
            </div>

            ${
              lowStockItems.length === 0
                ? `<div class="empty-state">No low-stock items need attention right now.</div>`
                : `
                  <div class="inventory-low-stock-list">
                    ${lowStockItems.map((item) => buildInventoryLowStockCardMarkup(item)).join("")}
                  </div>
                `
            }
          </section>
        </aside>
      </section>

      <section class="section-card">
        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Business Area</th>
                <th>Category</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Sell Price</th>
                <th>Cost Price</th>
                <th>Stock Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredItems.length === 0
                  ? `
                    <tr>
                      <td colspan="10" class="empty-state">
                        No inventory items match the current view yet.
                      </td>
                    </tr>
                  `
                  : filteredItems
                      .map((item) => {
                        const status = getInventoryStatus(item);
                        return `
                          <tr>
                            <td>
                              <span class="table-primary">${escapeHtml(item.name)}</span>
                              <span class="table-secondary">${escapeHtml(
                                buildInventoryIdentityLabel(item) || getBusinessArea(item.businessAreaId).shortLabel
                              )}</span>
                            </td>
                            <td><span class="tag tag-area">${escapeHtml(
                              getBusinessArea(item.businessAreaId).shortLabel
                            )}</span></td>
                            <td>${escapeHtml(item.category)}</td>
                            <td>${escapeHtml(item.itemType === "service" ? "Service" : "Stock")}</td>
                            <td>${escapeHtml(formatInventoryQuantity(item.quantityOnHand))}</td>
                            <td class="amount-cell">${formatCurrency(item.salesPrice)}</td>
                            <td class="amount-cell">${formatCurrency(item.costPrice)}</td>
                            <td class="amount-cell">${formatCurrency(getInventoryStockValue(item))}</td>
                            <td><span class="tag ${escapeHtml(status.className)}">${escapeHtml(
                              status.label
                            )}</span></td>
                            <td>
                              <div class="row-actions">
                                <button class="edit-btn" data-inventory-action="edit-item" ${buildDataAttributes({
                                  id: item.id
                                })} type="button">
                                  Edit
                                </button>
                                ${
                                  item.trackInventory && item.itemType === "stock"
                                    ? `
                                      <button class="edit-btn" data-inventory-action="adjust-stock" ${buildDataAttributes({
                                        id: item.id,
                                        quantity: -1
                                      })} type="button">
                                        -1
                                      </button>
                                      <button class="edit-btn" data-inventory-action="adjust-stock" ${buildDataAttributes({
                                        id: item.id,
                                        quantity: 1
                                      })} type="button">
                                        +1
                                      </button>
                                      <button class="edit-btn" data-inventory-action="adjust-stock" ${buildDataAttributes({
                                        id: item.id,
                                        quantity: 5
                                      })} type="button">
                                        +5
                                      </button>
                                      <button class="edit-btn" data-inventory-action="set-stock" ${buildDataAttributes({
                                        id: item.id
                                      })} type="button">
                                        Set
                                      </button>
                                    `
                                    : ""
                                }
                                <button class="edit-btn" data-inventory-action="duplicate-item" ${buildDataAttributes({
                                  id: item.id
                                })} type="button">
                                  Copy
                                </button>
                                <button class="edit-btn" data-inventory-action="toggle-active" ${buildDataAttributes({
                                  id: item.id
                                })} type="button">
                                  ${escapeHtml(item.active ? "Archive" : "Restore")}
                                </button>
                                ${
                                  item.userCreated
                                    ? `
                                      <button class="delete-btn" data-inventory-action="delete-item" ${buildDataAttributes({
                                        id: item.id
                                      })} type="button">
                                        Delete
                                      </button>
                                    `
                                    : ""
                                }
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;

    restoreModuleFocus("inventory");
  }

  function createDefaultAuditFilters() {
    return {
      search: "",
      module: "",
      action: "",
      actor: "",
      since: ""
    };
  }

  function sanitizeStoredAuditEntry(record) {
    if (!record || typeof record !== "object") {
      return null;
    }

    const title = normalizeText(record.title || record.summary || record.event || "Activity saved");

    if (!title) {
      return null;
    }

    return {
      id: normalizeText(record.id) || generateId(),
      timestamp: normalizeText(record.timestamp || record.createdAt || record.updatedAt) || new Date().toISOString(),
      moduleKey: normalizeText(record.moduleKey || record.module || "workspace").toLowerCase(),
      moduleLabel: normalizeText(record.moduleLabel || record.module || "Workspace") || "Workspace",
      action: normalizeText(record.action || record.eventType || "update").toLowerCase() || "update",
      title,
      detail: normalizeText(record.detail || record.notes),
      recordId: normalizeText(record.recordId),
      actorId: normalizeText(record.actorId || record.userId),
      actorName: normalizeText(record.actorName || record.userName || "Workspace User") || "Workspace User",
      actorRole: normalizeText(record.actorRole || record.userRole || "local") || "local",
      entryCount: Math.max(parsePositiveInteger(record.entryCount || record.count), 1),
      view: normalizeText(record.view || record.moduleView)
    };
  }

  function sortAuditTrail(records) {
    return [...records].sort((left, right) => {
      const timestampDifference = (right.timestamp || "").localeCompare(left.timestamp || "");

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return (right.id || "").localeCompare(left.id || "");
    });
  }

  function loadAuditTrail() {
    try {
      const raw = localStorage.getItem(AUDIT_TRAIL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return sortAuditTrail(parsed.map(sanitizeStoredAuditEntry).filter(Boolean));
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function persistAuditTrail() {
    localStorage.setItem(AUDIT_TRAIL_STORAGE_KEY, JSON.stringify(state.auditTrail || []));
    if (typeof queueHostedWorkspaceSyncAfterPersist === "function") {
      queueHostedWorkspaceSyncAfterPersist({ reason: "audit-trail" });
    }
  }

  function cloneAuditRecords(records) {
    return JSON.parse(JSON.stringify(Array.isArray(records) ? records : []));
  }

  function getAuditActorDescriptor() {
    const activeProfile = getCurrentUserProfile();
    const signedInProfile = state.userProfiles.find((item) => item.id === state.signedInUserId) || null;
    const profile = activeProfile || signedInProfile;

    return {
      actorId: normalizeText(profile?.id || state.signedInUserId),
      actorName: normalizeText(profile?.fullName || profile?.username || "Workspace User") || "Workspace User",
      actorRole: normalizeText(profile?.role || "local") || "local"
    };
  }

  function appendAuditEntry(entry) {
    const actor = getAuditActorDescriptor();
    const sanitized = sanitizeStoredAuditEntry({
      id: generateId(),
      timestamp: new Date().toISOString(),
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      ...entry
    });

    if (!sanitized) {
      return null;
    }

    state.auditTrail = sortAuditTrail([sanitized, ...(state.auditTrail || [])]).slice(0, AUDIT_TRAIL_LIMIT);
    persistAuditTrail();
    return sanitized;
  }

  function getAuditCollectionDefinitions() {
    return [
      { stateKey: "expenses", moduleKey: "expenses", moduleLabel: "Expenses", view: "expenses", recordNoun: "expense" },
      { stateKey: "budgets", moduleKey: "expenses", moduleLabel: "Budget Controls", view: "expenses", recordNoun: "budget control" },
      { stateKey: "sales", moduleKey: "sales", moduleLabel: "Daily Sales", view: "sales", recordNoun: "sales record" },
      { stateKey: "rentals", moduleKey: "apartments", moduleLabel: "Apartments", view: "apartments", recordNoun: "apartment record" },
      { stateKey: "pettyCash", moduleKey: "petty-cash", moduleLabel: "Petty Cash", view: "petty-cash", recordNoun: "petty cash entry" },
      { stateKey: "pettyCashBudgets", moduleKey: "petty-cash", moduleLabel: "Petty Cash Budgets", view: "petty-cash", recordNoun: "petty cash budget" },
      { stateKey: "salaryRecords", moduleKey: "salary", moduleLabel: "Salary", view: "salary", recordNoun: "salary record" },
      { stateKey: "cashbookEntries", moduleKey: "cashbook", moduleLabel: "Cashbook / Bankbook", view: "cashbook", recordNoun: "cashbook entry" },
      { stateKey: "purchaseOrders", moduleKey: "procurement", moduleLabel: "Procurement", view: "procurement", recordNoun: "purchase order" },
      { stateKey: "laundryTickets", moduleKey: "laundry", moduleLabel: "Laundry Tickets", view: "laundry", recordNoun: "laundry ticket" },
      { stateKey: "equipmentRentalBookings", moduleKey: "equipment-rentals", moduleLabel: "Equipment Rentals", view: "equipment-rentals", recordNoun: "equipment booking" },
      { stateKey: "securityDepositRecords", moduleKey: "deposits", moduleLabel: "Deposits & Charges", view: "deposits", recordNoun: "deposit record" },
      { stateKey: "ledgerEntries", moduleKey: "ledgers", moduleLabel: "Ledgers", view: "ledgers", recordNoun: "ledger entry" },
      { stateKey: "mobileMoneyReconciliations", moduleKey: "mobile-money", moduleLabel: "Mobile Money", view: "mobile-money", recordNoun: "mobile money record" },
      { stateKey: "suppliers", moduleKey: "suppliers", moduleLabel: "Suppliers", view: "suppliers", recordNoun: "supplier record" },
      { stateKey: "assetRecords", moduleKey: "assets", moduleLabel: "Assets", view: "assets", recordNoun: "asset record" },
      { stateKey: "forecastPlans", moduleKey: "forecast", moduleLabel: "Forecast", view: "forecast", recordNoun: "forecast plan" },
      { stateKey: "recurringControls", moduleKey: "recurring", moduleLabel: "Recurring", view: "recurring", recordNoun: "recurring control" },
      { stateKey: "maintenanceRecords", moduleKey: "maintenance", moduleLabel: "Maintenance", view: "maintenance", recordNoun: "maintenance record" },
      { stateKey: "userProfiles", moduleKey: "access", moduleLabel: "Access", view: "access", recordNoun: "user profile" },
      { stateKey: "posOrders", moduleKey: "pos", moduleLabel: "POS", view: "pos", recordNoun: "POS order" },
      { stateKey: "inventoryItems", moduleKey: "inventory", moduleLabel: "Inventory", view: "inventory", recordNoun: "inventory item" }
    ];
  }

  function getAuditCollectionBindings() {
    return {
      expenses: { get: () => persistExpenses, set: (fn) => { persistExpenses = fn; } },
      budgets: { get: () => persistBudgets, set: (fn) => { persistBudgets = fn; } },
      sales: { get: () => persistSales, set: (fn) => { persistSales = fn; } },
      rentals: { get: () => persistRentals, set: (fn) => { persistRentals = fn; } },
      pettyCash: { get: () => persistPettyCash, set: (fn) => { persistPettyCash = fn; } },
      pettyCashBudgets: { get: () => persistPettyCashBudgets, set: (fn) => { persistPettyCashBudgets = fn; } },
      salaryRecords: { get: () => persistSalaryRecords, set: (fn) => { persistSalaryRecords = fn; } },
      cashbookEntries: { get: () => persistCashbookEntries, set: (fn) => { persistCashbookEntries = fn; } },
      purchaseOrders: { get: () => persistPurchaseOrders, set: (fn) => { persistPurchaseOrders = fn; } },
      laundryTickets: { get: () => persistLaundryTickets, set: (fn) => { persistLaundryTickets = fn; } },
      equipmentRentalBookings: { get: () => persistEquipmentRentalBookings, set: (fn) => { persistEquipmentRentalBookings = fn; } },
      securityDepositRecords: { get: () => persistSecurityDepositRecords, set: (fn) => { persistSecurityDepositRecords = fn; } },
      ledgerEntries: { get: () => persistLedgerEntries, set: (fn) => { persistLedgerEntries = fn; } },
      mobileMoneyReconciliations: { get: () => persistMobileMoneyReconciliations, set: (fn) => { persistMobileMoneyReconciliations = fn; } },
      suppliers: { get: () => persistSuppliers, set: (fn) => { persistSuppliers = fn; } },
      assetRecords: { get: () => persistAssetRecords, set: (fn) => { persistAssetRecords = fn; } },
      forecastPlans: { get: () => persistForecastPlans, set: (fn) => { persistForecastPlans = fn; } },
      recurringControls: { get: () => persistRecurringControls, set: (fn) => { persistRecurringControls = fn; } },
      maintenanceRecords: { get: () => persistMaintenanceRecords, set: (fn) => { persistMaintenanceRecords = fn; } },
      userProfiles: { get: () => persistUserProfiles, set: (fn) => { persistUserProfiles = fn; } },
      posOrders: { get: () => persistPosOrders, set: (fn) => { persistPosOrders = fn; } },
      inventoryItems: { get: () => persistInventoryItems, set: (fn) => { persistInventoryItems = fn; } }
    };
  }

  function buildAuditRecordLabel(stateKey, record) {
    switch (stateKey) {
      case "expenses":
        return `${record.reference || record.vendor} • ${formatCurrency(record.amount)}`;
      case "budgets":
        return `${formatMonthLabel(record.month)} • ${getBusinessArea(record.businessAreaId).shortLabel}`;
      case "sales":
        return `${formatDisplayDate(record.date)} • ${formatCurrency(record.amount)}`;
      case "rentals":
        return `${record.suite} • ${formatMonthLabel(record.month)}`;
      case "pettyCash":
        return `${getPettyCashType(record.transactionTypeId).label} • ${formatCurrency(record.amount)}`;
      case "pettyCashBudgets":
        return `${formatMonthLabel(record.month)} • ${getBusinessArea(record.businessAreaId).shortLabel}`;
      case "salaryRecords":
        return `${record.staffName} • ${formatMonthLabel(record.month)}`;
      case "cashbookEntries":
        return `${record.accountName} • ${formatSignedCurrency(getCashbookEntryEffect(record))}`;
      case "purchaseOrders":
        return `${record.supplierName} • ${formatCurrency(record.totalAmount)}`;
      case "laundryTickets":
        return `${record.customerName} • ${formatCurrency(record.amountDue)}`;
      case "equipmentRentalBookings":
        return `${record.equipmentItem} • ${record.customerName}`;
      case "securityDepositRecords":
        return `${record.suite} • ${record.tenantName}`;
      case "ledgerEntries":
        return `${record.partyName} • ${formatCurrency(record.amount)}`;
      case "mobileMoneyReconciliations":
        return `${record.provider} • ${formatDisplayDate(record.date)}`;
      case "suppliers":
        return `${record.supplierName} • ${formatCurrency(record.amountDue)}`;
      case "assetRecords":
        return `${record.assetName} • ${getBusinessArea(record.businessAreaId).shortLabel}`;
      case "forecastPlans":
        return `${formatMonthLabel(record.month)} • ${getBusinessArea(record.businessAreaId).shortLabel}`;
      case "recurringControls":
        return `${record.title} • ${getRecurringModuleLabel(record.moduleType)}`;
      case "maintenanceRecords":
        return `${record.issue} • ${record.location || getBusinessArea(record.businessAreaId).shortLabel}`;
      case "userProfiles":
        return `${record.fullName} • ${record.role}`;
      case "posOrders":
        return `${record.orderNumber} • ${formatCurrency(record.totalAmount)}`;
      case "inventoryItems":
        return `${record.name} • ${record.sku || "No SKU"}`;
      default:
        return normalizeText(record.id || "Record updated") || "Record updated";
    }
  }

  function buildAuditRecordContext(stateKey, record) {
    switch (stateKey) {
      case "expenses":
      case "pettyCash":
      case "salaryRecords":
      case "cashbookEntries":
      case "purchaseOrders":
      case "suppliers":
      case "assetRecords":
      case "forecastPlans":
      case "maintenanceRecords":
        return normalizeBusinessAreaId(record.businessAreaId)
          ? getBusinessArea(record.businessAreaId).shortLabel
          : "";
      case "sales":
        return getBusinessArea(record.businessAreaId).shortLabel;
      case "rentals":
        return `${record.tenantName || "No tenant"} • ${record.occupancyStatus}`;
      case "laundryTickets":
        return `${record.serviceType} • ${record.status}`;
      case "equipmentRentalBookings":
        return `${record.status} • ${formatCurrency(record.rentalFee)}`;
      case "securityDepositRecords":
        return `${record.status} • Exposure ${formatCurrency(
          getSecurityDepositOutstanding(record) +
            getSecurityChargeOutstanding(record) +
            getSecurityRefundOutstanding(record)
        )}`;
      case "ledgerEntries":
        return `${record.entryType} • ${getBusinessArea(record.businessAreaId).shortLabel}`;
      case "mobileMoneyReconciliations":
        return `${formatSignedCurrency(getMobileMoneyVariance(record))} variance`;
      case "userProfiles":
        return record.active ? "Active profile" : "Inactive profile";
      case "posOrders":
        return `${record.paymentMethod} • ${getPosOrderAreaSummary(record)}`;
      case "inventoryItems":
        return `${getBusinessArea(record.businessAreaId).shortLabel} • ${record.category}`;
      default:
        return "";
    }
  }

  function buildAuditActionConfig(action) {
    switch (normalizeText(action).toLowerCase()) {
      case "create":
        return { label: "Created", className: "tag-pos" };
      case "update":
        return { label: "Updated", className: "tag-area" };
      case "delete":
        return { label: "Deleted", className: "tag-risk" };
      case "sync":
        return { label: "Synced", className: "tag-warning" };
      case "print":
        return { label: "Printed", className: "tag-receipt" };
      case "export":
        return { label: "Exported", className: "tag-category" };
      case "restore":
        return { label: "Restored", className: "tag-warning" };
      case "login":
        return { label: "Signed In", className: "tag-neutral" };
      case "logout":
        return { label: "Signed Out", className: "tag-neutral" };
      case "settings":
        return { label: "Settings", className: "tag-audit" };
      default:
        return { label: normalizeText(action) || "Activity", className: "tag-audit" };
    }
  }

  function buildAuditSummaryLine(stateKey, record) {
    const label = buildAuditRecordLabel(stateKey, record);
    const context = buildAuditRecordContext(stateKey, record);
    return context ? `${label} • ${context}` : label;
  }

  function captureCollectionAudit(definition, previousRecords, nextRecords) {
    const previousMap = new Map(
      previousRecords
        .map((record) => [normalizeText(record.id), record])
        .filter(([id]) => id)
    );
    const nextMap = new Map(
      (Array.isArray(nextRecords) ? nextRecords : [])
        .map((record) => [normalizeText(record.id), record])
        .filter(([id]) => id)
    );
    const added = [];
    const updated = [];
    const deleted = [];

    nextMap.forEach((record, id) => {
      const previous = previousMap.get(id);

      if (!previous) {
        added.push(record);
        return;
      }

      if (JSON.stringify(previous) !== JSON.stringify(record)) {
        updated.push({ before: previous, after: record });
      }
    });

    previousMap.forEach((record, id) => {
      if (!nextMap.has(id)) {
        deleted.push(record);
      }
    });

    const totalChanges = added.length + updated.length + deleted.length;

    if (totalChanges === 0) {
      return;
    }

    const actionKinds = [added.length > 0, updated.length > 0, deleted.length > 0].filter(Boolean).length;

    if (totalChanges >= AUDIT_BULK_CHANGE_THRESHOLD || actionKinds > 1) {
      const detailParts = [];

      if (added.length > 0) {
        detailParts.push(`added ${added.length}`);
      }

      if (updated.length > 0) {
        detailParts.push(`updated ${updated.length}`);
      }

      if (deleted.length > 0) {
        detailParts.push(`deleted ${deleted.length}`);
      }

      const sampleRecords = [
        ...added.slice(0, 2),
        ...updated.slice(0, 2).map((item) => item.after),
        ...deleted.slice(0, 2)
      ]
        .map((record) => buildAuditRecordLabel(definition.stateKey, record))
        .filter(Boolean)
        .join(" • ");

      appendAuditEntry({
        moduleKey: definition.moduleKey,
        moduleLabel: definition.moduleLabel,
        action: actionKinds > 1 ? "sync" : added.length > 0 ? "create" : updated.length > 0 ? "update" : "delete",
        title: `${definition.moduleLabel} changes saved`,
        detail: `${detailParts.join(", ")}.${sampleRecords ? ` Latest: ${sampleRecords}.` : ""}`,
        entryCount: totalChanges,
        view: definition.view
      });
      return;
    }

    added.forEach((record) => {
      appendAuditEntry({
        moduleKey: definition.moduleKey,
        moduleLabel: definition.moduleLabel,
        action: "create",
        title: `Created ${definition.recordNoun}`,
        detail: buildAuditSummaryLine(definition.stateKey, record),
        recordId: record.id,
        view: definition.view
      });
    });

    updated.forEach(({ after }) => {
      appendAuditEntry({
        moduleKey: definition.moduleKey,
        moduleLabel: definition.moduleLabel,
        action: "update",
        title: `Updated ${definition.recordNoun}`,
        detail: buildAuditSummaryLine(definition.stateKey, after),
        recordId: after.id,
        view: definition.view
      });
    });

    deleted.forEach((record) => {
      appendAuditEntry({
        moduleKey: definition.moduleKey,
        moduleLabel: definition.moduleLabel,
        action: "delete",
        title: `Deleted ${definition.recordNoun}`,
        detail: buildAuditSummaryLine(definition.stateKey, record),
        recordId: record.id,
        view: definition.view
      });
    });
  }

  function primeAuditSnapshots() {
    auditContext.isRefreshingSnapshots = true;
    getAuditCollectionDefinitions().forEach((definition) => {
      auditContext.snapshotByStateKey.set(definition.stateKey, cloneAuditRecords(state[definition.stateKey]));
    });
    auditContext.isRefreshingSnapshots = false;
  }

  function initializeAuditTrailHooks() {
    const bindings = getAuditCollectionBindings();

    getAuditCollectionDefinitions().forEach((definition) => {
      const binding = bindings[definition.stateKey];

      if (!binding) {
        return;
      }

      const originalPersist = binding.get();

      binding.set(function auditedPersist(...args) {
        const previousRecords = cloneAuditRecords(
          auditContext.snapshotByStateKey.get(definition.stateKey) || state[definition.stateKey]
        );
        const result = originalPersist.apply(this, args);

        if (!auditContext.isRefreshingSnapshots) {
          captureCollectionAudit(definition, previousRecords, state[definition.stateKey]);
        }

        auditContext.snapshotByStateKey.set(definition.stateKey, cloneAuditRecords(state[definition.stateKey]));
        return result;
      });
    });

    const originalPersistSettings = persistSettings;
    persistSettings = function auditedPersistSettings(...args) {
      const before = loadSettings();
      const result = originalPersistSettings.apply(this, args);
      const after = loadSettings();

      if (before.currency !== after.currency) {
        appendAuditEntry({
          moduleKey: "access",
          moduleLabel: "Workspace Settings",
          action: "settings",
          title: "Display currency updated",
          detail: `${before.currency || "Unset"} to ${after.currency || "Unset"}.`,
          view: "access"
        });
      }

      if (before.activeUserId !== after.activeUserId) {
        const nextUser =
          state.userProfiles.find((profile) => profile.id === normalizeText(after.activeUserId)) || null;
        appendAuditEntry({
          moduleKey: "access",
          moduleLabel: "Access",
          action: "settings",
          title: "Active workspace profile changed",
          detail: nextUser
            ? `${nextUser.fullName} is now the active workspace profile.`
            : "The active workspace profile was cleared.",
          view: "access"
        });
      }

      return result;
    };

    const originalPersistAuthSession = persistAuthSession;
    persistAuthSession = function auditedPersistAuthSession(userId) {
      const result = originalPersistAuthSession(userId);
      const profile =
        state.userProfiles.find((item) => item.id === normalizeText(userId)) || getCurrentUserProfile();

      appendAuditEntry({
        moduleKey: "access",
        moduleLabel: "Access",
        action: "login",
        title: "Workspace sign-in",
        detail: profile
          ? `${profile.fullName} signed in as ${profile.role}.`
          : "A workspace user signed in.",
        view: "access"
      });

      return result;
    };

    const originalClearAuthSession = clearAuthSession;
    clearAuthSession = function auditedClearAuthSession(...args) {
      const actor = getAuditActorDescriptor();
      const result = originalClearAuthSession.apply(this, args);

      appendAuditEntry({
        moduleKey: "access",
        moduleLabel: "Access",
        action: "logout",
        title: "Workspace sign-out",
        detail: `${actor.actorName} signed out of the workspace.`,
        view: "access"
      });

      return result;
    };
  }

  function handleAuditFilterInput(id, value) {
    if (id === "auditFilterSearch") {
      state.auditFilters.search = value;
    }

    if (id === "auditFilterModule") {
      state.auditFilters.module = normalizeText(value).toLowerCase();
    }

    if (id === "auditFilterAction") {
      state.auditFilters.action = normalizeText(value).toLowerCase();
    }

    if (id === "auditFilterActor") {
      state.auditFilters.actor = value;
    }

    if (id === "auditFilterSince") {
      state.auditFilters.since = normalizeDateInput(value);
    }
  }

  function resetAuditFilters(options = {}) {
    state.auditFilters = createDefaultAuditFilters();
    renderAuditTrailPage();

    if (!options.silent) {
      showToast("Audit filters cleared.");
    }
  }

  function getAuditModuleOptions() {
    const moduleMap = new Map(
      getAuditCollectionDefinitions().map((definition) => [
        definition.moduleKey,
        { value: definition.moduleKey, label: definition.moduleLabel }
      ])
    );

    moduleMap.set("audit", { value: "audit", label: "Audit Trail" });
    moduleMap.set("data-hub", { value: "data-hub", label: "Data Hub" });

    state.auditTrail.forEach((entry) => {
      if (!moduleMap.has(entry.moduleKey)) {
        moduleMap.set(entry.moduleKey, {
          value: entry.moduleKey,
          label: entry.moduleLabel
        });
      }
    });

    return Array.from(moduleMap.values()).sort((left, right) => left.label.localeCompare(right.label));
  }

  function getAuditActionOptions() {
    return [
      { value: "create", label: "Created" },
      { value: "update", label: "Updated" },
      { value: "delete", label: "Deleted" },
      { value: "sync", label: "Synced" },
      { value: "print", label: "Printed" },
      { value: "export", label: "Exported" },
      { value: "restore", label: "Restored" },
      { value: "login", label: "Signed In" },
      { value: "logout", label: "Signed Out" },
      { value: "settings", label: "Settings" }
    ];
  }

  function getFilteredAuditEntries() {
    const searchValue = normalizeText(state.auditFilters.search).toLowerCase();
    const moduleValue = normalizeText(state.auditFilters.module).toLowerCase();
    const actionValue = normalizeText(state.auditFilters.action).toLowerCase();
    const actorValue = normalizeText(state.auditFilters.actor).toLowerCase();
    const sinceValue = normalizeDateInput(state.auditFilters.since);

    return state.auditTrail.filter((entry) => {
      const haystack = [
        entry.moduleLabel,
        entry.action,
        entry.title,
        entry.detail,
        entry.actorName,
        entry.actorRole
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchValue === "" || haystack.includes(searchValue);
      const matchesModule = moduleValue === "" || entry.moduleKey === moduleValue;
      const matchesAction = actionValue === "" || entry.action === actionValue;
      const matchesActor = actorValue === "" || [entry.actorName, entry.actorRole].join(" ").toLowerCase().includes(actorValue);
      const matchesSince = sinceValue === "" || (entry.timestamp || "").slice(0, 10) >= sinceValue;

      return matchesSearch && matchesModule && matchesAction && matchesActor && matchesSince;
    });
  }

  function renderAuditTrailPage() {
    const root = document.getElementById("auditViewRoot");

    if (!root) {
      return;
    }

    const filteredEntries = getFilteredAuditEntries();
    const visibleEntries = filteredEntries.slice(0, 300);
    const todayKey = getTodayInputValue();
    const createdCount = filteredEntries.filter((entry) => entry.action === "create").length;
    const updatedCount = filteredEntries.filter((entry) => entry.action === "update").length;
    const deletedCount = filteredEntries.filter((entry) => entry.action === "delete").length;
    const todayCount = filteredEntries.filter((entry) => (entry.timestamp || "").startsWith(todayKey)).length;

    root.innerHTML = `
      <section class="section-card">
        <div class="section-heading">
          <div>
            <p class="kicker">Workspace Oversight</p>
            <h3>Audit Trail</h3>
          </div>
          <div class="module-actions">
            <button class="button button-secondary" data-audit-action="export-csv" type="button">
              Export Audit CSV
            </button>
            <button class="button button-secondary" data-audit-action="print-log" type="button">
              Print Audit Snapshot
            </button>
            <button class="button button-ghost" data-audit-action="clear-filters" type="button">
              Clear Filters
            </button>
          </div>
        </div>

        <p class="muted-text">
          Review saved activity across OneRoot modules, including create, update, delete, export, print, sign-in, and restore events.
        </p>

        <div class="filter-grid">
          <label>
            <span>Search</span>
            <input id="auditFilterSearch" type="search" value="${escapeHtml(
              state.auditFilters.search
            )}" placeholder="Module, action, user, or detail..." />
          </label>

          <label>
            <span>Module</span>
            <select id="auditFilterModule">
              ${buildSelectMarkup(getAuditModuleOptions(), state.auditFilters.module, "All Modules")}
            </select>
          </label>

          <label>
            <span>Action</span>
            <select id="auditFilterAction">
              ${buildSelectMarkup(getAuditActionOptions(), state.auditFilters.action, "All Actions")}
            </select>
          </label>

          <label>
            <span>User / Role</span>
            <input id="auditFilterActor" type="search" value="${escapeHtml(
              state.auditFilters.actor
            )}" placeholder="User or role..." />
          </label>

          <label>
            <span>Since</span>
            <input id="auditFilterSince" type="date" value="${escapeHtml(state.auditFilters.since)}" />
          </label>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="stat-card dashboard-metric-card">
          <span>Entries In View</span>
          <strong>${escapeHtml(String(filteredEntries.length))}</strong>
          <p class="module-meta">Showing ${escapeHtml(String(visibleEntries.length))} rows on screen.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Today</span>
          <strong>${escapeHtml(String(todayCount))}</strong>
          <p class="module-meta">${escapeHtml(formatDisplayDate(todayKey))}</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Created</span>
          <strong>${escapeHtml(String(createdCount))}</strong>
          <p class="module-meta">New records captured in this filtered view.</p>
        </article>
        <article class="stat-card dashboard-metric-card">
          <span>Updated / Deleted</span>
          <strong>${escapeHtml(`${updatedCount}/${deletedCount}`)}</strong>
          <p class="module-meta">Updated first, deleted second.</p>
        </article>
      </section>

      <section class="section-card">
        <div class="results-meta">
          <strong>${escapeHtml(String(filteredEntries.length))} audit entr${
      filteredEntries.length === 1 ? "y" : "ies"
    }</strong>
          <span>${
            filteredEntries.length > visibleEntries.length
              ? `Displaying the latest ${visibleEntries.length} entries in this view.`
              : "All matching audit entries are shown below."
          }</span>
        </div>

        <div class="table-wrap compact-table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Module</th>
                <th>Action</th>
                <th>Event</th>
                <th>User</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              ${
                visibleEntries.length === 0
                  ? `
                    <tr>
                      <td colspan="6" class="empty-state">No audit entries match the current filters yet.</td>
                    </tr>
                  `
                  : visibleEntries
                      .map((entry) => {
                        const actionConfig = buildAuditActionConfig(entry.action);
                        const canOpen = entry.view && VIEW_META[entry.view] && canAccessView(entry.view);

                        return `
                          <tr>
                            <td>
                              <span class="table-primary">${escapeHtml(formatTimestampLabel(entry.timestamp))}</span>
                              <span class="table-secondary">${escapeHtml(entry.entryCount > 1 ? `${entry.entryCount} changes` : "Single change")}</span>
                            </td>
                            <td>
                              <span class="table-primary">${escapeHtml(entry.moduleLabel)}</span>
                              <span class="table-secondary">${escapeHtml(entry.recordId || "No record id")}</span>
                            </td>
                            <td><span class="tag ${escapeHtml(actionConfig.className)}">${escapeHtml(
                          actionConfig.label
                        )}</span></td>
                            <td>
                              <span class="table-primary">${escapeHtml(entry.title)}</span>
                              <span class="table-secondary">${escapeHtml(entry.detail || "No extra detail saved")}</span>
                            </td>
                            <td>
                              <span class="table-primary">${escapeHtml(entry.actorName || "Workspace User")}</span>
                              <span class="table-secondary">${escapeHtml(entry.actorRole || "local")}</span>
                            </td>
                            <td>
                              ${
                                canOpen
                                  ? `
                                    <button class="edit-btn" data-audit-action="go-module" ${buildDataAttributes({
                                      view: entry.view
                                    })} type="button">
                                      Open
                                    </button>
                                  `
                                  : `<span class="table-secondary">—</span>`
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  async function exportAuditTrailCsv() {
    const entries = getFilteredAuditEntries();

    if (entries.length === 0) {
      showToast("There are no audit entries to export in the current view.");
      return;
    }

    const rows = [
      ["timestamp", "module", "action", "title", "detail", "recordId", "actorName", "actorRole", "view"],
      ...entries.map((entry) => [
        entry.timestamp,
        entry.moduleLabel,
        entry.action,
        entry.title,
        entry.detail,
        entry.recordId,
        entry.actorName,
        entry.actorRole,
        entry.view
      ])
    ];

    const saved = await saveCsvFile(`oneroot-audit-trail-${dateStamp()}.csv`, rows);

    if (saved) {
      appendAuditEntry({
        moduleKey: "audit",
        moduleLabel: "Audit Trail",
        action: "export",
        title: "Audit trail exported",
        detail: `${entries.length} audit entr${entries.length === 1 ? "y" : "ies"} exported to CSV.`,
        entryCount: entries.length,
        view: "audit"
      });
      showToast(`Exported ${entries.length} audit entr${entries.length === 1 ? "y" : "ies"}.`);
    }
  }

  function printAuditTrailSnapshot() {
    const entries = getFilteredAuditEntries();

    if (entries.length === 0) {
      showToast("There are no audit entries to print in the current view.");
      return;
    }

    const rowsMarkup = entries
      .slice(0, 120)
      .map((entry) => {
        const actionConfig = buildAuditActionConfig(entry.action);
        return `
          <tr>
            <td>${escapeHtml(formatTimestampLabel(entry.timestamp))}</td>
            <td>${escapeHtml(entry.moduleLabel)}</td>
            <td>${escapeHtml(actionConfig.label)}</td>
            <td>${escapeHtml(entry.title)}</td>
            <td>${escapeHtml(entry.detail || "—")}</td>
            <td>${escapeHtml(entry.actorName || "Workspace User")} (${escapeHtml(entry.actorRole || "local")})</td>
          </tr>
        `;
      })
      .join("");

    const bodyMarkup = `
      <h1>OneRoot Audit Trail Snapshot</h1>
      <p class="muted">Generated ${escapeHtml(formatDisplayDate(getTodayInputValue()))} • Showing ${
        entries.length > 120 ? "latest 120 entries for print" : `${entries.length} matching entries`
      }</p>
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Module</th>
            <th>Action</th>
            <th>Event</th>
            <th>Detail</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>${rowsMarkup}</tbody>
      </table>
    `;

    openPrintWindow("OneRoot Audit Trail Snapshot", bodyMarkup);
    appendAuditEntry({
      moduleKey: "audit",
      moduleLabel: "Audit Trail",
      action: "print",
      title: "Audit trail printed",
      detail: `${Math.min(entries.length, 120)} audit entr${Math.min(entries.length, 120) === 1 ? "y" : "ies"} sent to print view.`,
      entryCount: Math.min(entries.length, 120),
      view: "audit"
    });
  }

  function printPosReceipt(orderId, options = {}) {
    const record = state.posOrders.find((order) => order.id === orderId);

    if (!record) {
      showToast("That POS order could not be found.");
      return;
    }

    const actor = getAuditActorDescriptor();
    const itemRowsMarkup = record.items
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${escapeHtml(item.name)}</strong><br />
              <span class="muted">${escapeHtml(
                `${getBusinessArea(item.businessAreaId || record.businessAreaId).shortLabel} • ${item.category}`
              )}</span>
            </td>
            <td>${escapeHtml(String(item.quantity))}</td>
            <td>${escapeHtml(formatCurrency(item.unitPrice))}</td>
            <td>${escapeHtml(formatCurrency(item.totalAmount))}</td>
          </tr>
        `
      )
      .join("");
    const bodyMarkup = `
      <div style="display:flex;align-items:center;gap:16px;padding-bottom:14px;margin-bottom:16px;border-bottom:2px solid #d9e3d8;">
        <img src="${escapeHtml(ONEROOT_LOGO_PATH)}" alt="OneRoot Essentials logo" style="width:96px;height:auto;object-fit:contain;" />
        <div>
          <h1 style="margin:0 0 4px 0;">OneRoot POS Receipt</h1>
          <p class="muted" style="margin:0;">${escapeHtml(record.orderNumber)} • ${escapeHtml(
      formatDisplayDate(record.orderDate)
    )}</p>
          <p class="muted" style="margin:4px 0 0 0;">Your One-Stop Essentials Hub</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <strong>Customer</strong>
          <p>${escapeHtml(record.customerName || "Walk-in Customer")}</p>
          <p>${escapeHtml(record.customerPhone || "No phone saved")}</p>
        </div>
        <div class="summary-card">
          <strong>Payment</strong>
          <p>${escapeHtml(record.paymentMethod)}</p>
          <p>${escapeHtml(getPosOrderAreaLabel(record))}</p>
        </div>
        <div class="summary-card">
          <strong>Items</strong>
          <p>${escapeHtml(String(record.itemCount))} item${record.itemCount === 1 ? "" : "s"}</p>
          <p>${escapeHtml(getPosOrderAreaSummary(record))}</p>
        </div>
        <div class="summary-card">
          <strong>Total</strong>
          <p>${escapeHtml(formatCurrency(record.subtotal || record.totalAmount))}</p>
          <p>Served by ${escapeHtml(actor.actorName)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>${itemRowsMarkup}</tbody>
      </table>

      <p><strong>Subtotal / Total:</strong> ${escapeHtml(formatCurrency(record.subtotal || record.totalAmount))}</p>
      ${
        record.notes
          ? `<p><strong>Notes:</strong> ${escapeHtml(record.notes)}</p>`
          : ""
      }
      <p class="muted">Thank you for choosing OneRoot Essentials.</p>
    `;

    openPrintWindow(`OneRoot POS Receipt - ${record.orderNumber}`, bodyMarkup);
    appendAuditEntry({
      moduleKey: "pos",
      moduleLabel: "POS",
      action: "print",
      title: "POS receipt printed",
      detail: `${record.orderNumber} • ${formatCurrency(record.totalAmount)} • ${getPosOrderAreaSummary(record)}`,
      recordId: record.id,
      view: "pos"
    });

    if (!options.silent) {
      showToast(`Receipt ready for ${record.orderNumber}.`);
    }
  }

  function formatInventoryQuantity(value) {
    const amount = Number(value || 0);
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  }

  async function exportPosOrdersCsv() {
    const records = getFilteredPosOrders();

    if (records.length === 0) {
      showToast("There are no POS orders to export in the current view.");
      return;
    }

    const rows = [
      [
        "orderDate",
        "orderNumber",
        "orderAreaSummary",
        "paymentMethod",
        "customerName",
        "customerPhone",
        "productName",
        "lineBusinessArea",
        "sku",
        "barcode",
        "category",
        "itemType",
        "quantity",
        "unitPrice",
        "lineTotal",
        "orderTotal",
        "notes"
      ]
    ];

    records.forEach((record) => {
      record.items.forEach((item) => {
        rows.push([
          record.orderDate,
          record.orderNumber,
          getPosOrderAreaSummary(record),
          record.paymentMethod,
          record.customerName,
          record.customerPhone,
          item.name,
          getBusinessArea(item.businessAreaId || record.businessAreaId).label,
          item.sku,
          item.barcode || "",
          item.category,
          item.itemType,
          String(item.quantity),
          item.unitPrice.toFixed(2),
          item.totalAmount.toFixed(2),
          record.totalAmount.toFixed(2),
          record.notes
        ]);
      });
    });

    const saved = await saveCsvFile(`oneroot-pos-orders-${dateStamp()}.csv`, rows);

    if (saved) {
      appendAuditEntry({
        moduleKey: "pos",
        moduleLabel: "POS",
        action: "export",
        title: "POS orders exported",
        detail: `${records.length} POS order${records.length === 1 ? "" : "s"} exported to CSV.`,
        entryCount: records.length,
        view: "pos"
      });
      showToast(`Exported ${records.length} POS order${records.length === 1 ? "" : "s"}.`);
    }
  }

  async function exportInventoryCsv() {
    const records = getFilteredInventoryItems();

    if (records.length === 0) {
      showToast("There are no inventory items to export in the current view.");
      return;
    }

    const rows = [
      [
        "businessArea",
        "sku",
        "barcode",
        "name",
        "category",
        "sourceCategory",
        "itemType",
        "trackInventory",
        "quantityOnHand",
        "minStockLevel",
        "salesPrice",
        "costPrice",
        "stockValue",
        "status",
        "active",
        "notes"
      ],
      ...records.map((item) => [
        getBusinessArea(item.businessAreaId).label,
        item.sku,
        item.barcode || "",
        item.name,
        item.category,
        item.sourceCategory,
        item.itemType,
        item.trackInventory ? "Yes" : "No",
        formatInventoryQuantity(item.quantityOnHand),
        String(item.minStockLevel || 0),
        item.salesPrice.toFixed(2),
        item.costPrice.toFixed(2),
        getInventoryStockValue(item).toFixed(2),
        getInventoryStatus(item).label,
        item.active ? "Yes" : "No",
        item.notes
      ])
    ];

    const saved = await saveCsvFile(`oneroot-inventory-${dateStamp()}.csv`, rows);

    if (saved) {
      appendAuditEntry({
        moduleKey: "inventory",
        moduleLabel: "Inventory",
        action: "export",
        title: "Inventory exported",
        detail: `${records.length} inventory item${records.length === 1 ? "" : "s"} exported to CSV.`,
        entryCount: records.length,
        view: "inventory"
      });
      showToast(`Exported ${records.length} inventory item${records.length === 1 ? "" : "s"}.`);
    }
  }
})();
