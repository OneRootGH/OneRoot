(function initOneRootShop() {
  const SHOP_CART_STORAGE_KEY = "oneroot-shop:cart:v1";
  const SHOP_CUSTOMER_STORAGE_KEY = "oneroot-shop:customer:v1";

  const state = {
    config: null,
    catalog: [],
    vacancies: [],
    businessAreas: [],
    paymentMethods: [],
    cart: loadStoredCart(),
    customerDraft: loadStoredCustomerDraft(),
    equipmentSelections: [],
    laundrySelections: [],
    serviceFilters: {
      equipmentCategory: "",
      laundryCategory: ""
    },
    filters: {
      search: "",
      area: "",
      sort: "featured"
    },
    visibleItemCount: 0,
    isCartOpen: false
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    captureElements();
    applyInitialFiltersFromLocation();
    bindEvents();
    resetVisibleCatalogCount();
    state.isCartOpen = !isCompactViewport();
    syncCartPanelLayout();
    maybeSnapToActiveAnchor();

    if (elements.checkoutForm) {
      restoreCustomerDraftIntoForm();
    }
    restoreServiceCustomerDraftIntoForms();
    restoreLeadCaptureIntoForm();

    const needsCatalogData = Boolean(
      elements.checkoutForm ||
      elements.vacancyGrid ||
      elements.equipmentBookingForm ||
      elements.laundryBookingForm
    );
    const needsPublicConfig = Boolean(
      needsCatalogData ||
      elements.heroContactLine ||
      elements.footerContactLine ||
      elements.contactPhoneLink ||
      elements.trackingForm
    );

    if (needsCatalogData) {
      void loadStorefront();
    } else if (needsPublicConfig) {
      void loadPublicConfig();
    }
  }

  function captureElements() {
    [
      "heroContactLine",
      "footerContactLine",
      "businessAreaGrid",
      "vacancyMeta",
      "vacancyGrid",
      "catalogMeta",
      "catalogSearchInput",
      "catalogAreaFilter",
      "catalogSortFilter",
      "clearCatalogFiltersBtn",
      "catalogQuickFilters",
      "catalogResultsMeta",
      "catalogGrid",
      "cartToggleBtn",
      "cartToggleCount",
      "closeCartBtn",
      "cartScrim",
      "cartPanel",
      "cartItems",
      "cartItemCountValue",
      "cartAreaCountValue",
      "cartQuoteCountValue",
      "cartSubtotalValue",
      "mobileCartBar",
      "mobileCartCount",
      "mobileCartTotal",
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
      "trackingResult",
      "equipmentBookingForm",
      "equipmentItemSelect",
      "equipmentCategoryFilterRow",
      "equipmentQuickPickGrid",
      "equipmentItemPreview",
      "equipmentAddItemBtn",
      "equipmentSelectedItems",
      "equipmentCustomerName",
      "equipmentCustomerPhone",
      "equipmentCustomerEmail",
      "equipmentQuantityInput",
      "equipmentDurationInput",
      "equipmentStartDateInput",
      "equipmentPreferredTimeInput",
      "equipmentDeliveryModeInput",
      "equipmentAddressInput",
      "equipmentSiteLocationInput",
      "equipmentNeedOperatorInput",
      "equipmentNotesInput",
      "equipmentPaymentMethodInput",
      "equipmentFormNote",
      "equipmentQuickPickHint",
      "equipmentSubmitBtn",
      "equipmentMessage",
      "laundryBookingForm",
      "laundryComboSection",
      "laundryComboQuickPickGrid",
      "laundryServiceSelect",
      "laundryCategoryFilterRow",
      "laundryQuickPickGrid",
      "laundryServicePreview",
      "laundryAddItemBtn",
      "laundrySelectedItems",
      "laundryCustomerName",
      "laundryCustomerPhone",
      "laundryCustomerEmail",
      "laundryItemCountInput",
      "laundryPickupDateInput",
      "laundryPreferredTimeInput",
      "laundryDeliveryModeInput",
      "laundryAddressInput",
      "laundryItemSummaryInput",
      "laundryNotesInput",
      "laundryPaymentMethodInput",
      "laundryMessage",
      "contactPhoneLink",
      "contactPhoneText",
      "contactWhatsappLink",
      "contactWhatsappText",
      "contactEmailLink",
      "contactEmailText",
      "contactPickupNote",
      "leadCaptureForm",
      "leadCustomerName",
      "leadCustomerPhone",
      "leadCustomerEmail",
      "leadBusinessArea",
      "leadInterestType",
      "leadPreferredContact",
      "leadReferralName",
      "leadNotes",
      "leadMessage",
      "leadReferralShareBtn"
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    elements.catalogSearchInput?.addEventListener("input", (event) => {
      state.filters.search = normalizeText(event.target.value);
      resetVisibleCatalogCount();
      renderCatalog();
    });

    elements.catalogAreaFilter?.addEventListener("change", (event) => {
      state.filters.area = normalizeText(event.target.value);
      resetVisibleCatalogCount();
      renderCatalog();
    });

    elements.catalogSortFilter?.addEventListener("change", (event) => {
      state.filters.sort = normalizeText(event.target.value) || "featured";
      renderCatalog();
    });

    elements.clearCatalogFiltersBtn?.addEventListener("click", clearCatalogFilters);
    elements.checkoutForm?.addEventListener("submit", handleCheckoutSubmit);
    elements.trackingForm?.addEventListener("submit", handleTrackingSubmit);
    elements.equipmentBookingForm?.addEventListener("submit", handleEquipmentBookingSubmit);
    elements.laundryBookingForm?.addEventListener("submit", handleLaundryBookingSubmit);
    elements.leadCaptureForm?.addEventListener("submit", handleLeadCaptureSubmit);
    elements.equipmentAddItemBtn?.addEventListener("click", () => {
      addEquipmentSelectionFromInputs();
    });
    elements.laundryAddItemBtn?.addEventListener("click", () => {
      addLaundrySelectionFromInputs();
    });
    elements.equipmentItemSelect?.addEventListener("change", renderEquipmentItemPreview);
    elements.laundryServiceSelect?.addEventListener("change", renderLaundryItemPreview);

    elements.checkoutForm?.addEventListener("input", persistCustomerDraftFromForm);
    elements.equipmentBookingForm?.addEventListener("input", persistServiceCustomerDraftFromForms);
    elements.laundryBookingForm?.addEventListener("input", persistServiceCustomerDraftFromForms);
    elements.leadCaptureForm?.addEventListener("input", persistLeadCaptureDraft);
    elements.leadReferralShareBtn?.addEventListener("click", handleLeadReferralShare);
    elements.cartToggleBtn?.addEventListener("click", toggleCartPanel);
    elements.mobileCartBar?.addEventListener("click", openCartPanel);
    elements.closeCartBtn?.addEventListener("click", closeCartPanel);
    elements.cartScrim?.addEventListener("click", closeCartPanel);
    window.addEventListener("resize", syncCartPanelLayout);

    document.body.addEventListener("click", handleBodyClick);
  }

  async function loadStorefront() {
    setText(elements.catalogMeta, "Loading items...");
    setText(elements.vacancyMeta, "Loading vacancies...");

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
      renderContactPage();
      renderBusinessAreas();
      renderCatalogQuickFilters();
      renderCatalog();
      renderCart();
      populateEquipmentOptions();
      populateLaundryOptions();
      renderEquipmentSelections();
      renderLaundrySelections();
      populateServicePaymentMethods();
      restoreServiceCustomerDraftIntoForms();
      syncCartPanelLayout();
      maybeSnapToActiveAnchor();

      if (elements.vacancyGrid) {
        try {
        const vacanciesResponse = await fetch("/api/public/vacancies", { cache: "no-store" });
        if (!vacanciesResponse.ok) {
          throw new Error(`Vacancies request failed with ${vacanciesResponse.status}.`);
        }
        const vacanciesPayload = await vacanciesResponse.json();
        state.vacancies = Array.isArray(vacanciesPayload.items) ? vacanciesPayload.items : [];
        renderVacancies();
        } catch (vacancyError) {
          console.error(vacancyError);
          state.vacancies = [];
          renderVacancies();
        }
      }
    } catch (error) {
      console.error(error);
      setText(
        elements.catalogMeta,
        "Items could not load right now. Please refresh and try again."
      );

      if (elements.catalogGrid) {
        elements.catalogGrid.innerHTML = `
          <article class="catalog-card">
            <strong>Items unavailable</strong>
            <p>Items could not be loaded at the moment.</p>
          </article>
        `;
      }

      if (elements.vacancyGrid) {
        elements.vacancyGrid.innerHTML = `
          <article class="vacancy-card vacancy-card-empty">
            <strong>Vacancies unavailable</strong>
            <p>Vacancy information could not be loaded at the moment.</p>
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
      renderContactPage();
      maybeSnapToActiveAnchor();
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

    if (state.filters.area) {
      elements.catalogAreaFilter.value = state.filters.area;
    }
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

  function populateServicePaymentMethods() {
    populateServicePaymentMethodSelect(elements.equipmentPaymentMethodInput);
    populateServicePaymentMethodSelect(elements.laundryPaymentMethodInput);
  }

  function populateServicePaymentMethodSelect(selectNode) {
    if (!selectNode) {
      return;
    }

    const methods = state.paymentMethods.length
      ? state.paymentMethods
      : ["Call To Confirm", "Pay On Pickup", "Mobile Money", "Bank Transfer"];

    selectNode.innerHTML = methods
      .map((method) => `<option value="${escapeHtml(method)}">${escapeHtml(method)}</option>`)
      .join("");

    if (state.customerDraft.paymentMethod) {
      selectNode.value = state.customerDraft.paymentMethod;
    }
  }

  function renderContactLines() {
    if (!state.config) {
      return;
    }

    const whatsappNumbers = getWhatsappDisplayNumbers();
    const facebookUrl = normalizeText(state.config.facebookUrl);
    const contactParts = [
      state.config.supportPhone ? `Phone: ${state.config.supportPhone}` : "",
      whatsappNumbers.length ? `WhatsApp: ${whatsappNumbers.join(" / ")}` : "",
      state.config.supportEmail ? `Email: ${state.config.supportEmail}` : "",
      state.config.pickupNote || ""
    ].filter(Boolean);

    if (elements.heroContactLine) {
      const heroParts = contactParts
        .slice(0, 3)
        .map((part) => `<span>${escapeHtml(part)}</span>`);
      if (facebookUrl) {
        heroParts.push(
          `<a class="hero-tag-link" href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener">Facebook Page</a>`
        );
      }
      elements.heroContactLine.innerHTML = heroParts.join("");
    }

    if (elements.footerContactLine) {
      const footerParts = contactParts.map((part) => `<span>${escapeHtml(part)}</span>`);
      if (facebookUrl) {
        footerParts.push(
          `<a class="footer-contact-link" href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener">Facebook Page</a>`
        );
      }
      elements.footerContactLine.innerHTML = footerParts.join(" • ");
    }
  }

  function renderContactPage() {
    if (!state.config) {
      return;
    }

    const supportPhone = normalizeText(state.config.supportPhone);
    const supportDigits = normalizeDigits(supportPhone);
    const whatsappNumbers = getWhatsappDisplayNumbers();
    const whatsappNumber = normalizeWhatsappNumber(whatsappNumbers[0]);
    const supportEmail = normalizeText(state.config.supportEmail);
    const pickupNote = normalizeText(state.config.pickupNote);

    if (elements.contactPhoneLink) {
      elements.contactPhoneLink.href = supportDigits ? `tel:${supportDigits}` : "#";
    }
    if (elements.contactPhoneText) {
      elements.contactPhoneText.textContent = supportPhone || "Call OneRoot";
    }
    if (elements.contactWhatsappLink) {
      elements.contactWhatsappLink.href = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello OneRoot, I need support with my order or service request.")}`
        : "#";
    }
    if (elements.contactWhatsappText) {
      elements.contactWhatsappText.textContent =
        whatsappNumbers.join(" / ") || "Open WhatsApp";
    }
    if (elements.contactEmailLink) {
      elements.contactEmailLink.href = supportEmail ? `mailto:${supportEmail}` : "#";
    }
    if (elements.contactEmailText) {
      elements.contactEmailText.textContent = supportEmail || "Email OneRoot";
    }
    if (elements.contactPickupNote) {
      elements.contactPickupNote.textContent =
        pickupNote || "Pickup and delivery confirmation are handled by OneRoot after the order is received.";
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
            <div class="area-card-top">
              <span class="area-mark">${escapeHtml(getAreaMonogram(area.id))}</span>
              <span class="count-pill">${escapeHtml(String(area.itemCount || 0))} items</span>
            </div>
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

  function renderVacancies() {
    if (!elements.vacancyGrid) {
      return;
    }

    const vacancies = [...state.vacancies];

    if (elements.vacancyMeta) {
      setText(
        elements.vacancyMeta,
        vacancies.length
          ? `${vacancies.length} open position${vacancies.length === 1 ? "" : "s"} available.`
          : "There are no open vacancies at the moment."
      );
    }

    if (!vacancies.length) {
      elements.vacancyGrid.innerHTML = `
        <article class="vacancy-card vacancy-card-empty">
          <strong>No open vacancies at the moment</strong>
          <p>Check back soon for new opportunities across sales, service, operations, kitchen, delivery, and support.</p>
        </article>
      `;
      return;
    }

    elements.vacancyGrid.innerHTML = vacancies
      .map((vacancy) => {
        const applyHref = buildVacancyApplyHref(vacancy);
        const openingsValue = Math.max(Number(vacancy.openings || 1), 1);

        return `
          <article class="vacancy-card">
            <div class="vacancy-card-head">
              <div>
                <span class="count-pill">${escapeHtml(vacancy.businessAreaShort || vacancy.businessAreaLabel || "OneRoot")}</span>
                <strong>${escapeHtml(vacancy.jobTitle || vacancy.staffRole || "OneRoot Vacancy")}</strong>
              </div>
              <span class="vacancy-openings">${escapeHtml(`${openingsValue} opening${openingsValue === 1 ? "" : "s"}`)}</span>
            </div>
            <div class="vacancy-meta-row">
              <span>${escapeHtml(vacancy.staffRole || "General Role")}</span>
              <span>${escapeHtml(vacancy.employmentType || "Flexible")}</span>
              <span>${escapeHtml(vacancy.location || "Accra")}</span>
            </div>
            <div class="vacancy-detail-stack">
              <section class="vacancy-detail-section">
                <strong>Role Summary</strong>
                ${renderVacancyParagraph(
                  vacancy.summary,
                  "Join OneRoot Essentials and help deliver daily community needs with care, speed, and accountability."
                )}
              </section>
              <section class="vacancy-detail-section">
                <strong>Key Duties</strong>
                ${renderVacancyList(
                  vacancy.keyResponsibilities,
                  "Support the team, serve customers well, and handle assigned daily responsibilities with care and accountability."
                )}
              </section>
              <section class="vacancy-detail-section">
                <strong>Requirements</strong>
                ${renderVacancyList(
                  vacancy.requirements,
                  "Relevant experience, reliability, communication skills, and willingness to serve customers well."
                )}
              </section>
              <section class="vacancy-detail-section">
                <strong>Working Hours</strong>
                ${renderVacancyParagraph(
                  vacancy.workingHours,
                  "Working hours will be shared during the hiring process based on the needs of the role."
                )}
              </section>
              <section class="vacancy-detail-section">
                <strong>How To Apply</strong>
                ${renderVacancyParagraph(
                  vacancy.howToApply,
                  "Use the apply button below or contact OneRoot with your name, role of interest, phone number, and brief experience summary."
                )}
              </section>
            </div>
            <div class="vacancy-detail-list">
              <span>${escapeHtml(vacancy.closingDate ? `Apply by ${formatDate(vacancy.closingDate)}` : "Applications are open now")}</span>
              ${vacancy.salaryRange ? `<span>${escapeHtml(`Salary: ${vacancy.salaryRange}`)}</span>` : ""}
            </div>
            <div class="vacancy-actions">
              <a class="button button-primary" href="${escapeHtml(applyHref)}" target="_blank" rel="noreferrer">
                ${escapeHtml(buildVacancyApplyLabel(vacancy))}
              </a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function getEquipmentCatalogItems() {
    const activeCategory = normalizeText(state.serviceFilters.equipmentCategory);
    return getEquipmentCatalogBaseItems().filter((item) => {
      if (!activeCategory) {
        return true;
      }
      return getServiceCategoryLabel(item.category, "equipment") === activeCategory;
    });
  }

  function getLaundryCatalogItems() {
    const activeCategory = normalizeText(state.serviceFilters.laundryCategory);
    return getLaundryCatalogBaseItems().filter((item) => {
      if (!activeCategory) {
        return true;
      }
      return getServiceCategoryLabel(item.category, "laundry") === activeCategory;
    });
  }

  function isLaundryComboItem(item) {
    if (normalizeText(item?.businessAreaId) !== "laundry-services") {
      return false;
    }
    const textBlob = [normalizeText(item?.name), normalizeText(item?.category)]
      .join(" ")
      .toLowerCase();
    return textBlob.includes("+") || textBlob.includes("combo") || textBlob.includes(" set ");
  }

  function getFeaturedLaundryComboItems() {
    const activeCategory = normalizeText(state.serviceFilters.laundryCategory);
    return getLaundryCatalogBaseItems()
      .filter((item) => isLaundryComboItem(item))
      .filter((item) => {
        if (!activeCategory) {
          return true;
        }
        return getServiceCategoryLabel(item.category, "laundry") === activeCategory;
      })
      .sort((left, right) => {
        const sourceDelta =
          Number(normalizeText(right.source) === "inventory") -
          Number(normalizeText(left.source) === "inventory");
        return (
          sourceDelta ||
          compareCatalogItems(left, right) ||
          Number(left.salesPrice || 0) - Number(right.salesPrice || 0)
        );
      })
      .slice(0, 8);
  }

  function getServiceCategoryLabel(category, serviceType) {
    const cleanCategory = normalizeText(category);
    if (!cleanCategory) {
      return serviceType === "laundry" ? "General Laundry" : "General Equipment";
    }
    if (serviceType === "laundry") {
      return cleanCategory.replace(/^Laundry\s*-\s*/i, "") || "General Laundry";
    }
    if (
      [
        "buy",
        "equipment & construction consumables",
        "construction consumables",
        "equipment sales",
        "sales"
      ].includes(cleanCategory.toLowerCase())
    ) {
      return "Buy";
    }
    if (
      [
        "equipment rental",
        "construction support",
        "hand tools",
        "powered tools",
        "concrete & masonry"
      ].includes(cleanCategory.toLowerCase())
    ) {
      return "Rent";
    }
    return cleanCategory;
  }

  function getEquipmentOrderMode(item) {
    return getServiceCategoryLabel(item?.category, "equipment") === "Buy" ? "buy" : "rent";
  }

  function getEquipmentSelectionMultiplier(selection) {
    return selection?.mode === "buy"
      ? 1
      : Math.max(Number(selection?.durationDays || 1), 1);
  }

  function computeEquipmentSelectionLineTotal(selection) {
    return Number(
      (
        Number(selection?.unitPrice || 0) *
        Math.max(Number(selection?.quantity || 1), 1) *
        getEquipmentSelectionMultiplier(selection)
      ).toFixed(2)
    );
  }

  function describeEquipmentSelection(selection) {
    const quantity = Math.max(Number(selection?.quantity || 1), 1);
    if (selection?.mode === "buy") {
      return `${quantity} item${quantity === 1 ? "" : "s"} to buy`;
    }
    const days = Math.max(Number(selection?.durationDays || 1), 1);
    return `${quantity} item${quantity === 1 ? "" : "s"} for ${days} day${days === 1 ? "" : "s"}`;
  }

  function getCurrentEquipmentMode() {
    const selectedItem = getCatalogItemById(normalizeText(elements.equipmentItemSelect?.value));
    if (selectedItem) {
      return getEquipmentOrderMode(selectedItem);
    }

    const activeCategory = normalizeText(state.serviceFilters.equipmentCategory);
    if (activeCategory === "Buy") {
      return "buy";
    }
    if (activeCategory === "Rent") {
      return "rent";
    }

    const selectionModes = [...new Set(state.equipmentSelections.map((selection) => selection.mode).filter(Boolean))];
    return selectionModes.length === 1 ? selectionModes[0] : "";
  }

  function refreshEquipmentFormMode() {
    const mode = getCurrentEquipmentMode();
    const quantityField = elements.equipmentQuantityInput?.closest("label");
    const quantityLabel = quantityField?.querySelector("span");
    const durationField = elements.equipmentDurationInput?.closest("label");
    const selectionModes = [...new Set(state.equipmentSelections.map((selection) => selection.mode).filter(Boolean))];
    const effectiveMode =
      selectionModes.length > 1
        ? "mixed"
        : selectionModes[0] || mode;

    if (quantityLabel) {
      quantityLabel.textContent =
        mode === "buy"
          ? "Quantity To Buy"
          : mode === "rent"
            ? "Quantity Needed"
            : "Quantity";
    }

    if (durationField) {
      durationField.classList.toggle("hidden", mode === "buy");
    }

    if (elements.equipmentFormNote) {
      elements.equipmentFormNote.textContent =
        mode === "buy"
          ? "Choose the items you want to buy, set quantity, and send one order for everything you need."
          : mode === "rent"
            ? "Choose the equipment you need, set quantity and rental days, and include all required items in one request."
            : "Choose equipment to rent or items to buy, set quantity, and send one combined request.";
    }

    if (elements.equipmentQuickPickHint) {
      elements.equipmentQuickPickHint.textContent =
        mode === "buy"
          ? "Choose the item first, then set the quantity you want to buy."
          : mode === "rent"
            ? "Choose the equipment first, then set the quantity and rental days."
            : "Choose the item first, then set quantity. Rental items will also ask for days.";
    }

    if (elements.equipmentAddItemBtn) {
      elements.equipmentAddItemBtn.textContent =
        mode === "buy"
          ? "Add Buy Item"
          : mode === "rent"
            ? "Add Rental Item"
            : "Add Equipment Item";
    }

    if (elements.equipmentSubmitBtn) {
      elements.equipmentSubmitBtn.textContent =
        effectiveMode === "buy"
          ? "Send Equipment Order"
          : effectiveMode === "rent"
            ? "Send Equipment Request"
            : "Send Equipment Order / Request";
    }
  }

  function getEquipmentItemFingerprint(item) {
    const textBlob = [
      normalizeText(item.id),
      normalizeText(item.name),
      normalizeText(item.category),
      normalizeText(item.sourceCategory)
    ]
      .join(" ")
      .toLowerCase();

    if (textBlob.includes("wheelbarrow")) {
      return "wheelbarrow";
    }
    if (textBlob.includes("vibrator")) {
      return "concrete-vibrator";
    }
    if (textBlob.includes("cutting machine") || textBlob.includes("cutter")) {
      return "cutting-machine";
    }
    if (textBlob.includes("head pan") || textBlob.includes("headpan")) {
      return "head-pan";
    }
    if (textBlob.includes("shovel")) {
      return "shovel";
    }
    if (textBlob.includes("impact drill") || textBlob.includes("drill")) {
      return "impact-drill";
    }
    return normalizeText(item.id) || normalizeText(item.name);
  }

  function isEquipmentCatalogItem(item) {
    const areaId = normalizeText(item.businessAreaId);
    if (areaId !== "water-equipment") {
      return false;
    }

    const category = normalizeText(item.category).toLowerCase();
    const itemType = normalizeText(item.itemType).toLowerCase();
    const textBlob = [
      normalizeText(item.id),
      normalizeText(item.name),
      normalizeText(item.category)
    ]
      .join(" ")
      .toLowerCase();

    if (textBlob.includes("water supply") || category === "water supply") {
      return false;
    }

    if (normalizeText(item.id) === "water-delivery-request" || category === "water delivery") {
      return false;
    }

    if (itemType === "service") {
      return true;
    }

    if (
      [
        "rent",
        "equipment rental",
        "construction support",
        "hand tools",
        "powered tools",
        "concrete & masonry",
        "equipment & construction consumables",
        "buy",
        "equipment sales",
        "construction consumables"
      ].includes(category)
    ) {
      return true;
    }

    return [
      "equipment rental",
      "rent",
      "construction support",
      "hand tools",
      "powered tools",
      "concrete & masonry",
      "equipment & construction consumables",
      "hammer",
      "pick axe",
      "pickaxe",
      "wheelbarrow",
      "drill",
      "shovel",
      "nails",
      "head pan",
      "headpan",
      "vibrator",
      "cutting machine",
      "cutter",
      "impact drill"
    ].some((keyword) => textBlob.includes(keyword));
  }

  function compareCatalogItems(left, right) {
    const leftCategory = getServiceCategoryLabel(left.category, normalizeText(left.businessAreaId) === "laundry-services" ? "laundry" : "equipment");
    const rightCategory = getServiceCategoryLabel(right.category, normalizeText(right.businessAreaId) === "laundry-services" ? "laundry" : "equipment");
    return (
      leftCategory.localeCompare(rightCategory) ||
      left.name.localeCompare(right.name)
    );
  }

  function getEquipmentCatalogBaseItems() {
    const matchingItems = state.catalog.filter(isEquipmentCatalogItem);
    const preferredItems = [];
    const inventoryFingerprints = new Set(
      matchingItems
        .filter((item) => normalizeText(item.source) === "inventory")
        .map((item) => getEquipmentItemFingerprint(item))
    );

    matchingItems
      .sort((left, right) => {
        const sourceDelta =
          Number(normalizeText(right.source) === "inventory") -
          Number(normalizeText(left.source) === "inventory");
        return sourceDelta || compareCatalogItems(left, right);
      })
      .forEach((item) => {
        const source = normalizeText(item.source);
        const fingerprint = getEquipmentItemFingerprint(item);
        if (source !== "inventory" && inventoryFingerprints.has(fingerprint)) {
          return;
        }
        preferredItems.push(item);
      });

    return preferredItems.sort(compareCatalogItems);
  }

  function getLaundryCatalogBaseItems() {
    const laundryItems = state.catalog.filter(
      (item) => normalizeText(item.businessAreaId) === "laundry-services"
    );
    const inventoryItems = laundryItems.filter(
      (item) => normalizeText(item.source) === "inventory"
    );
    const baseItems = inventoryItems.length ? inventoryItems : laundryItems;
    return [...baseItems].sort(compareCatalogItems);
  }

  function getServiceCategoryOptions(items, serviceType) {
    return [...new Set(items.map((item) => getServiceCategoryLabel(item.category, serviceType)).filter(Boolean))].sort(
      (left, right) => left.localeCompare(right)
    );
  }

  function syncServiceSelection(selectElement, items) {
    if (!selectElement) {
      return;
    }
    const selectedId = normalizeText(selectElement.value);
    if (selectedId && !items.some((item) => normalizeText(item.id) === selectedId)) {
      selectElement.value = "";
    }
  }

  function buildServiceSelectMarkup(items, serviceType, placeholder) {
    const groups = new Map();
    items.forEach((item) => {
      const categoryLabel = getServiceCategoryLabel(item.category, serviceType);
      if (!groups.has(categoryLabel)) {
        groups.set(categoryLabel, []);
      }
      groups.get(categoryLabel).push(item);
    });

    const optionGroups = Array.from(groups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(
        ([categoryLabel, groupItems]) => `
          <optgroup label="${escapeHtml(categoryLabel)}">
            ${groupItems
              .map(
                (item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`
              )
              .join("")}
          </optgroup>
        `
      );

    return [`<option value="">${escapeHtml(placeholder)}</option>`, ...optionGroups].join("");
  }

  function renderServiceCategoryFilters(container, serviceType, options, activeCategory) {
    if (!container) {
      return;
    }

    if (!options.length) {
      container.innerHTML = "";
      return;
    }

    const allLabel = serviceType === "laundry" ? "All Laundry Categories" : "All Equipment Categories";
    container.innerHTML = [
      `
        <button
          class="service-filter-chip ${activeCategory === "" ? "is-active" : ""}"
          data-service-category=""
          data-service-type="${escapeHtml(serviceType)}"
          type="button"
        >
          ${escapeHtml(allLabel)}
        </button>
      `,
      ...options.map(
        (category) => `
          <button
            class="service-filter-chip ${activeCategory === category ? "is-active" : ""}"
            data-service-category="${escapeHtml(category)}"
            data-service-type="${escapeHtml(serviceType)}"
            type="button"
          >
            ${escapeHtml(category)}
          </button>
        `
      )
    ].join("");
  }

  function renderEquipmentCategoryFilters() {
    renderServiceCategoryFilters(
      elements.equipmentCategoryFilterRow,
      "equipment",
      getServiceCategoryOptions(getEquipmentCatalogBaseItems(), "equipment"),
      normalizeText(state.serviceFilters.equipmentCategory)
    );
  }

  function renderLaundryCategoryFilters() {
    renderServiceCategoryFilters(
      elements.laundryCategoryFilterRow,
      "laundry",
      getServiceCategoryOptions(getLaundryCatalogBaseItems(), "laundry"),
      normalizeText(state.serviceFilters.laundryCategory)
    );
  }

  function renderLaundryComboQuickPicks() {
    if (!elements.laundryComboSection || !elements.laundryComboQuickPickGrid) {
      return;
    }

    const comboItems = getFeaturedLaundryComboItems();
    elements.laundryComboSection.classList.toggle("hidden", comboItems.length === 0);
    renderServiceQuickPicks(
      elements.laundryComboQuickPickGrid,
      comboItems,
      normalizeText(elements.laundryServiceSelect?.value),
      "laundry"
    );
  }

  function populateEquipmentOptions() {
    if (!elements.equipmentItemSelect) {
      return;
    }

    renderEquipmentCategoryFilters();
    const items = getEquipmentCatalogItems();
    syncServiceSelection(elements.equipmentItemSelect, items);
    if (!items.length) {
      elements.equipmentItemSelect.innerHTML = `<option value="">No equipment options available right now</option>`;
      renderEquipmentQuickPicks();
      renderEquipmentItemPreview();
      renderEquipmentSelections();
      return;
    }

    elements.equipmentItemSelect.innerHTML = buildServiceSelectMarkup(
      items,
      "equipment",
      "Select equipment item"
    );
    renderEquipmentQuickPicks();
    renderEquipmentItemPreview();
    renderEquipmentSelections();
  }

  function populateLaundryOptions() {
    if (!elements.laundryServiceSelect) {
      return;
    }

    renderLaundryCategoryFilters();
    const items = getLaundryCatalogItems();
    syncServiceSelection(elements.laundryServiceSelect, items);
    if (!items.length) {
      elements.laundryServiceSelect.innerHTML = `<option value="">No laundry options available right now</option>`;
      renderLaundryComboQuickPicks();
      renderLaundryQuickPicks();
      renderLaundryItemPreview();
      renderLaundrySelections();
      return;
    }

    elements.laundryServiceSelect.innerHTML = buildServiceSelectMarkup(
      items,
      "laundry",
      "Select laundry service"
    );
    renderLaundryComboQuickPicks();
    renderLaundryQuickPicks();
    renderLaundryItemPreview();
    renderLaundrySelections();
  }

  function renderServiceQuickPicks(container, items, selectedId, serviceType) {
    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = `
        <article class="service-quick-pick service-quick-pick-empty">
          <strong>No items available</strong>
          <p>Please check back soon or contact OneRoot for help with this request.</p>
        </article>
      `;
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const isActive = normalizeText(item.id) === normalizeText(selectedId);
        const salesPrice = Number(item.salesPrice || 0);
        return `
          <button
            class="service-quick-pick ${isActive ? "is-active" : ""}"
            data-service-pick="${escapeHtml(serviceType)}"
            data-item-id="${escapeHtml(item.id)}"
            type="button"
          >
            <img
              class="service-quick-pick-thumb"
              src="${escapeHtml(resolveCatalogImageSrc(item))}"
              alt="${escapeHtml(item.name)}"
            >
            <span class="service-quick-pick-copy">
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(getServiceCategoryLabel(item.category, serviceType) || "Service Item")}</small>
              <span>${escapeHtml(salesPrice > 0 ? formatCurrency(salesPrice) : "Quote")}</span>
            </span>
          </button>
        `;
      })
      .join("");
  }

  function renderEquipmentQuickPicks() {
    renderServiceQuickPicks(
      elements.equipmentQuickPickGrid,
      getEquipmentCatalogItems(),
      normalizeText(elements.equipmentItemSelect?.value),
      "equipment"
    );
  }

  function renderLaundryQuickPicks() {
    renderServiceQuickPicks(
      elements.laundryQuickPickGrid,
      getLaundryCatalogItems(),
      normalizeText(elements.laundryServiceSelect?.value),
      "laundry"
    );
  }

  function getWhatsappDisplayNumbers() {
    return [...new Set([
      normalizeText(state.config?.whatsappNumber),
      normalizeText(state.config?.alternateWhatsappNumber)
    ].filter(Boolean))];
  }

  function createClientSelectionId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function getCatalogItemById(itemId) {
    return state.catalog.find((item) => normalizeText(item.id) === normalizeText(itemId)) || null;
  }

  function resolveCatalogImageSrc(item) {
    const raw = normalizeText(item?.imageUrl);
    return raw || "/assets/oneroot-icon-transparent.png";
  }

  function renderServiceItemPreview(container, item, emptyTitle, emptyBody) {
    if (!container) {
      return;
    }

    if (!item) {
      container.innerHTML = `
        <article class="service-preview-card service-preview-card-empty">
          <strong>${escapeHtml(emptyTitle)}</strong>
          <p>${escapeHtml(emptyBody)}</p>
        </article>
      `;
      return;
    }

    const salesPrice = Number(item.salesPrice || 0);
    const priceLabel = salesPrice > 0 ? formatCurrency(salesPrice) : "Quote";
    const note = normalizeText(item.notes);
    container.innerHTML = `
      <article class="service-preview-card">
        <img class="service-preview-thumb" src="${escapeHtml(resolveCatalogImageSrc(item))}" alt="${escapeHtml(item.name)}">
        <div class="service-preview-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.category || "Service Item")}</span>
          <span>${escapeHtml(priceLabel)}</span>
          <p>${escapeHtml(note || "OneRoot staff will confirm the final service details after submission.")}</p>
        </div>
      </article>
    `;
  }

  function renderEquipmentItemPreview() {
    const selectedItem = getCatalogItemById(normalizeText(elements.equipmentItemSelect?.value));
    renderEquipmentQuickPicks();
    renderServiceItemPreview(
      elements.equipmentItemPreview,
      selectedItem
        ? {
            ...selectedItem,
            category: getServiceCategoryLabel(selectedItem.category, "equipment")
          }
        : null,
      "No equipment selected yet.",
      "Choose an equipment item to see the photo and price before adding it to your request."
    );
    refreshEquipmentFormMode();
  }

  function renderLaundryItemPreview() {
    renderLaundryComboQuickPicks();
    renderLaundryQuickPicks();
    renderServiceItemPreview(
      elements.laundryServicePreview,
      getCatalogItemById(normalizeText(elements.laundryServiceSelect?.value)),
      "No laundry service selected yet.",
      "Choose a laundry service to see the photo and price before adding it to your request."
    );
  }

  function buildEquipmentSelectionFromInputs() {
    const itemId = normalizeText(elements.equipmentItemSelect?.value);
    const catalogItem = getCatalogItemById(itemId);

    if (!catalogItem) {
      return { error: "Choose the equipment item to add." };
    }

    const quantity = Math.max(Number(elements.equipmentQuantityInput?.value || 1), 1);
    const mode = getEquipmentOrderMode(catalogItem);
    const durationDays = mode === "buy"
      ? 1
      : Math.max(Number(elements.equipmentDurationInput?.value || 1), 1);
    const unitPrice = Number(catalogItem.salesPrice || 0);

    return {
      selection: {
        selectionId: createClientSelectionId("equipment"),
        id: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category || "",
        imageUrl: resolveCatalogImageSrc(catalogItem),
        quantity,
        mode,
        durationDays,
        unitPrice,
        lineTotal: computeEquipmentSelectionLineTotal({
          quantity,
          durationDays,
          unitPrice,
          mode
        })
      }
    };
  }

  function addEquipmentSelectionFromInputs() {
    const { selection, error } = buildEquipmentSelectionFromInputs();

    if (!selection) {
      renderServiceMessage(elements.equipmentMessage, "error", error || "Choose an equipment item first.");
      return false;
    }

    const existingModes = [...new Set(state.equipmentSelections.map((entry) => entry.mode).filter(Boolean))];
    if (existingModes.length && !existingModes.includes(selection.mode)) {
      renderServiceMessage(
        elements.equipmentMessage,
        "error",
        selection.mode === "buy"
          ? "Buy items should be sent in their own order. Remove the rental items first or send a separate order."
          : "Rental items should be sent in their own request. Remove the buy items first or send a separate order."
      );
      return false;
    }

    const existingSelection = state.equipmentSelections.find(
      (entry) =>
        entry.id === selection.id &&
        entry.mode === selection.mode &&
        (
          selection.mode === "buy" ||
          Number(entry.durationDays || 1) === Number(selection.durationDays || 1)
        )
    );
    if (existingSelection) {
      existingSelection.quantity = Number(existingSelection.quantity || 0) + Number(selection.quantity || 0);
      existingSelection.lineTotal = computeEquipmentSelectionLineTotal(existingSelection);
    } else {
      state.equipmentSelections.push(selection);
    }
    if (elements.equipmentItemSelect) {
      elements.equipmentItemSelect.value = "";
    }
    if (elements.equipmentQuantityInput) {
      elements.equipmentQuantityInput.value = "1";
    }
    renderEquipmentItemPreview();
    renderEquipmentSelections();
    renderServiceMessage(elements.equipmentMessage, "success", `${escapeHtml(selection.name)} added to this customer request.`);
    return true;
  }

  function renderEquipmentSelections() {
    if (!elements.equipmentSelectedItems) {
      return;
    }

    if (!state.equipmentSelections.length) {
      elements.equipmentSelectedItems.innerHTML = `
        <article class="service-selected-empty">
          <strong>No equipment items added yet</strong>
          <p>Select an item, set quantity, and add it here. Rental items will also include days.</p>
        </article>
      `;
      refreshEquipmentFormMode();
      return;
    }

    elements.equipmentSelectedItems.innerHTML = state.equipmentSelections
      .map(
        (selection) => `
          <article class="service-selected-item">
            <div class="service-selected-item-main">
              <img class="service-selected-thumb" src="${escapeHtml(resolveCatalogImageSrc(selection))}" alt="${escapeHtml(selection.name)}">
              <div>
                <strong>${escapeHtml(selection.name)}</strong>
                <p>${escapeHtml(describeEquipmentSelection(selection))}</p>
                <p>${escapeHtml(getServiceCategoryLabel(selection.category, "equipment") || "Rent")}</p>
              </div>
            </div>
            <div class="service-selected-item-side">
              <strong>${selection.unitPrice > 0 ? escapeHtml(formatCurrency(selection.lineTotal)) : "Quote"}</strong>
              <button
                class="button button-secondary"
                data-service-action="remove-equipment-selection"
                data-selection-id="${escapeHtml(selection.selectionId)}"
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        `
      )
      .join("");
    refreshEquipmentFormMode();
  }

  function buildLaundrySelectionFromInputs() {
    const itemId = normalizeText(elements.laundryServiceSelect?.value);
    const catalogItem = getCatalogItemById(itemId);

    if (!catalogItem) {
      return { error: "Choose the laundry service to add." };
    }

    const itemCount = Math.max(Number(elements.laundryItemCountInput?.value || 1), 1);
    const itemSummary = normalizeText(elements.laundryItemSummaryInput?.value);
    const unitPrice = Number(catalogItem.salesPrice || 0);

    return {
      selection: {
        selectionId: createClientSelectionId("laundry"),
        id: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category || "",
        imageUrl: resolveCatalogImageSrc(catalogItem),
        itemCount,
        itemSummary,
        unitPrice,
        lineTotal: Number((unitPrice * itemCount).toFixed(2))
      }
    };
  }

  function addLaundrySelectionFromInputs() {
    const { selection, error } = buildLaundrySelectionFromInputs();

    if (!selection) {
      renderServiceMessage(elements.laundryMessage, "error", error || "Choose a laundry service first.");
      return false;
    }

    const existingSelection = state.laundrySelections.find(
      (entry) => entry.id === selection.id && normalizeText(entry.itemSummary) === normalizeText(selection.itemSummary)
    );
    if (existingSelection) {
      existingSelection.itemCount = Number(existingSelection.itemCount || 0) + Number(selection.itemCount || 0);
      existingSelection.lineTotal = Number(
        (Number(existingSelection.unitPrice || 0) * Number(existingSelection.itemCount || 0)).toFixed(2)
      );
    } else {
      state.laundrySelections.push(selection);
    }
    if (elements.laundryServiceSelect) {
      elements.laundryServiceSelect.value = "";
    }
    if (elements.laundryItemCountInput) {
      elements.laundryItemCountInput.value = "1";
    }
    if (elements.laundryItemSummaryInput) {
      elements.laundryItemSummaryInput.value = "";
    }
    renderLaundryItemPreview();
    renderLaundrySelections();
    renderServiceMessage(elements.laundryMessage, "success", `${escapeHtml(selection.name)} added to this customer request.`);
    return true;
  }

  function renderLaundrySelections() {
    if (!elements.laundrySelectedItems) {
      return;
    }

    if (!state.laundrySelections.length) {
      elements.laundrySelectedItems.innerHTML = `
        <article class="service-selected-empty">
          <strong>No laundry lines added yet</strong>
          <p>Choose the service, enter the item count, then add the line to this request.</p>
        </article>
      `;
      return;
    }

    elements.laundrySelectedItems.innerHTML = state.laundrySelections
      .map(
        (selection) => `
          <article class="service-selected-item">
            <div class="service-selected-item-main">
              <img class="service-selected-thumb" src="${escapeHtml(resolveCatalogImageSrc(selection))}" alt="${escapeHtml(selection.name)}">
              <div>
                <strong>${escapeHtml(selection.name)}</strong>
                <p>${escapeHtml(
                  `${selection.itemCount} item${selection.itemCount === 1 ? "" : "s"}${
                    selection.itemSummary ? ` • ${selection.itemSummary}` : ""
                  }`
                )}</p>
                <p>${escapeHtml(selection.category || "Laundry Service")}</p>
              </div>
            </div>
            <div class="service-selected-item-side">
              <strong>${selection.unitPrice > 0 ? escapeHtml(formatCurrency(selection.lineTotal)) : "Quote"}</strong>
              <button
                class="button button-secondary"
                data-service-action="remove-laundry-selection"
                data-selection-id="${escapeHtml(selection.selectionId)}"
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function splitTextLines(value) {
    const text = normalizeText(value);
    if (!text) {
      return [];
    }
    return text
      .split(/\r?\n|•|;/)
      .map((item) => normalizeText(item).replace(/^[\-\u2022]\s*/, ""))
      .filter(Boolean);
  }

  function renderVacancyParagraph(value, fallback) {
    return `<p class="vacancy-copy">${escapeHtml(normalizeText(value) || fallback)}</p>`;
  }

  function renderVacancyList(value, fallback) {
    const items = splitTextLines(value);
    if (!items.length) {
      return renderVacancyParagraph("", fallback);
    }
    return `
      <ul class="vacancy-bullets">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  function renderCatalogQuickFilters() {
    if (!elements.catalogQuickFilters) {
      return;
    }

    const activeAreaId = normalizeText(state.filters.area);
    elements.catalogQuickFilters.innerHTML = [
      `
        <button
          class="filter-chip ${activeAreaId === "" ? "is-active" : ""}"
          data-filter-area=""
          type="button"
        >
          All Areas
        </button>
      `,
      ...state.businessAreas.map(
        (area) => `
          <button
            class="filter-chip ${activeAreaId === area.id ? "is-active" : ""}"
            data-filter-area="${escapeHtml(area.id)}"
            type="button"
          >
            <span>${escapeHtml(getAreaMonogram(area.id))}</span>
            ${escapeHtml(area.shortLabel || area.label)}
          </button>
        `
      )
    ].join("");
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

  function getCatalogImageSrc(item) {
    const directImage = normalizeText(item.imageUrl);
    if (directImage) {
      return directImage;
    }

    return buildCatalogPlaceholderImage(item);
  }

  function buildCatalogPlaceholderImage(item) {
    const title = normalizeText(item.name) || "OneRoot Item";
    const category = normalizeText(item.category) || "Product";
    const areaLabel = getAreaLabel(item.businessAreaId) || "OneRoot";
    const initials = getAreaMonogram(item.businessAreaId) || "OR";
    const accent = getAreaColor(item.businessAreaId);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="${escapeHtml(title)}">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${accent}"/>
            <stop offset="100%" stop-color="#f4ede1"/>
          </linearGradient>
        </defs>
        <rect width="320" height="240" rx="28" fill="url(#g)"/>
        <circle cx="248" cy="56" r="38" fill="rgba(255,255,255,0.18)"/>
        <circle cx="72" cy="188" r="56" fill="rgba(255,255,255,0.12)"/>
        <rect x="24" y="24" width="112" height="108" rx="22" fill="rgba(255,255,255,0.18)"/>
        <text x="80" y="92" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff">${escapeHtml(initials)}</text>
        <text x="24" y="172" font-family="Inter, Arial, sans-serif" font-size="14" letter-spacing="2" fill="rgba(255,255,255,0.92)">${escapeHtml(areaLabel.toUpperCase().slice(0, 24))}</text>
        <text x="24" y="204" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff">${escapeHtml(title.slice(0, 24))}</text>
        <text x="24" y="224" font-family="Inter, Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.88)">${escapeHtml(category.slice(0, 30))}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getAreaColor(areaId) {
    switch (normalizeText(areaId)) {
      case "water-equipment":
        return "#2f6ea8";
      case "cold-store-groceries":
        return "#1f6b5b";
      case "laundry-services":
        return "#5f6fd8";
      case "mobile-money":
        return "#9a6a19";
      case "rentals-apartments":
        return "#8a4f74";
      case "fresh-foods-drinks":
        return "#ca5d27";
      case "kitchen":
        return "#8e5d23";
      default:
        return "#50606f";
    }
  }

  function buildVacancyApplyHref(vacancy) {
    const directLink = normalizeText(vacancy.applicationLink);
    if (directLink) {
      return directLink;
    }

    const whatsappNumber = normalizeWhatsappNumber(vacancy.applicationPhone || state.config?.whatsappNumber);
    if (whatsappNumber) {
      const message = encodeURIComponent(`Hello OneRoot, I want to apply for ${vacancy.jobTitle || "this vacancy"}.`);
      return `https://wa.me/${whatsappNumber}?text=${message}`;
    }

    const email = normalizeText(vacancy.applicationEmail || state.config?.supportEmail);
    if (email) {
      const subject = encodeURIComponent(`Application - ${vacancy.jobTitle || "OneRoot Vacancy"}`);
      return `mailto:${email}?subject=${subject}`;
    }

    const supportPhone = normalizeDigits(state.config?.supportPhone);
    return supportPhone ? `tel:${supportPhone}` : "#contact";
  }

  function buildVacancyApplyLabel(vacancy) {
    if (normalizeText(vacancy.applicationLink)) {
      return "Apply Online";
    }
    if (normalizeWhatsappNumber(vacancy.applicationPhone || state.config?.whatsappNumber)) {
      return "Apply On WhatsApp";
    }
    if (normalizeText(vacancy.applicationEmail || state.config?.supportEmail)) {
      return "Apply By Email";
    }
    return "Contact OneRoot";
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
    const activeAreaLabel = state.filters.area ? getAreaLabel(state.filters.area) : "All Areas";
    const activeSearch = normalizeText(state.filters.search);
    const quoteItemCount = filteredItems.filter((item) => Number(item.salesPrice || 0) <= 0).length;

    renderCatalogQuickFilters();

    setText(
      elements.catalogMeta,
      filteredItems.length === 0
        ? "No items match the current search."
        : `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} available.`
    );

    if (elements.catalogResultsMeta) {
      elements.catalogResultsMeta.innerHTML = `
        <div class="results-badge-row">
          <span class="results-badge">${escapeHtml(activeAreaLabel)}</span>
          <span class="results-badge">${escapeHtml(
            `${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"}`
          )}</span>
          <span class="results-badge">${escapeHtml(
            `${quoteItemCount} quote line${quoteItemCount === 1 ? "" : "s"}`
          )}</span>
          ${
            activeSearch
              ? `<span class="results-badge results-badge-search">Search: ${escapeHtml(activeSearch)}</span>`
              : ""
          }
        </div>
        <p class="results-meta-copy">
          ${
            filteredItems.length > visibleItems.length
              ? escapeHtml(
                  `Showing ${visibleItems.length} of ${filteredItems.length} items. Use search or area filters to narrow the list.`
                )
              : escapeHtml(`${filteredItems.length} item${filteredItems.length === 1 ? "" : "s"} shown.`)
          }
        </p>
      `;
    }

    if (filteredItems.length === 0) {
      elements.catalogGrid.innerHTML = `
        <article class="catalog-card">
          <strong>No items found</strong>
          <p>Try another search term or choose a different area.</p>
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
              `${filteredItems.length - visibleItems.length} more item${
                filteredItems.length - visibleItems.length === 1 ? "" : "s"
              } in this section.`
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
    const isQuoteItem = Number(item.salesPrice || 0) <= 0;
    const imageSrc = getCatalogImageSrc(item);

    return `
      <article class="catalog-card ${isQuoteItem ? "catalog-card-quote" : ""}">
        <div class="catalog-card-image-wrap">
          <img
            class="catalog-card-image"
            src="${escapeHtml(imageSrc)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.src='/assets/oneroot-icon-transparent.png'"
          />
        </div>
        <div class="catalog-card-header">
          <div class="catalog-card-identity">
            <span class="catalog-mark">${escapeHtml(getAreaMonogram(item.businessAreaId))}</span>
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <p>${escapeHtml(getAreaLabel(item.businessAreaId))}</p>
            </div>
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
          <label class="quantity-field">
            <span>Qty</span>
            <input
              type="number"
              min="1"
              step="1"
              value="1"
              inputmode="numeric"
              data-item-quantity="${escapeHtml(item.id)}"
              aria-label="Quantity for ${escapeHtml(item.name)}"
            />
          </label>
          <button class="button button-primary" data-shop-action="add-to-cart" data-item-id="${escapeHtml(
            item.id
          )}" type="button">
            ${isQuoteItem ? "Add Quote Item" : "Add To Order"}
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

    const { totalQuantity, subtotal, areaCount, quoteCount } = getCartMetrics();

    elements.cartToggleCount.textContent = String(totalQuantity);
    elements.cartSubtotalValue.textContent = formatCurrency(subtotal);
    setText(elements.cartItemCountValue, String(totalQuantity));
    setText(elements.cartAreaCountValue, String(areaCount));
    setText(elements.cartQuoteCountValue, String(quoteCount));

    if (elements.mobileCartCount) {
      elements.mobileCartCount.textContent = `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;
    }

    if (elements.mobileCartTotal) {
      elements.mobileCartTotal.textContent = formatCurrency(subtotal);
    }

    if (elements.mobileCartBar) {
      elements.mobileCartBar.classList.toggle(
        "hidden",
        totalQuantity === 0 || (isCompactViewport() && state.isCartOpen)
      );
    }

    if (state.cart.length === 0) {
      elements.cartItems.innerHTML = `
        <article class="cart-item cart-empty-state">
          <strong>Your order basket is empty</strong>
          <p>Add groceries, requests, drinks, or services to start a OneRoot order.</p>
        </article>
      `;
      syncCartPanelLayout();
      return;
    }

    elements.cartItems.innerHTML = state.cart
      .map(
        (item) => `
          <article class="cart-item">
            <div class="cart-item-row">
              <div class="cart-item-row-main">
                <img
                  class="cart-item-thumb"
                  src="${escapeHtml(getCatalogImageSrc(item))}"
                  alt="${escapeHtml(item.name)}"
                  loading="lazy"
                  onerror="this.src='/assets/oneroot-icon-transparent.png'"
                />
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <p>${escapeHtml(getAreaLabel(item.businessAreaId))} • ${escapeHtml(item.category || "General")}</p>
                </div>
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

    syncCartPanelLayout();
  }

  function handleBodyClick(event) {
    const serviceActionButton = event.target.closest("button[data-service-action]");

    if (serviceActionButton) {
      const selectionId = normalizeText(serviceActionButton.dataset.selectionId);

      if (serviceActionButton.dataset.serviceAction === "remove-equipment-selection") {
        state.equipmentSelections = state.equipmentSelections.filter(
          (selection) => selection.selectionId !== selectionId
        );
        renderEquipmentSelections();
      }

      if (serviceActionButton.dataset.serviceAction === "remove-laundry-selection") {
        state.laundrySelections = state.laundrySelections.filter(
          (selection) => selection.selectionId !== selectionId
        );
        renderLaundrySelections();
      }

      return;
    }

    const serviceCategoryButton = event.target.closest("button[data-service-category]");

    if (serviceCategoryButton) {
      const serviceType = normalizeText(serviceCategoryButton.dataset.serviceType);
      const category = normalizeText(serviceCategoryButton.dataset.serviceCategory);

      if (serviceType === "equipment") {
        state.serviceFilters.equipmentCategory = category;
        populateEquipmentOptions();
      }

      if (serviceType === "laundry") {
        state.serviceFilters.laundryCategory = category;
        populateLaundryOptions();
      }

      return;
    }

    const servicePickButton = event.target.closest("button[data-service-pick]");

    if (servicePickButton) {
      const itemId = normalizeText(servicePickButton.dataset.itemId);
      const serviceType = normalizeText(servicePickButton.dataset.servicePick);

      if (serviceType === "equipment" && elements.equipmentItemSelect) {
        elements.equipmentItemSelect.value = itemId;
        renderEquipmentItemPreview();
        elements.equipmentQuantityInput?.focus();
      }

      if (serviceType === "laundry" && elements.laundryServiceSelect) {
        elements.laundryServiceSelect.value = itemId;
        renderLaundryItemPreview();
        elements.laundryItemCountInput?.focus();
      }

      return;
    }

    const areaFilterButton = event.target.closest("button[data-filter-area]");

    if (areaFilterButton) {
      state.filters.area = normalizeText(areaFilterButton.dataset.filterArea);
      resetVisibleCatalogCount();

      if (elements.catalogAreaFilter) {
        elements.catalogAreaFilter.value = state.filters.area;
      }

      renderCatalog();
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

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
      state.visibleItemCount += getVisibleItemStep();
      renderCatalog();
      return;
    }

    const areaJumpButton = event.target.closest("button[data-area-jump]");

    if (areaJumpButton) {
      state.filters.area = areaJumpButton.dataset.areaJump || "";
      resetVisibleCatalogCount();

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
        imageUrl: getCatalogImageSrc(item),
        unitPrice: Number(item.salesPrice || 0),
        quantity,
        notes: item.notes || ""
      });
    }

    const quantityInput = document.querySelector(`input[data-item-quantity="${cssEscape(itemId)}"]`);
    if (quantityInput) {
      quantityInput.value = "1";
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
      const result = await submitPublicOrder(payload);
      const amountLine = buildOrderAmountLine(result);

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

  async function handleEquipmentBookingSubmit(event) {
    event.preventDefault();

    const customerName = normalizeText(elements.equipmentCustomerName?.value);
    const customerPhone = normalizeText(elements.equipmentCustomerPhone?.value);

    if (!customerName || !customerPhone) {
      renderServiceMessage(elements.equipmentMessage, "error", "Customer name and phone number are required.");
      return;
    }

    if (!state.equipmentSelections.length && !addEquipmentSelectionFromInputs()) {
      return;
    }

    const selections = [...state.equipmentSelections];
    const buySelections = selections.filter((selection) => selection.mode === "buy");
    const rentSelections = selections.filter((selection) => selection.mode !== "buy");
    const hasBuySelections = buySelections.length > 0;
    const hasRentSelections = rentSelections.length > 0;
    const preferredDate = normalizeText(elements.equipmentStartDateInput?.value);
    const preferredTime = normalizeText(elements.equipmentPreferredTimeInput?.value);
    const deliveryMode = normalizeText(elements.equipmentDeliveryModeInput?.value) || "Call To Confirm";
    const address = normalizeText(elements.equipmentAddressInput?.value);
    const siteLocation = normalizeText(elements.equipmentSiteLocationInput?.value);
    const needOperator = Boolean(elements.equipmentNeedOperatorInput?.checked);
    const notes = normalizeText(elements.equipmentNotesInput?.value);
    const customerEmail = normalizeText(elements.equipmentCustomerEmail?.value);
    const paymentMethod = normalizeText(elements.equipmentPaymentMethodInput?.value) || "Call To Confirm";

    const orderTitle = hasBuySelections && hasRentSelections
      ? "Equipment order and rental request"
      : hasBuySelections
        ? "Equipment purchase order"
        : "Equipment rental booking request";
    const orderNotes = [
      orderTitle,
      rentSelections.length
        ? `Rental items: ${rentSelections
            .map(
              (selection) =>
                `${selection.name} x${selection.quantity} for ${selection.durationDays} day${
                  selection.durationDays === 1 ? "" : "s"
                }`
            )
            .join("; ")}`
        : "",
      buySelections.length
        ? `Buy items: ${buySelections
            .map((selection) => `${selection.name} x${selection.quantity}`)
            .join("; ")}`
        : "",
      preferredDate ? `Preferred start date: ${preferredDate}` : "",
      preferredTime ? `Preferred time: ${preferredTime}` : "",
      deliveryMode ? `Delivery mode: ${deliveryMode}` : "",
      siteLocation ? `Site location: ${siteLocation}` : "",
      needOperator ? "Customer requested staff guidance or operator support." : "",
      notes ? `Additional notes: ${notes}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    renderServiceMessage(
      elements.equipmentMessage,
      "success",
      hasBuySelections && !hasRentSelections ? "Sending equipment order..." : "Sending equipment request..."
    );

    try {
      const result = await submitPublicOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryMode,
        deliveryAddress: address || siteLocation,
        preferredDate,
        preferredTime,
        paymentMethod,
        notes: orderNotes,
        items: selections.map((selection) => ({
          id: selection.id,
          quantity: selection.quantity,
          unitPrice: selection.unitPrice,
          pricingMultiplier: selection.mode === "buy" ? 1 : selection.durationDays,
          requestedDays: selection.mode === "buy" ? 0 : selection.durationDays,
          notes: `${
            selection.mode === "buy"
              ? `${selection.name} x${selection.quantity} to buy`
              : `${selection.name} x${selection.quantity} for ${selection.durationDays} day${
                  selection.durationDays === 1 ? "" : "s"
                }`
          }\n${orderNotes}`
        }))
      });

      renderServiceMessage(
        elements.equipmentMessage,
        "success",
        `${
          hasBuySelections && hasRentSelections
            ? "Equipment order and rental request received."
            : hasBuySelections
              ? "Equipment order received."
              : "Equipment booking received."
        } Your order number is <strong>${escapeHtml(
          result.orderNumber
        )}</strong>. ${escapeHtml(buildOrderAmountLine(result))}. Track it later with the same phone number.`
      );

      if (elements.equipmentNotesInput) {
        elements.equipmentNotesInput.value = "";
      }
      state.equipmentSelections = [];
      renderEquipmentSelections();
      persistServiceCustomerDraftFromForms();
    } catch (error) {
      console.error(error);
      renderServiceMessage(
        elements.equipmentMessage,
        "error",
        normalizeText(error.message) || "The equipment booking could not be sent right now."
      );
    }
  }

  async function handleLaundryBookingSubmit(event) {
    event.preventDefault();

    const customerName = normalizeText(elements.laundryCustomerName?.value);
    const customerPhone = normalizeText(elements.laundryCustomerPhone?.value);

    if (!customerName || !customerPhone) {
      renderServiceMessage(elements.laundryMessage, "error", "Customer name and phone number are required.");
      return;
    }

    if (!state.laundrySelections.length && !addLaundrySelectionFromInputs()) {
      return;
    }

    const selections = [...state.laundrySelections];
    const deliveryMode = normalizeText(elements.laundryDeliveryModeInput?.value) || "Pickup";
    const preferredDate = normalizeText(elements.laundryPickupDateInput?.value);
    const preferredTime = normalizeText(elements.laundryPreferredTimeInput?.value);
    const address = normalizeText(elements.laundryAddressInput?.value);
    const itemSummary = normalizeText(elements.laundryItemSummaryInput?.value);
    const notes = normalizeText(elements.laundryNotesInput?.value);
    const customerEmail = normalizeText(elements.laundryCustomerEmail?.value);
    const paymentMethod = normalizeText(elements.laundryPaymentMethodInput?.value) || "Call To Confirm";

    const orderNotes = [
      "Laundry service request",
      `Laundry lines: ${selections
        .map(
          (selection) =>
            `${selection.name} • ${selection.itemCount} item${selection.itemCount === 1 ? "" : "s"}${
              selection.itemSummary ? ` • ${selection.itemSummary}` : ""
            }`
        )
        .join("; ")}`,
      itemSummary ? `General item notes: ${itemSummary}` : "",
      preferredDate ? `Preferred date: ${preferredDate}` : "",
      preferredTime ? `Preferred time: ${preferredTime}` : "",
      deliveryMode ? `Pickup / delivery mode: ${deliveryMode}` : "",
      notes ? `Special instructions: ${notes}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    renderServiceMessage(elements.laundryMessage, "success", "Sending laundry request...");

    try {
      const result = await submitPublicOrder({
        customerName,
        customerPhone,
        customerEmail,
        deliveryMode,
        deliveryAddress: address,
        preferredDate,
        preferredTime,
        paymentMethod,
        notes: orderNotes,
        items: selections.map((selection) => ({
          id: selection.id,
          quantity: selection.itemCount,
          unitPrice: selection.unitPrice,
          notes: `${selection.name} • ${selection.itemCount} item${selection.itemCount === 1 ? "" : "s"}${
            selection.itemSummary ? ` • ${selection.itemSummary}` : ""
          }\n${orderNotes}`
        }))
      });

      renderServiceMessage(
        elements.laundryMessage,
        "success",
        `Laundry request received. Your order number is <strong>${escapeHtml(
          result.orderNumber
        )}</strong>. ${escapeHtml(buildOrderAmountLine(result))}. Track it later with the same phone number.`
      );

      if (elements.laundryNotesInput) {
        elements.laundryNotesInput.value = "";
      }
      state.laundrySelections = [];
      renderLaundrySelections();
      persistServiceCustomerDraftFromForms();
    } catch (error) {
      console.error(error);
      renderServiceMessage(
        elements.laundryMessage,
        "error",
        normalizeText(error.message) || "The laundry request could not be sent right now."
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

  async function handleLeadCaptureSubmit(event) {
    event.preventDefault();

    const customerName = normalizeText(elements.leadCustomerName?.value);
    const customerPhone = normalizeText(elements.leadCustomerPhone?.value);
    const customerEmail = normalizeText(elements.leadCustomerEmail?.value);
    const businessAreaId = normalizeText(elements.leadBusinessArea?.value) || "shared-operations";
    const interestType = normalizeText(elements.leadInterestType?.value) || "Website Interest";
    const preferredContact = normalizeText(elements.leadPreferredContact?.value) || "WhatsApp";
    const referralName = normalizeText(elements.leadReferralName?.value);
    const notes = normalizeText(elements.leadNotes?.value);

    if (!customerName) {
      renderServiceMessage(elements.leadMessage, "error", "Enter your name so OneRoot can follow up correctly.");
      return;
    }
    if (!customerPhone && !customerEmail) {
      renderServiceMessage(elements.leadMessage, "error", "Enter a phone number or email so OneRoot can reach you.");
      return;
    }

    renderServiceMessage(elements.leadMessage, "success", "Saving your follow-up request...");

    try {
      const result = await submitLeadCapture({
        customerName,
        customerPhone,
        customerEmail,
        businessAreaId,
        interestType,
        preferredContact,
        referralName,
        notes,
        leadSource: interestType === "Referral Introduction" ? "Referral" : "Website"
      });

      renderServiceMessage(
        elements.leadMessage,
        "success",
        `${escapeHtml(result.contactName || customerName)}, your request has been saved. OneRoot will follow up through ${escapeHtml(preferredContact)}.`
      );
      persistLeadCaptureDraft();
      if (elements.leadReferralName) {
        elements.leadReferralName.value = "";
      }
      if (elements.leadNotes) {
        elements.leadNotes.value = "";
      }
    } catch (error) {
      console.error(error);
      renderServiceMessage(
        elements.leadMessage,
        "error",
        normalizeText(error.message) || "The follow-up request could not be saved right now."
      );
    }
  }

  function handleLeadReferralShare() {
    const customerName = normalizeText(elements.leadCustomerName?.value);
    const interestType = normalizeText(elements.leadInterestType?.value) || "Weekly Offers";
    const areaLabel = getAreaLabel(normalizeText(elements.leadBusinessArea?.value)) || "OneRoot Essentials";
    const supportPhone = normalizeText(state.config?.supportPhone);
    const message = [
      customerName ? `${customerName} recommends OneRoot Essentials for daily essentials.` : "Try OneRoot Essentials for daily essentials.",
      `OneRoot supports ${areaLabel.toLowerCase()}, groceries, laundry, equipment, and community needs.`,
      `Ask them about ${interestType.toLowerCase()}.`,
      supportPhone ? `Call ${supportPhone}` : "",
      `or visit ${window.location.origin}`
    ]
      .filter(Boolean)
      .join(" ");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
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

    renderServiceMessage(elements.checkoutMessage, type, html);
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

  function persistServiceCustomerDraftFromForms() {
    const nextDraft = {
      ...state.customerDraft,
      customerName: firstNonEmpty(
        elements.equipmentCustomerName?.value,
        elements.laundryCustomerName?.value,
        state.customerDraft.customerName
      ),
      customerPhone: firstNonEmpty(
        elements.equipmentCustomerPhone?.value,
        elements.laundryCustomerPhone?.value,
        state.customerDraft.customerPhone
      ),
      customerEmail: firstNonEmpty(
        elements.equipmentCustomerEmail?.value,
        elements.laundryCustomerEmail?.value,
        state.customerDraft.customerEmail
      ),
      deliveryMode: firstNonEmpty(
        elements.equipmentDeliveryModeInput?.value,
        elements.laundryDeliveryModeInput?.value,
        state.customerDraft.deliveryMode
      ),
      deliveryAddress: firstNonEmpty(
        elements.equipmentAddressInput?.value,
        elements.laundryAddressInput?.value,
        state.customerDraft.deliveryAddress
      ),
      preferredDate: firstNonEmpty(
        elements.equipmentStartDateInput?.value,
        elements.laundryPickupDateInput?.value,
        state.customerDraft.preferredDate
      ),
      preferredTime: firstNonEmpty(
        elements.equipmentPreferredTimeInput?.value,
        elements.laundryPreferredTimeInput?.value,
        state.customerDraft.preferredTime
      ),
      paymentMethod: firstNonEmpty(
        elements.equipmentPaymentMethodInput?.value,
        elements.laundryPaymentMethodInput?.value,
        state.customerDraft.paymentMethod
      )
    };

    state.customerDraft = nextDraft;
    window.localStorage.setItem(SHOP_CUSTOMER_STORAGE_KEY, JSON.stringify(nextDraft));
  }

  function persistLeadCaptureDraft() {
    const nextDraft = {
      ...state.customerDraft,
      customerName: firstNonEmpty(elements.leadCustomerName?.value, state.customerDraft.customerName),
      customerPhone: firstNonEmpty(elements.leadCustomerPhone?.value, state.customerDraft.customerPhone),
      customerEmail: firstNonEmpty(elements.leadCustomerEmail?.value, state.customerDraft.customerEmail)
    };

    state.customerDraft = nextDraft;
    window.localStorage.setItem(SHOP_CUSTOMER_STORAGE_KEY, JSON.stringify(nextDraft));
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

  function restoreServiceCustomerDraftIntoForms() {
    setInputValue(elements.equipmentCustomerName, state.customerDraft.customerName);
    setInputValue(elements.equipmentCustomerPhone, state.customerDraft.customerPhone);
    setInputValue(elements.equipmentCustomerEmail, state.customerDraft.customerEmail);
    setInputValue(elements.equipmentAddressInput, state.customerDraft.deliveryAddress);
    setInputValue(elements.equipmentStartDateInput, state.customerDraft.preferredDate);
    setInputValue(elements.equipmentPreferredTimeInput, state.customerDraft.preferredTime);
    if (elements.equipmentDeliveryModeInput && state.customerDraft.deliveryMode) {
      elements.equipmentDeliveryModeInput.value = state.customerDraft.deliveryMode;
    }
    if (elements.equipmentPaymentMethodInput && state.customerDraft.paymentMethod) {
      elements.equipmentPaymentMethodInput.value = state.customerDraft.paymentMethod;
    }

    setInputValue(elements.laundryCustomerName, state.customerDraft.customerName);
    setInputValue(elements.laundryCustomerPhone, state.customerDraft.customerPhone);
    setInputValue(elements.laundryCustomerEmail, state.customerDraft.customerEmail);
    setInputValue(elements.laundryAddressInput, state.customerDraft.deliveryAddress);
    setInputValue(elements.laundryPickupDateInput, state.customerDraft.preferredDate);
    setInputValue(elements.laundryPreferredTimeInput, state.customerDraft.preferredTime);
    if (elements.laundryDeliveryModeInput && state.customerDraft.deliveryMode) {
      elements.laundryDeliveryModeInput.value = state.customerDraft.deliveryMode;
    }
    if (elements.laundryPaymentMethodInput && state.customerDraft.paymentMethod) {
      elements.laundryPaymentMethodInput.value = state.customerDraft.paymentMethod;
    }
  }

  function restoreLeadCaptureIntoForm() {
    setInputValue(elements.leadCustomerName, state.customerDraft.customerName);
    setInputValue(elements.leadCustomerPhone, state.customerDraft.customerPhone);
    setInputValue(elements.leadCustomerEmail, state.customerDraft.customerEmail);
  }

  function toggleCartPanel() {
    if (!isCompactViewport()) {
      elements.cartPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    state.isCartOpen = !state.isCartOpen;
    syncCartPanelLayout();
  }

  function openCartPanel() {
    state.isCartOpen = true;
    syncCartPanelLayout();
  }

  function closeCartPanel() {
    if (!isCompactViewport()) {
      return;
    }

    state.isCartOpen = false;
    syncCartPanelLayout();
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

  function getAreaMonogram(areaId) {
    return (
      getAreaLabel(areaId)
        .replace(/[^A-Za-z0-9 ]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "OR"
    );
  }

  function clearCatalogFilters() {
    state.filters.search = "";
    state.filters.area = "";
    state.filters.sort = "featured";
    resetVisibleCatalogCount();
    setInputValue(elements.catalogSearchInput, "");
    setInputValue(elements.catalogAreaFilter, "");
    setInputValue(elements.catalogSortFilter, "featured");
    renderCatalog();
  }

  function maybeSnapToActiveAnchor() {
    const hash = normalizeText(window.location.hash).replace(/^#/, "");
    if (!hash || !isCompactViewport()) {
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    window.setTimeout(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    }, 90);
  }

  function getCartMetrics() {
    const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(
      state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    );
    const areaCount = new Set(state.cart.map((item) => item.businessAreaId)).size;
    const quoteCount = state.cart.filter((item) => Number(item.unitPrice || 0) <= 0).length;

    return { totalQuantity, subtotal, areaCount, quoteCount };
  }

  function isCompactViewport() {
    return window.matchMedia("(max-width: 1024px)").matches;
  }

  function getInitialVisibleItemCount() {
    return isCompactViewport() ? 8 : 12;
  }

  function getVisibleItemStep() {
    return isCompactViewport() ? 8 : 12;
  }

  function resetVisibleCatalogCount() {
    state.visibleItemCount = getInitialVisibleItemCount();
  }

  function syncCartPanelLayout() {
    const compact = isCompactViewport();
    const shouldShowCart = !compact || state.isCartOpen;
    const cartMetrics = getCartMetrics();

    if (elements.cartPanel) {
      elements.cartPanel.classList.toggle("hidden", !shouldShowCart);
      elements.cartPanel.classList.toggle("cart-panel-drawer", compact);
    }

    if (elements.cartScrim) {
      elements.cartScrim.classList.toggle("hidden", !compact || !state.isCartOpen);
    }

    if (elements.closeCartBtn) {
      elements.closeCartBtn.classList.toggle("hidden", !compact);
    }

    if (elements.mobileCartBar) {
      elements.mobileCartBar.classList.toggle(
        "hidden",
        cartMetrics.totalQuantity === 0 || (compact && state.isCartOpen)
      );
    }

    document.body.classList.toggle("cart-drawer-open", compact && state.isCartOpen);
  }

  async function submitPublicOrder(payload) {
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

    return result;
  }

  async function submitLeadCapture(payload) {
    const response = await fetch("/api/public/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(Array.isArray(result.errors) ? result.errors[0] : "Unable to save follow-up request.");
    }

    return result;
  }

  function buildOrderAmountLine(result) {
    return result.includesQuoteItems && Number(result.totalAmount || 0) > 0
      ? `${formatCurrency(result.totalAmount)} plus quote-confirmed items`
      : result.includesQuoteItems
        ? "Quote request captured for staff confirmation"
        : formatCurrency(result.totalAmount || 0);
  }

  function renderServiceMessage(targetNode, type, html) {
    if (!targetNode) {
      return;
    }

    targetNode.innerHTML = html;
    targetNode.classList.remove("hidden", "checkout-message-success", "checkout-message-error");
    targetNode.classList.add(type === "error" ? "checkout-message-error" : "checkout-message-success");
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

  function firstNonEmpty(...values) {
    for (const value of values) {
      const normalized = normalizeText(value);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  }

  function normalizeDigits(value) {
    return normalizeText(value).replace(/[^\d]/g, "");
  }

  function normalizeWhatsappNumber(value) {
    const digits = normalizeDigits(value);
    if (digits.startsWith("233")) {
      return digits;
    }
    if (digits.length === 10 && digits.startsWith("0")) {
      return `233${digits.slice(1)}`;
    }
    if (digits.length === 9) {
      return `233${digits}`;
    }
    return digits;
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

  function applyInitialFiltersFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const dataset = document.body?.dataset || {};
    const defaultSearch = normalizeText(dataset.catalogDefaultSearch);
    const defaultArea = normalizeText(dataset.catalogDefaultArea);
    const defaultSort = normalizeText(dataset.catalogDefaultSort) || "featured";
    state.filters.search = normalizeText(params.get("q")) || defaultSearch;
    state.filters.area = normalizeText(params.get("area")) || defaultArea;
    state.filters.sort = normalizeText(params.get("sort")) || defaultSort;
  }
})();
