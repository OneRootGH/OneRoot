(function () {
  const body = document.body;
  const endpoint = body?.dataset.onlineOrderAlertUrl;
  const deskUrl = body?.dataset.onlineOrderDeskUrl;
  if (!endpoint || !deskUrl || body.dataset.onlineOrderAlerts !== "true") {
    return;
  }

  const storageKey = "oneroot-online-order-alert-cursor";
  let cursor = window.sessionStorage.getItem(storageKey) || "";
  let audioContext = null;
  let soundEnabled = false;
  let alertStack = null;

  function money(value) {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(Number(value || 0)).replace("GHS", "GH₵");
  }

  function enableSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    try {
      audioContext = audioContext || new AudioContext();
      audioContext.resume?.();
      soundEnabled = audioContext.state === "running";
    } catch (_) {
      soundEnabled = false;
    }
  }

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, enableSound, { once: true, passive: true });
  });

  function playOrderTone() {
    if (!soundEnabled || !audioContext) {
      return;
    }
    try {
      const now = audioContext.currentTime;
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      gain.connect(audioContext.destination);
      [740, 988].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.17);
        oscillator.connect(gain);
        oscillator.start(now + index * 0.17);
        oscillator.stop(now + 0.18 + index * 0.17);
      });
    } catch (_) {
      // A blocked browser audio context should never prevent the visible alert.
    }
  }

  function ensureAlertStack() {
    if (alertStack) {
      return alertStack;
    }
    alertStack = document.createElement("section");
    alertStack.className = "online-order-alert-stack";
    alertStack.setAttribute("aria-live", "assertive");
    alertStack.setAttribute("aria-label", "New online order alerts");
    document.body.appendChild(alertStack);
    return alertStack;
  }

  function showOrderAlert(order) {
    const card = document.createElement("article");
    card.className = "online-order-alert";

    const heading = document.createElement("div");
    heading.className = "online-order-alert-heading";
    const title = document.createElement("strong");
    title.textContent = "New Online Order";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.setAttribute("aria-label", "Dismiss order alert");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", () => card.remove());
    heading.append(title, dismiss);

    const orderLabel = document.createElement("p");
    orderLabel.textContent = `${order.orderNumber || "New order"} · ${order.customerName || "Website customer"}`;
    const detail = document.createElement("small");
    detail.textContent = [order.businessAreaSummary, order.deliveryMode, order.customerPhone].filter(Boolean).join(" · ") || "Website order received";

    const summary = document.createElement("div");
    summary.className = "online-order-alert-summary";
    const amount = document.createElement("strong");
    amount.textContent = money(order.totalAmount);
    const received = document.createElement("small");
    received.textContent = "Review and confirm";
    summary.append(amount, received);

    const actions = document.createElement("div");
    actions.className = "online-order-alert-actions";
    const open = document.createElement("a");
    open.className = "button primary";
    open.href = `${deskUrl}?order_id=${encodeURIComponent(order.id || "")}`;
    open.textContent = "Open Order";
    actions.append(open);

    card.append(heading, orderLabel, detail, summary, actions);
    ensureAlertStack().prepend(card);
    window.setTimeout(() => card.remove(), 30000);
  }

  async function poll() {
    if (document.visibilityState !== "visible") {
      return;
    }
    const url = new URL(endpoint, window.location.origin);
    if (cursor) {
      url.searchParams.set("after", cursor);
    } else {
      url.searchParams.set("initialize", "1");
    }
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        return;
      }
      const initialPoll = !cursor;
      cursor = payload.cursor || cursor;
      if (cursor) {
        window.sessionStorage.setItem(storageKey, cursor);
      }
      if (initialPoll || !Array.isArray(payload.orders) || !payload.orders.length) {
        return;
      }
      payload.orders.forEach(showOrderAlert);
      playOrderTone();
    } catch (_) {
      // Notification checks are non-blocking and should stay quiet during a brief reconnect.
    }
  }

  void poll();
  window.setInterval(poll, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void poll();
    }
  });
})();
