/* Astel-Com admin dashboard (localStorage demo, not production authorization). */
"use strict";

const AdminSafety = Object.freeze({
  escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  },
  normalizeTtn(value) {
    return String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  },
  isValidTtn(value, carrierKey) {
    const code = AdminSafety.normalizeTtn(value);
    if (carrierKey === "nova") return /^\d{14}$/.test(code);
    if (carrierKey === "ukr")
      return /^(?:[A-Z]{2}\d{9}[A-Z]{2}|\d{13,14})$/.test(code);
    return (
      /^[A-Z0-9-]{8,32}$/.test(code) && (code.match(/\d/g) || []).length >= 5
    );
  },
  safeImageUrl(value) {
    const src = String(value ?? "");
    if (
      typeof CatalogManager !== "undefined" &&
      CatalogManager.validImageSource(src)
    )
      return src;
    return /^assets\/images\/[\p{L}\p{N} _.,()\-\/]+\.(?:png|webp|jpg|jpeg|svg)$/u.test(
      src,
    ) && !src.includes("..")
      ? src
      : "assets/images/logo-main.svg";
  },
});
// Payment and order-progress are independent dimensions of the admin filter.
// A localStorage payment flag alone is not proof: use OrderFinance.paymentStatus().
const AdminOrderFilters = Object.freeze({
  matches(order, selectedValue, finance) {
    if (selectedValue === "all") return true;
    if (selectedValue.startsWith("payment:")) {
      return (
        finance.paymentStatus(order) === selectedValue.slice("payment:".length)
      );
    }
    return order.statusCode === selectedValue;
  },
});
if (typeof module !== "undefined")
  module.exports = {
    ...AdminSafety,
    matchesOrderFilter: AdminOrderFilters.matches,
  };

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const ACTIVE_ORDER_KEY = "astelkom_active_order";
    const COMPLETED_ORDERS_KEY = "astelkom_completed_orders";

    const esc = AdminSafety.escapeHtml;

    const STATUS_LABELS = {
      active: "Оформлено",
      processing: "Передано в обробку",
      shipped: "Відправлено",
      completed: "Виконано",
      canceled: "Скасовано",
    };

    const PIPELINE_STEPS = [
      { code: "active", label: "1. Оформлено" },
      { code: "processing", label: "2. В обробці" },
      { code: "shipped", label: "3. Відправлено" },
      { code: "completed", label: "4. Виконано" },
    ];

    const NEXT_STEP_ACTION = {
      active: { nextCode: "processing", btnText: "Прийняти в обробку" },
      processing: {
        nextCode: "shipped",
        btnText: "Позначити відправленим",
      },
      shipped: { nextCode: "completed", btnText: "✓ Завершити (Виконано)" },
    };

    // Tracks which order IDs currently have their TTN input open for editing
    const editingTtnOrderIds = new Set();
    const editingOrderIds = new Set();
    // Order-specific notes use the same customer profiles as the Clients tab.
    const expandedOrderNoteIds = new Set();
    // One mutually exclusive lower workspace per order; closed by default.
    const activeOrderPanes = new Map();
    const openOrderNoteComposers = new Set();
    const orderNoteDrafts = new Map();
    // Preserve an address being typed if another admin action re-renders an open editor.
    const orderAddressDrafts = new Map();
    const orderDestinationDrafts = new Map();
    let lastActionUndo = null;
    let undoToastTimer = null;

    const formatMoney = (val) =>
      Number(val || 0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₴";

    const formatDate = (ts) => {
      const d = new Date(ts || Date.now());
      return d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Old localStorage notes predate author tracking: do not invent an author.
    const noteAuthor = (note) => `<span class="admin-note-author" title="Хто додав примітку">${note.authorName ? `Додав: ${esc(note.authorName)}` : "Автор не вказаний"}</span>`;

    // The log is informational until backend authentication and storage exist.
    const activityRecord = (payload) => AstelAdminActivity.record(payload);
    const orderActivity = (previous, current) => {
      if (!previous) return;
      const id = String(current.orderId);
      const log = (type, action, summary, detail) => activityRecord({
        type, action, entityType: "order", entityId: id, summary, detail,
      });
      const text = (val) => String(val ?? "").trim() || "—";
      const money = (val) => `${Number(val || 0).toLocaleString("uk-UA")} ₴`;
      if (previous.statusCode !== current.statusCode)
        log("order", "order.status", "Змінено статус замовлення", `${STATUS_LABELS[previous.statusCode] || text(previous.statusCode)} → ${STATUS_LABELS[current.statusCode] || text(current.statusCode)}`);
      if (text(previous.ttn) !== text(current.ttn))
        log("delivery", "order.ttn", current.ttn ? (previous.ttn ? "Змінено ТТН" : "Додано ТТН") : "Видалено ТТН", `${text(previous.ttn)} → ${text(current.ttn)}`);
      const customerFields = { firstName: "Ім’я", lastName: "Прізвище", phone: "Телефон", email: "E-mail" };
      const customerChanges = Object.entries(customerFields).filter(([key]) =>
        text(previous.customer?.[key]) !== text(current.customer?.[key]))
        .map(([key, label]) => `${label}: ${text(previous.customer?.[key])} → ${text(current.customer?.[key])}`);
      if (customerChanges.length) log("customer", "order.customer", "Оновлено дані покупця", customerChanges.join("\n"));
      const deliveryKeys = ["city", "carrierName", "branch", "type"];
      if (deliveryKeys.some((key) => text(previous.delivery?.[key]) !== text(current.delivery?.[key]))) {
        const address = (o) => [o?.city && `м. ${o.city}`, o?.carrierName, o?.branch, o?.type].filter(Boolean).join(", ") || "—";
        log("delivery", "order.address", "Змінено адресу доставки", `${address(previous.delivery)} → ${address(current.delivery)}`);
      }
      if (text(previous.payment) !== text(current.payment))
        log("payment", "order.payment", "Змінено спосіб оплати", `${text(previous.payment)} → ${text(current.payment)}`);
      const oldItems = (previous.items || []).map((v) => [v.id, Number(v.qty), Number(v.price)]);
      const newItems = (current.items || []).map((v) => [v.id, Number(v.qty), Number(v.price)]);
      if (JSON.stringify(oldItems) !== JSON.stringify(newItems)) {
        const list = (o) => (o.items || []).map((v) => `${v.title || v.id} × ${v.qty}`).join("; ") || "—";
        log("order", "order.items", "Змінено товари замовлення", `${list(previous)} → ${list(current)}`);
      }
      if (Number(previous.subtotal) !== Number(current.subtotal))
        log("payment", "order.total", "Перераховано суму замовлення", `${money(previous.subtotal)} → ${money(current.subtotal)}`);
    };

    // Seed default orders ONLY ONCE if localStorage is completely empty
    if (
      !localStorage.getItem(COMPLETED_ORDERS_KEY) &&
      typeof AuthManager !== "undefined" &&
      typeof AuthManager.getOrders === "function"
    ) {
      AuthManager.getOrders();
    }

    function resolveStatusCode(ord) {
      if (ord.statusCode && STATUS_LABELS[ord.statusCode]) {
        return ord.statusCode;
      }
      const s = String(ord.status || "").toLowerCase();
      if (s.includes("скасов")) return "canceled";
      if (s.includes("виконан")) return "completed";
      if (s.includes("відправ")) return "shipped";
      if (s.includes("оброб")) return "processing";
      return ord.locked ? "processing" : "active";
    }

    function loadAllOrders() {
      const map = new Map();
      const now = Date.now();
      let activeEditableOrderId = null;

      const currentUser = (typeof AuthManager !== "undefined" &&
        AuthManager.getUser()) || {
        firstName: "Ім'я",
        lastName: "Прізвище",
        phone: "+380501234567",
        email: "example@gmail.com",
      };

      // 1. Check astelkom_active_order timer state first
      try {
        const rawActive = localStorage.getItem(ACTIVE_ORDER_KEY);
        if (rawActive) {
          const act = JSON.parse(rawActive);
          const id = String(act.orderId || act.id || "");

          if (id) {
            const isStillEditing = OrderLifecycle.isEditable(act, now);

            if (isStillEditing) {
              // Client still has time on the 15-minute timer -> hide from admin dashboard
              activeEditableOrderId = id;
            } else {
              // Timer expired or client clicked "Передати в роботу зараз" -> lock & show as processing
              if (!act.locked) {
                Object.assign(act, OrderLifecycle.release(act, now));
                localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(act));
              }
              const code = resolveStatusCode(act);
              map.set(id, {
                ...act,
                orderId: id,
                statusCode: code,
                status: STATUS_LABELS[code],
                ttn: act.ttn || "",
                customer: act.customer || {
                  firstName: currentUser.firstName || "Ім'я",
                  lastName: currentUser.lastName || "Прізвище",
                  phone: currentUser.phone || "+380501234567",
                  email: currentUser.email || "example@gmail.com",
                },
              });
            }
          }
        }
      } catch (e) {}

      // 2. Load archived/completed orders (excluding the one currently in the 15-min edit window)
      try {
        const rawCompleted = JSON.parse(
          localStorage.getItem(COMPLETED_ORDERS_KEY) || "[]",
        );
        rawCompleted.forEach((ord) => {
          const id = String(ord.orderId || ord.id || "");
          if (
            !id ||
            map.has(id) ||
            id === activeEditableOrderId ||
            OrderLifecycle.isEditable(ord, now)
          )
            return;

          // A legacy history entry may have been copied before its editing window ended.
          // Never expose it before expiry, and normalize it once the deadline has passed.
          const releasedOrd =
            !ord.locked &&
            Number.isFinite(Number(ord.expiresAt)) &&
            Number(ord.expiresAt) <= now
              ? OrderLifecycle.release(ord, now)
              : ord;
          const code = resolveStatusCode(releasedOrd);
          map.set(id, {
            ...releasedOrd,
            orderId: id,
            statusCode: code,
            status: STATUS_LABELS[code],
            ttn: ord.ttn || "",
            customer: ord.customer || {
              firstName: currentUser.firstName || "Ім'я",
              lastName: currentUser.lastName || "Прізвище",
              phone: currentUser.phone || "+380501234567",
              email: currentUser.email || "example@gmail.com",
            },
          });
        });
      } catch (e) {}

      return Array.from(map.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      );
    }

    // Styled confirmation for destructive admin actions. Never interpolate product
    // or category names into HTML: those labels may originate from user input.
    function confirmAdminDelete({
      title,
      message,
      subject,
      confirmLabel = "Видалити",
      neutral = false,
    }) {
      return new Promise((resolve) => {
        const dialog = document.createElement("dialog");
        dialog.className = "admin-confirm-dialog";
        dialog.setAttribute("aria-labelledby", "admin-confirm-title");
        dialog.setAttribute("aria-describedby", "admin-confirm-message");

        const heading = document.createElement("h2");
        heading.id = "admin-confirm-title";
        heading.textContent = title;
        const description = document.createElement("p");
        description.id = "admin-confirm-message";
        description.textContent = message;
        const item = document.createElement("strong");
        item.className = "admin-confirm-dialog__subject";
        item.textContent = subject;
        const actions = document.createElement("div");
        actions.className = "admin-confirm-dialog__actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "admin-btn admin-btn--outline";
        cancel.textContent = "Скасувати";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = neutral
          ? "admin-btn admin-btn--primary"
          : "admin-btn admin-confirm-dialog__danger";
        remove.textContent = confirmLabel;
        actions.append(cancel, remove);
        dialog.append(heading, description, item, actions);

        let settled = false;
        const finish = (accepted) => {
          if (settled) return;
          settled = true;
          if (dialog.open) dialog.close();
          dialog.remove();
          resolve(accepted);
        };
        cancel.addEventListener("click", () => finish(false));
        remove.addEventListener("click", () => finish(true));
        dialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          finish(false);
        });
        dialog.addEventListener("click", (event) => {
          if (event.target === dialog) finish(false);
        });
        document.body.append(dialog);
        dialog.showModal();
        cancel.focus();
      });
    }

    // Shared with the product characteristics editor so destructive actions use
    // the same accessible, styled confirmation instead of window.confirm().
    window.AstelAdminConfirm = confirmAdminDelete;

    // Preview the exact note being removed without making the dialog excessively tall.
    function noteDeletionSubject(noteElement, fallback) {
      const text = (noteElement?.querySelector("p")?.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) return fallback;
      return text.length > 140 ? `${text.slice(0, 139)}…` : text;
    }

    function showUndoToast(message, undoCallback) {
      let toast = document.getElementById("admin-undo-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "admin-undo-toast";
        toast.className = "admin-undo-toast";
        document.body.appendChild(toast);
      }

      lastActionUndo = undoCallback;
      toast.replaceChildren();
      const messageNode = document.createElement("span");
      messageNode.id = "admin-undo-msg";
      messageNode.textContent = message;
      toast.appendChild(messageNode);
      if (undoCallback) {
        const undoButton = document.createElement("button");
        undoButton.type = "button";
        undoButton.id = "admin-undo-btn";
        undoButton.className = "admin-undo-toast__btn";
        undoButton.textContent = "↺ Відмінити дію";
        toast.appendChild(undoButton);
      }

      const btn = toast.querySelector("#admin-undo-btn");
      if (btn) {
        btn.onclick = () => {
          if (typeof lastActionUndo === "function") {
            const fn = lastActionUndo;
            lastActionUndo = null;
            fn();
          }
          toast.classList.remove("is-visible");
        };
      }

      toast.classList.add("is-visible");
      clearTimeout(undoToastTimer);
      undoToastTimer = setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 6000);
    }

    // Native required-field validation is caught before submit handlers run.
    // Keep its black toast generic; details appear under each invalid field.
    document.addEventListener("astel:admin-validation-failed", () => {
      showUndoToast("Заповніть пропущені поля!", null);
    });

    function writeOrder(updatedOrd) {
      const cleanId = String(updatedOrd.orderId);
      const previous = loadAllOrders().find((ord) => String(ord.orderId) === cleanId);
      // Never regenerate the archive from loadAllOrders(): that function hides
      // orders still in their editing window, so doing so silently deleted them.
      const saved = OrderLifecycle.getOrder(cleanId);
      if (saved) {
        OrderLifecycle.saveOrder(updatedOrd);
      } else {
        const list = OrderLifecycle.readHistory();
        list.unshift(updatedOrd);
        localStorage.setItem(COMPLETED_ORDERS_KEY, JSON.stringify(list));
      }
      orderActivity(previous, updatedOrd);
      renderDashboard();
    }

    function persistOrderUpdate(
      orderId,
      newStatusCode,
      newTtn,
      recordUndo = true,
    ) {
      const cleanId = String(orderId);
      const allOrders = loadAllOrders();
      const targetOrd = allOrders.find((o) => String(o.orderId) === cleanId);
      if (!targetOrd) return;

      const prevStatusCode = targetOrd.statusCode;
      const prevTtn = targetOrd.ttn || "";
      const finalStatusCode = newStatusCode || prevStatusCode;
      const finalTtn =
        newTtn !== undefined ? AdminSafety.normalizeTtn(newTtn) : prevTtn;

      if (
        finalTtn &&
        !AdminSafety.isValidTtn(finalTtn, targetOrd.delivery?.carrierKey)
      ) {
        showUndoToast("Невірний формат ТТН для вибраної служби доставки", null);
        return false;
      }
      if (["shipped", "completed"].includes(finalStatusCode) && !finalTtn) {
        showUndoToast(
          "Додайте номер ТТН перед відправкою або завершенням замовлення",
          null,
        );
        return false;
      }

      const updatedOrd = {
        ...OrderFinance.transition(targetOrd, finalStatusCode),
        orderId: cleanId,
        status: STATUS_LABELS[finalStatusCode],
        ttn: finalTtn,
      };
      writeOrder(updatedOrd);

      if (recordUndo && prevStatusCode !== finalStatusCode) {
        showUndoToast(
          `Замовлення #${cleanId}: статус змінено на «${STATUS_LABELS[finalStatusCode]}»`,
          () => {
            writeOrder(targetOrd); // Restore the entire snapshot including revenue.
            showUndoToast(
              `Дію скасовано: замовлення #${cleanId} повернуто у «${STATUS_LABELS[prevStatusCode]}»`,
              null,
            );
          },
        );
      } else if (recordUndo && prevTtn !== finalTtn) {
        showUndoToast(
          finalTtn
            ? `ТТН ${finalTtn} збережено для замовлення #${cleanId}`
            : `ТТН видалено для замовлення #${cleanId}`,
          () => {
            writeOrder(targetOrd);
          },
        );
      }
    }

    // Customer attention is a simple binary internal marker; it never blocks sales.
    // Every new manager note is bound to one of this customer's actual order IDs.
    const expandedClientKeys = new Set();
    const customerNoteDrafts = new Map();
    // Keep the add-note composer collapsed until explicitly opened.
    const openClientNoteComposers = new Set();
    const customerSelectedOrders = new Map();
    const customerProfiles = () => AdminCustomers.read(localStorage);
    const customerProfile = (key) =>
      AdminCustomers.profileFor(customerProfiles(), key);
    const clientOrderIds = (client) =>
      client.orders.map((order) => String(order.orderId));
    const clientNoteDraftKey = (key, orderId) => `${key}::${orderId}`;
    function buildClientsList(orders) {
      const account =
        typeof AuthManager !== "undefined" ? AuthManager.getUser() : null;
      return AdminCustomers.buildClients(orders, account);
    }
    function clientAttentionButton(key) {
      const attention = customerProfile(key).status !== "normal";
      const label = attention
        ? "Зняти позначку «Проблемний клієнт»"
        : "Позначити як проблемного клієнта";
      return `<button type="button" class="admin-client-attention-toggle ${attention ? "is-attention" : ""}"
        data-toggle-client-attention="${esc(key)}" aria-label="${label}"
        aria-pressed="${attention}" title="${label}">
        <span class="admin-client-attention-toggle__dot" aria-hidden="true"></span></button>`;
    }
    // Delivery belongs to the order, not to the customer's default address.
    function orderDeliveryAddress(delivery) {
      if (!delivery || typeof delivery !== "object") return "Адресу доставки не вказано";
      const city = String(delivery.city || "").trim();
      const carrier = String(delivery.carrierName || CARRIERS[delivery.carrierKey] || "").trim();
      const branch = String(delivery.branch || "").trim();
      const type = String(delivery.type || "").trim();
      const parts = [city && `м. ${city}`, carrier, branch || type].filter(Boolean);
      return parts.length ? parts.join(", ") : "Адресу доставки не вказано";
    }
    function renderClientDetail(client) {
      const profile = customerProfile(client.key);
      const orderIds = clientOrderIds(client);
      // Each order owns its own note editor. Keep all note panels closed
      // until a manager opens one, including when there is only one order.
      const preferredId = customerSelectedOrders.get(client.key);
      const openOrderId = orderIds.includes(preferredId) ? preferredId : "";
      const history = client.orders.length
        ? client.orders
            .map((ord) => {
              const orderId = String(ord.orderId);
              const orderNotes = AdminCustomers.notesForOrder(profile, orderId);
              const isOpen = orderId === openOrderId;
              const safeDomId =
                `client-note-panel-${client.key}-${orderId}`.replace(
                  /[^a-zA-Z0-9_-]/g,
                  "-",
                );
              const composerKey = clientNoteDraftKey(client.key, orderId);
              const composerOpen = openClientNoteComposers.has(composerKey);
              const notesHtml = orderNotes.length
                ? `<ul class="admin-client-note-list">${orderNotes
                    .map(
                      (note, index) => `
          <li class="admin-client-note">
            <div class="admin-client-note__heading">
              ${index === 0
                ? `<span class="admin-note-title-date"><strong>Внутрішні примітки</strong><time>${formatDate(note.createdAt)}</time>${noteAuthor(note)}</span>`
                : `<span class="admin-note-title-date"><time>${formatDate(note.createdAt)}</time>${noteAuthor(note)}</span>`}
              <button type="button" data-delete-client-note="${esc(note.id)}" data-note-order="${esc(orderId)}"
                aria-label="Видалити примітку" title="Видалити примітку">Видалити</button>
            </div>
            <p>${esc(note.text)}</p>
          </li>`,
                    )
                    .join("")}</ul>`
                : '<p class="admin-client-empty">Приміток до цього замовлення ще немає.</p>';
              return `<article class="admin-client-order${isOpen ? " is-open" : ""}">
          <div class="admin-client-order__row">
            <div class="admin-client-order__identity">
              <div class="admin-client-order__title">
                <button class="admin-client-order-link" type="button" data-client-order="${esc(orderId)}">#${esc(orderId)}</button>
                <span class="admin-client-order__state">${esc(STATUS_LABELS[ord.statusCode] || ord.status || "—")}</span>
              </div>
              <time>${formatDate(ord.createdAt)}</time>
              <p class="admin-client-order__delivery" title="Адреса доставки"><span>Доставка:</span> ${esc(orderDeliveryAddress(ord.delivery))}</p>
            </div>
            <strong class="admin-client-order__amount">${formatMoney(ord.subtotal)}</strong>
            <button type="button" class="admin-client-order__notes-toggle" data-client-notes-for-order="${esc(orderId)}"
              aria-expanded="${isOpen}" ${isOpen ? `aria-controls="${esc(safeDomId)}"` : ""} aria-label="${isOpen ? "Згорнути" : "Відкрити"} примітки до замовлення #${esc(orderId)}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
              <span>Примітки</span><span class="admin-client-order__notes-count">${orderNotes.length}</span>
              <svg class="admin-client-order__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
          ${
            isOpen
              ? `<div class="admin-client-order__note-panel" id="${esc(safeDomId)}">
            ${orderNotes.length ? "" : `<div class="admin-client-order__note-heading"><strong>Внутрішні примітки</strong></div>`}
            ${notesHtml}
            <button type="button" class="admin-btn admin-btn--outline admin-client-note-compose-toggle"
              data-client-note-compose="${esc(orderId)}" aria-expanded="${composerOpen}"
              aria-controls="client-note-form-${esc(safeDomId)}">${composerOpen ? "Скасувати" : "+ Додати примітку"}</button>
            <form id="client-note-form-${esc(safeDomId)}" class="admin-client-note-form" data-client-note-form="${esc(client.key)}"
              data-order-id="${esc(orderId)}" novalidate ${composerOpen ? "" : "hidden"}>
              <label for="client-note-${esc(safeDomId)}">Нова примітка</label>
              <div class="admin-client-note-form__body">
                <textarea id="client-note-${esc(safeDomId)}" name="note" maxlength="${AdminCustomers.MAX_NOTE}" rows="3"
                  placeholder="Наприклад, покупець попросив змінити адресу доставки">${esc(customerNoteDrafts.get(composerKey) || "")}</textarea>
                <button type="submit" class="admin-btn admin-btn--primary">Зберегти примітку</button>
              </div>
            </form>
          </div>`
              : ""
          }
          ${AstelAdminActivity.orderSection(orderId)}
        </article>`;
            })
            .join("")
        : '<p class="admin-client-empty">Замовлень поки немає.</p>';

      // Older, customer-wide notes stay unassigned until the manager chooses
      // a real order; do not silently attach them to the first order.
      const legacyNotes = profile.notes.length
        ? `<details class="admin-client-legacy-notes">
        <summary>Неприв’язані примітки з попередньої версії <span class="admin-client-section-count">${profile.notes.length}</span></summary>
        <ul class="admin-client-note-list">${profile.notes
          .map(
            (note) => `<li class="admin-client-note">
          <div class="admin-client-note__heading"><span class="admin-note-title-date"><time>${formatDate(note.createdAt)}</time>${noteAuthor(note)}</span>
            <button type="button" data-delete-legacy-client-note="${esc(note.id)}">Видалити</button></div>
          <p>${esc(note.text)}</p>
          ${
            orderIds.length
              ? `<div class="admin-client-legacy-notes__assign">
            <select class="admin-select" data-legacy-note-order="${esc(note.id)}" aria-label="Замовлення для прив'язки примітки">
              <option value="">Оберіть замовлення</option>
              ${orderIds.map((id) => `<option value="${esc(id)}">#${esc(id)}</option>`).join("")}
            </select>
            <button type="button" data-assign-legacy-client-note="${esc(note.id)}">Прив’язати</button>
          </div>`
              : ""
          }
        </li>`,
          )
          .join("")}</ul>
      </details>`
        : "";

      return `<div class="admin-client-details" data-client-details="${esc(client.key)}">
        <div class="admin-client-details__heading">
          <h3>Замовлення клієнта <span class="admin-client-section-count">${client.orders.length}</span></h3>
        </div>
        <div class="admin-client-order-list">${history}</div>
        ${legacyNotes}
      </div>`;
    }

    const ordersContainer = document.getElementById("admin-orders-container");
    const clientsTbody = document.getElementById("admin-clients-tbody");
    const searchInput = document.getElementById("admin-search");
    const clientSearchInput = document.getElementById("admin-client-search");
    const statusFilter = document.getElementById("admin-status-filter");

    let lastOrderFingerprint = "";
    function getOrderFingerprint(orders) {
      return JSON.stringify(
        orders.map((o) => [
          o.orderId,
          o.statusCode,
          o.ttn,
          o.subtotal,
          o.locked,
          o.finalizedAt,
          o.paymentStatus,
          o.paymentVerification,
          o.payment,
          o.recognizedRevenue,
          o.customer,
          o.delivery,
          o.items,
        ]),
      );
    }

    const CARRIERS = {
      nova: "Нова Пошта",
      ukr: "Укрпошта",
      meest: "Meest пошта",
    };
    const payMethods = ["Готівка", "Оплата банківською картою", "Google Pay"];
    function renderOrderLine(item) {
      const product = PRODUCTS_DATA[item.id];
      const min = product ? CartManager.getMinQty(product) : 1;
      return `<div class="admin-edit-line" data-line-id="${esc(item.id)}" data-line-price="${Number(item.price) || 0}">
            <span class="admin-edit-line__title">${esc(item.title)}</span>
            <span class="admin-edit-line__price">${formatMoney(item.price)} / шт.</span>
            <label>Кількість <input class="admin-edit-qty" type="number" min="${min}" max="1000000" step="1" value="${Number(item.qty) || min}"></label>
            <button type="button" class="admin-btn admin-btn--danger" data-remove-order-line>Видалити</button>
          </div>`;
    }
    function renderOrderNotePanel(ord) {
      const id = String(ord.orderId);
      const customerKey = AdminCustomers.keyFor(ord.customer);
      if (!customerKey) return "";
      const notes = AdminCustomers.notesForOrder(
        customerProfile(customerKey),
        id,
      );
      const composerOpen = openOrderNoteComposers.has(id);
      const list = notes.length
        ? `<ul class="admin-client-note-list admin-order-note-list">${notes
            .map(
              (note, index) => `
            <li class="admin-client-note admin-order-note">
              <div class="admin-client-note__heading admin-order-note__heading">
                ${index === 0
                  ? `<span class="admin-note-title-date"><strong>Внутрішні примітки</strong><time>${formatDate(note.createdAt)}</time>${noteAuthor(note)}</span>`
                  : `<span class="admin-note-title-date"><time>${formatDate(note.createdAt)}</time>${noteAuthor(note)}</span>`}
                <button type="button" data-admin-order-note-delete="${esc(note.id)}" aria-label="Видалити примітку">Видалити</button>
              </div>
              <p>${esc(note.text)}</p>
            </li>`,
            )
            .join("")}</ul>`
        : `<p class="admin-client-empty admin-order-note-empty">Приміток до цього замовлення ще немає.</p>`;
      return `<section class="admin-order-note-panel" aria-label="Примітки до замовлення #${esc(id)}">
        ${notes.length ? "" : `<div class="admin-client-order__note-heading admin-order-note-panel__head"><strong>Внутрішні примітки</strong></div>`}
        ${list}
        <button type="button" class="admin-btn admin-btn--outline admin-client-note-compose-toggle admin-order-note-compose-toggle"
          data-admin-order-note-compose="${esc(id)}" aria-expanded="${composerOpen}"
          aria-controls="admin-order-note-form-${esc(id)}">${composerOpen ? "Скасувати" : "+ Додати примітку"}</button>
        <form class="admin-client-note-form" id="admin-order-note-form-${esc(id)}" data-admin-order-note-form="${esc(id)}" novalidate ${composerOpen ? "" : "hidden"}>
          <label for="admin-order-note-${esc(id)}">Нова примітка</label>
          <div class="admin-client-note-form__body">
            <textarea id="admin-order-note-${esc(id)}" name="note" rows="3" maxlength="${AdminCustomers.MAX_NOTE}"
              placeholder="Наприклад, покупець попросив змінити адресу доставки">${esc(orderNoteDrafts.get(id) || "")}</textarea>
            <button class="admin-btn admin-btn--primary" type="submit">Зберегти примітку</button>
          </div>
        </form>
      </section>`;
    }
    function orderNoteButton(ord) {
      const id = String(ord.orderId);
      const key = AdminCustomers.keyFor(ord.customer);
      const count = key
        ? AdminCustomers.notesForOrder(customerProfile(key), id).length
        : 0;
      const expanded = expandedOrderNoteIds.has(id);
      return `<button type="button" class="admin-btn admin-btn--outline admin-order-notes-button"
        data-admin-order-notes-toggle="${esc(id)}" aria-expanded="${expanded}"
        aria-label="${expanded ? "Закрити" : "Відкрити"} примітки до замовлення #${esc(id)}">
        ${expanded ? "Закрити примітки" : `Примітки${count ? ` <span class="admin-order-notes-button__count">${count}</span>` : ""}`}
      </button>`;
    }

    // Update just the note pane. Re-rendering the entire card would discard
    // unsubmitted order edits or other form fields in a different tab.
    function refreshOrderNoteUI(orderId) {
      const id = String(orderId);
      const order = loadAllOrders().find((entry) => String(entry.orderId) === id);
      const card = [...ordersContainer.querySelectorAll(".admin-order-card")]
        .find((entry) => entry.dataset.orderId === id);
      const pane = card?.querySelector('[data-order-pane="notes"]');
      if (pane && order) pane.innerHTML = renderOrderNotePanel(order);
      const badge = card?.querySelector('[data-order-notes-count]');
      const key = order && AdminCustomers.keyFor(order.customer);
      const count = key ? AdminCustomers.notesForOrder(customerProfile(key), id).length : 0;
      if (badge) { badge.textContent = String(count); badge.hidden = count === 0; }
    }
    // Canceled orders keep their five workspace tabs and payment ledger, but
    // the header must not present an outstanding payment status as active.
    function renderOrderPaymentBadge(ord) {
      if (ord.statusCode === "canceled") return "";
      return `<span class="admin-payment-state admin-payment-state--${esc(OrderFinance.paymentStatus(ord))}">
        ${esc(OrderFinance.paymentLabel(ord))}
      </span>`;
    }
    function renderOrderWorkspace(ord) {
      const id = String(ord.orderId);
      const active = activeOrderPanes.get(id) || "";
      const key = AdminCustomers.keyFor(ord.customer);
      const noteCount = key ? AdminCustomers.notesForOrder(customerProfile(key), id).length : 0;
      const warrantyCount = AstelAdminWarranty.forOrder(id).length;
      const historyCount = AstelAdminActivity.forOrder(id).length;
      const items = [
        ["notes", "Примітки", noteCount, "data-order-notes-count"],
        ["edit", "Редагувати дані", null, ""],
        ["payments", "Розрахунки та оплата", null, ""],
        ["warranty", "Гарантійні звернення", warrantyCount, ""],
        ["history", "Історія змін", historyCount, "data-order-history-count"],
      ];
      const tabs = items.map(([name, label, count, attribute]) => `
        <button type="button" class="admin-order-workspace__tab ${active === name ? "is-active" : ""}"
          data-order-tab="${name}" aria-expanded="${active === name}"
          aria-controls="order-pane-${name}-${esc(id)}" id="order-tab-${name}-${esc(id)}">
          ${label}${count !== null ? `<span class="admin-order-workspace__count" ${attribute}="${esc(id)}" ${count === 0 ? "hidden" : ""}>${count}</span>` : ""}
        </button>`).join("");
      const panel = (name, html) => `<div class="admin-order-workspace__panel" role="region"
        data-order-pane="${name}" id="order-pane-${name}-${esc(id)}"
        aria-labelledby="order-tab-${name}-${esc(id)}" ${active === name ? "" : "hidden"}>${html}</div>`;
      const editContent = ord.statusCode === "processing"
        ? (active === "edit" ? renderOrderEditor(ord) : "")
        : ord.statusCode === "canceled"
          ? `<div class="admin-order-workspace__notice"><strong>Редагування недоступне</strong><p>Замовлення скасовано. Натисніть «Відновити замовлення», щоб повернути його в обробку та редагувати дані.</p></div>`
          : `<div class="admin-order-workspace__notice"><strong>Редагування недоступне</strong><p>Змінювати дані замовлення можна на етапі «В обробці». Для виконаного замовлення використайте «Повернути в роботу», якщо справді потрібно змінити початкові дані. Гарантійні випадки оформлюйте окремо.</p></div>`;
      const warrantyContent = AstelAdminWarranty.panel(ord) ||
        '<div class="admin-order-workspace__notice"><strong>Гарантійні звернення</strong><p>Нове звернення можна зареєструвати після завершення замовлення.</p></div>';
      return `<div class="admin-order-workspace" data-order-workspace="${esc(id)}">
        <div class="admin-order-workspace__tabs" role="group" aria-label="Деталі замовлення #${esc(id)}">${tabs}</div>
        ${panel("notes", renderOrderNotePanel(ord))}
        ${panel("edit", editContent)}
        ${panel("payments", AstelAdminPayments.panel(ord))}
        ${panel("warranty", warrantyContent)}
        ${panel("history", AstelAdminActivity.orderPane(id))}
      </div>`;
    }
    function setOrderPane(card, id, paneName) {
      const next = activeOrderPanes.get(id) === paneName ? "" : paneName;
      if (next) activeOrderPanes.set(id, next);
      else activeOrderPanes.delete(id);
      if (next === "edit") {
        editingOrderIds.add(id);
        const editorPane = card.querySelector('[data-order-pane="edit"]');
        if (editorPane && !editorPane.querySelector("[data-order-editor]")) {
          const order = loadAllOrders().find((item) => String(item.orderId) === id);
          if (order?.statusCode === "processing") {
            editorPane.innerHTML = renderOrderEditor(order);
            const form = editorPane.querySelector("[data-order-editor]");
            if (form) {
              form.dataset.adminDeliveryKey = JSON.stringify([
                form.elements.city.value.trim(), form.elements.carrierKey.value,
                form.elements.deliveryType.value,
              ]);
              refreshAdminBranches(form);
              window.AstelCustomSelect?.refresh?.();
            }
          }
        }
      } else editingOrderIds.delete(id);
      card.querySelectorAll("[data-order-tab]").forEach((tab) => {
        const selected = tab.dataset.orderTab === next;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-expanded", String(selected));
      });
      card.querySelectorAll("[data-order-pane]").forEach((pane) => {
        pane.hidden = pane.dataset.orderPane !== next;
      });
      const controls = card.querySelector(".admin-order-card__controls");
      if (controls) controls.hidden = next === "edit";
    }
    function renderOrderEditor(ord) {
      const destinationDraft = orderDestinationDrafts.get(String(ord.orderId));
      const editedCity = destinationDraft?.city ?? ord.delivery?.city ?? "";
      const editedCarrier =
        destinationDraft?.carrierKey ?? ord.delivery?.carrierKey ?? "nova";
      const editedType =
        destinationDraft?.deliveryType ?? ord.delivery?.type ?? "Відділення";
      const field = (name, value, label, type = "text") =>
        `<label class="admin-edit-field">${label}<input name="${name}" type="${type}" value="${esc(value || "")}" required></label>`;
      const select = (name, value, opts) =>
        `<label class="admin-edit-field">${name === "carrierKey" ? "Служба доставки" : "Спосіб оплати"}<select name="${name}" class="admin-select">${opts.map(([key, label]) => `<option value="${esc(key)}" ${key === value ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>`;
      return `<form novalidate class="admin-order-editor" data-order-editor="${esc(ord.orderId)}">
            <h3>Редагування замовлення #${esc(ord.orderId)}</h3>
            <div class="admin-edit-grid">
              ${field("firstName", ord.customer?.firstName, "Ім’я")}
              ${field("lastName", ord.customer?.lastName, "Прізвище")}
              ${field("phone", ord.customer?.phone, "Телефон", "tel")}
              ${field("email", ord.customer?.email, "E-mail", "email")}
              <label class="admin-edit-field">Місто
                <span class="admin-branch-picker admin-city-picker" data-admin-city-picker>
                  <span class="admin-branch-picker__control">
                    <input name="city" type="text" value="${esc(editedCity)}" placeholder="Введіть або оберіть місто" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="admin-city-list-${esc(ord.orderId)}" required data-admin-city>
                    <button class="admin-branch-picker__toggle" type="button" data-admin-city-toggle aria-label="Показати міста" aria-expanded="false"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
                  </span>
                  <span class="admin-branch-picker__options" id="admin-city-list-${esc(ord.orderId)}" role="listbox" data-admin-city-options hidden></span>
                </span>
              </label>
              <label class="admin-edit-field">Відділення / адреса
                <span class="admin-branch-picker" data-admin-branch-picker>
                  <span class="admin-branch-picker__control">
                    <input name="branch" type="text" value="${esc(orderAddressDrafts.get(String(ord.orderId)) ?? ord.delivery?.branch ?? "")}" placeholder="Введіть адресу або оберіть зі списку" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="admin-branch-list-${esc(ord.orderId)}" required data-admin-branch-input>
                    <button class="admin-branch-picker__toggle" type="button" data-admin-branch-toggle aria-label="Показати відділення для вибраного міста" aria-expanded="false"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
                  </span>
                  <span class="admin-branch-picker__options" id="admin-branch-list-${esc(ord.orderId)}" role="listbox" data-admin-branch-options hidden></span>
                </span>
                <span class="admin-delivery-hint" data-admin-delivery-hint aria-live="polite">Введіть адресу вручну або відкрийте перелік точок доставки для вибраного міста.</span>
              </label>
              ${select("carrierKey", editedCarrier, Object.entries(CARRIERS))}
              <label class="admin-edit-field">Тип доставки
                <select name="deliveryType" class="admin-select">
                  <option value="Відділення" ${editedType === "Відділення" ? "selected" : ""}>Відділення</option>
                  <option value="Поштомат" ${editedType === "Поштомат" ? "selected" : ""}>Поштомат</option>
                </select>
              </label>
              ${select(
                "payment",
                ord.payment,
                payMethods.map((x) => [x, x]),
              )}
            </div>
            <h4>Товари замовлення</h4>
            <div class="admin-edit-lines">${(ord.items || []).map(renderOrderLine).join("")}</div>
            <div class="admin-edit-add-row">
              <select class="admin-select" data-add-product-select>
                ${Object.values(PRODUCTS_DATA)
                  .filter((p) => p.inStock && p.isVisible !== false)
                  .map(
                    (p) =>
                      `<option value="${esc(p.id)}">${esc(p.title)} — ${formatMoney(p.numericPrice)}</option>`,
                  )
                  .join("")}
              </select>
              <button type="button" class="admin-btn admin-btn--outline" data-add-order-line>+ Додати товар</button>
            </div>
            <div class="admin-edit-actions"><button class="admin-btn admin-btn--primary" type="submit">Зберегти зміни</button>
            <button class="admin-btn admin-btn--outline" data-cancel-order-edit type="button">Скасувати редагування</button></div>
          </form>`;
    }
    function scrollToOrderCard(orderId) {
      // After renderDashboard() replaces the card node, scroll to its replacement.
      requestAnimationFrame(() => {
        const card = [
          ...ordersContainer.querySelectorAll(".admin-order-card"),
        ].find((element) => element.dataset.orderId === orderId);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    function saveOrderEditor(form) {
      const id = form.dataset.orderEditor;
      const ord = loadAllOrders().find((o) => String(o.orderId) === id);
      if (!ord || ord.statusCode !== "processing")
        throw new Error("Редагування дозволено лише на стадії «В обробці»");
      const data = new FormData(form);
      const customer = {
        firstName: String(data.get("firstName") || "").trim(),
        lastName: String(data.get("lastName") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
      };
      const carrierKey = String(data.get("carrierKey") || "");
      const deliveryType = String(data.get("deliveryType") || "");
      if (!["Відділення", "Поштомат"].includes(deliveryType))
        throw new Error("Невірний тип доставки");
      // The address is always editable; datalist suggestions are never required.
      const branch = String(data.get("branch") || "").trim();
      const delivery = {
        ...ord.delivery,
        city: String(data.get("city") || "").trim(),
        branch,
        type: deliveryType,
        carrierKey,
        carrierName: CARRIERS[carrierKey] || "",
      };
      const payment = String(data.get("payment") || "");
      if (!payMethods.includes(payment))
        throw new Error("Некоректний спосіб оплати");
      const items = [...form.querySelectorAll("[data-line-id]")].map((el) => {
        const product = PRODUCTS_DATA[el.dataset.lineId];
        const original = (ord.items || []).find(
          (i) => i.id === el.dataset.lineId,
        );
        if (!product && !original) throw new Error("Товар не знайдено");
        const qty = Number(el.querySelector(".admin-edit-qty").value);
        const min = product ? CartManager.getMinQty(product) : 1;
        if (!Number.isInteger(qty) || qty < min)
          throw new Error(
            `Мінімальна кількість для ${product?.title || original?.title}: ${min}`,
          );
        const price = Number(el.dataset.linePrice);
        return {
          id: el.dataset.lineId,
          title: product?.title || original.title,
          price,
          qty,
          image: product?.image || original.image,
        };
      });
      if (new Set(items.map((i) => i.id)).size !== items.length)
        throw new Error("Товар повторюється в замовленні");
      const subtotal = OrderFinance.validateEdits(customer, delivery, items);
      // Switching payment method invalidates any previously verified payment for this method.
      const changedPayment =
        payment !== ord.payment || subtotal !== Number(ord.subtotal);
      const updated = {
        ...ord,
        customer,
        delivery,
        payment,
        items,
        subtotal,
        ...(changedPayment
          ? { paymentStatus: "unpaid", paymentVerification: null }
          : {}),
      };
      writeOrder(updated);
      orderAddressDrafts.delete(id);
      orderDestinationDrafts.delete(id);
      editingOrderIds.delete(id);
      activeOrderPanes.delete(id);
      renderDashboard();
      scrollToOrderCard(id);
      showUndoToast(`Дані замовлення #${id} оновлено`, () => writeOrder(ord));
    }

    function renderDashboard() {
      const allOrders = loadAllOrders();
      lastOrderFingerprint = getOrderFingerprint(allOrders);
      const clients = buildClientsList(allOrders);

      // Count orders that still require processing or dispatch.
      // A shipped order already has a TTN and must leave this KPI.
      const pendingCount = allOrders.filter(
        (o) => o.statusCode === "active" || o.statusCode === "processing",
      ).length;
      const totalRevenue = OrderFinance.total(allOrders);

      document.getElementById("kpi-total-orders").textContent =
        allOrders.length;
      document.getElementById("kpi-pending-orders").textContent = pendingCount;
      document.getElementById("kpi-revenue").textContent =
        formatMoney(totalRevenue);
      document.getElementById("kpi-clients-count").textContent = clients.length;

      document.getElementById("tab-count-orders").textContent =
        allOrders.length;
      document.getElementById("tab-count-clients").textContent = clients.length;

      const query = searchInput.value.trim().toLowerCase();
      const statusVal = statusFilter.value;

      const filteredOrders = allOrders.filter((ord) => {
        if (!AdminOrderFilters.matches(ord, statusVal, OrderFinance)) {
          return false;
        }
        if (!query) return true;
        const hay = [
          ord.orderId,
          ord.ttn,
          ord.customer?.firstName,
          ord.customer?.lastName,
          ord.customer?.phone,
          ord.customer?.email,
          ord.delivery?.city,
          ord.delivery?.branch,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });

      if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = `
              <div class="admin-table-card" style="text-align: center; padding: 48px 20px; color: #6b7280;">
                Замовлень за вашим запитом не знайдено.
              </div>
            `;
      } else {
        ordersContainer.innerHTML = filteredOrders
          .map((ord) => {
            const currentStepIdx = PIPELINE_STEPS.findIndex(
              (step) => step.code === ord.statusCode,
            );

            // A stage marks fulfillment progress, never payment confirmation.
            // The customer-editing stage is hidden from managers until released.
            const pipelineHtml = PIPELINE_STEPS.map((step, idx) => {
              const passed =
                ord.statusCode !== "canceled" && currentStepIdx > idx;
              let cls = "pipeline-step";
              if (ord.statusCode === step.code) {
                cls += " is-current";
                if (step.code === "completed") cls += " is-completed-step";
              } else if (passed) {
                cls += " is-passed";
              }
              return `<div class="${cls}">${passed ? "✓ " : ""}${step.label}</div>`;
            }).join("");

            // 2. Order Items
            const itemsHtml = (ord.items || [])
              .map(
                (item) => `
                  <div class="admin-order-item">
                    <img src="${esc(AdminSafety.safeImageUrl(item.image))}" alt="${esc(item.title)}" class="admin-order-item__img" />
                    <div>
                      <div class="admin-order-item__title">${esc(item.title)}</div>
                      <div class="admin-order-item__meta">${esc(item.qty)} шт. × ${formatMoney(item.price)}</div>
                    </div>
                    <div class="admin-order-item__sum">${formatMoney(item.price * item.qty)}</div>
                  </div>
                `,
              )
              .join("");

            // 3. TTN Block: Show saved TTN badge + "Редагувати" button if TTN exists and is not being edited
            const hasSavedTtn = Boolean(ord.ttn && ord.ttn.trim().length > 0);
            const isEditingTtn =
              !hasSavedTtn || editingTtnOrderIds.has(String(ord.orderId));

            const ttnWidgetHtml = isEditingTtn
              ? `
                    <div class="ttn-inline-box">
                      <label class="admin-control-label">Номер накладної (ТТН)</label>
                      <div class="ttn-input-row">
                        <input
                          type="text"
                          class="admin-search-input order-ttn-input"
                          placeholder="Введіть ТТН (напр. 20450918273645)"
                          value="${esc(ord.ttn || "")}"
                        />
                        <button type="button" class="admin-btn admin-btn--outline" data-save-ttn="${esc(ord.orderId)}">
                          Зберегти ТТН
                        </button>
                      </div>
                    </div>
                  `
              : `
                    <div class="ttn-inline-box">
                      <label class="admin-control-label">Номер накладної (ТТН)</label>
                      <div class="ttn-input-row">
                        <div class="ttn-saved-pill">
                          <span class="ttn-saved-pill__label">✓ ТТН</span>
                          <span class="ttn-saved-pill__val">${esc(ord.ttn)}</span>
                          <button type="button" class="ttn-edit-btn" data-edit-ttn="${esc(ord.orderId)}">
                            Редагувати
                          </button>
                        </div>
                      </div>
                    </div>
                  `;

            // 4. Bottom Controls Row
            let bottomControlsHtml = "";
            if (ord.statusCode === "completed") {
              bottomControlsHtml = `
                    <div class="order-closed-banner order-closed-banner--completed">
                      <span>✓ Замовлення успішно виконано та закрито ${ord.ttn ? `(ТТН: ${esc(ord.ttn)})` : ""}.</span>
                      <div class="admin-btn-row">
                        <button type="button" class="admin-btn admin-btn--outline" data-reopen-order="${esc(ord.orderId)}" style="height:36px">↺ Повернути в роботу</button>
                        <button type="button" class="admin-btn admin-btn--danger" data-cancel-order="${esc(ord.orderId)}" style="height:36px">Скасувати замовлення</button>
                      </div>
                    </div>
                  `;
            } else if (ord.statusCode === "canceled") {
              bottomControlsHtml = `
                    <div class="order-closed-banner order-closed-banner--canceled">
                      <span>✕ Замовлення скасовано.</span>
                      <button type="button" class="admin-btn admin-btn--outline" data-reopen-order="${esc(ord.orderId)}" style="height: 36px; padding: 0 14px;">
                        ↺ Відновити замовлення
                      </button>
                    </div>
                  `;
            } else {
              const nextAction = NEXT_STEP_ACTION[ord.statusCode];
              bottomControlsHtml = `
                    ${ttnWidgetHtml}
                    <div class="admin-btn-row">
                      ${
                        nextAction
                          ? `<button type="button" class="admin-btn admin-btn--primary" data-advance-status="${nextAction.nextCode}">
                              ${nextAction.btnText}
                            </button>`
                          : ""
                      }
                      <button type="button" class="admin-btn admin-btn--danger" data-cancel-order="${esc(ord.orderId)}">
                        Скасувати замовлення
                      </button>
                    </div>
                  `;
            }

            return `
                  <article class="admin-order-card" data-order-id="${esc(ord.orderId)}">
                    <div class="admin-order-card__header">
                      <div class="admin-order-card__id-group">
                        <span class="admin-order-card__id">Замовлення #${esc(ord.orderId)}</span>
                        <span class="admin-order-card__date">від ${formatDate(ord.createdAt)}</span>
                      </div>
                      <div class="admin-order-card__badges">
                        <span class="status-pill status-pill--${ord.statusCode}">
                          ${STATUS_LABELS[ord.statusCode]}
                        </span>
                        ${renderOrderPaymentBadge(ord)}
                        ${(() => {
                          const key = AdminCustomers.keyFor(ord.customer);
                          const status = customerProfile(key).status;
                          return status === "normal"
                            ? ""
                            : `<span class="admin-client-status admin-client-status--${esc(status)}" title="Внутрішня позначка менеджера"><span class="admin-client-status__dot" aria-hidden="true"></span>${esc(AdminCustomers.STATUSES[status])}</span>`;
                        })()}
                      </div>
                    </div>

                    <div class="order-pipeline">
                      ${pipelineHtml}
                    </div>

                    <div class="admin-order-card__grid">
                      <div class="admin-info-box">
                        <span class="admin-info-box__title">Дані клієнта</span>
                        <div><strong>ПІБ:</strong> ${esc(ord.customer?.firstName)} ${esc(ord.customer?.lastName)}</div>
                        <div><strong>Телефон:</strong> <a href="tel:${esc(String(ord.customer?.phone || "").replace(/[^+\d() -]/g, ""))}" style="text-decoration:underline;">${esc(ord.customer?.phone || "—")}</a></div>
                        <div><strong>E-mail:</strong> ${esc(ord.customer?.email || "—")}</div>
                      </div>

                      <div class="admin-info-box">
                        <span class="admin-info-box__title">Доставка та оплата</span>
                        <div><strong>Служба:</strong> м. ${esc(ord.delivery?.city)}, ${esc(ord.delivery?.carrierName)}</div>
                        <div><strong>Точка видачі:</strong> ${esc(ord.delivery?.type || "Відділення")}, ${esc(ord.delivery?.branch)}</div>
                        <div><strong>Оплата:</strong> ${esc(ord.payment)} | <strong>Сума:</strong> ${formatMoney(ord.subtotal)}</div>
                        ${ord.ttn ? `<div><strong>ТТН:</strong> <span style="font-family: var(--font-mono); font-weight: 700; color: #059669;">${esc(ord.ttn)}</span></div>` : ""}
                      </div>
                    </div>

                    <div class="admin-order-items">
                      ${itemsHtml}
                    </div>
                    ${renderOrderWorkspace(ord)}
                    <div class="admin-order-card__controls" ${activeOrderPanes.get(String(ord.orderId)) === "edit" ? "hidden" : ""}>
                      ${bottomControlsHtml}
                    </div>
                  </article>
                `;
          })
          .join("");
      }

      // Refresh address suggestions after the order cards are re-rendered.
      // The field itself remains a normal editable input, even with no suggestions.
      ordersContainer
        .querySelectorAll("[data-order-editor]")
        .forEach((editor) => {
          editor.dataset.adminDeliveryKey = JSON.stringify([
            editor.elements.city.value.trim(),
            editor.elements.carrierKey.value,
            editor.elements.deliveryType.value,
          ]);
          refreshAdminBranches(editor);
        });

      renderClientsTable(clients);
    }

    function renderClientsTable(clients) {
      // Filter clients independently of the orders search and status dropdown.
      const clientQuery = clientSearchInput.value.trim().toLocaleLowerCase("uk-UA");
      const clientDigits = clientQuery.replace(/\D/g, "");
      const matchingClients = clients.filter((client) => {
        if (!clientQuery) return true;
        const searchable = [
          client.firstName, client.lastName,
          `${client.firstName} ${client.lastName}`,
          client.phone, client.email, client.address,
          ...client.orders.flatMap((order) => [
            order.orderId, orderDeliveryAddress(order.delivery),
          ]),
        ].join(" ").toLocaleLowerCase("uk-UA");
        return searchable.includes(clientQuery) ||
          (clientDigits.length >= 3 &&
            String(client.phone).replace(/\D/g, "").includes(clientDigits));
      });

      // The dot is a clickable, two-state attention marker, not a purchase restriction.
      clientsTbody.innerHTML = matchingClients.length ? matchingClients
        .map((c) => {
          const initials =
            ((c.firstName || "К")[0] || "К") + ((c.lastName || "Л")[0] || "");
          const opened = expandedClientKeys.has(c.key);
          return `<tr class="admin-client-row" data-client-row="${esc(c.key)}">
          <td><div class="client-name-cell">
            ${clientAttentionButton(c.key)}
            <span class="client-avatar-sm">${esc(initials.toUpperCase())}</span>
            <div class="admin-client-name-group"><strong>${esc(c.firstName)} ${esc(c.lastName)}</strong></div>
          </div></td>
          <td data-label="Телефон" style="font-family: var(--font-mono)">${esc(c.phone)}</td>
          <td data-label="E-mail">${esc(c.email)}</td>
          <td data-label="Основна адреса">${esc(c.address)}</td>
          <td data-label="Замовлень" style="font-family: var(--font-mono); font-weight: 700">${c.ordersCount}</td>
          <td data-label="Загальна сума" style="font-family: var(--font-mono); font-weight: 700">${formatMoney(c.totalSpent)}</td>
          <td class="admin-client-row__action"><button type="button" class="admin-client-expand" data-toggle-client="${esc(c.key)}"
            aria-expanded="${opened}" aria-label="${opened ? "Згорнути" : "Відкрити"} історію та примітки клієнта ${esc(c.firstName)} ${esc(c.lastName)}">
            <span>${opened ? "Згорнути" : "Деталі"}</span>
            <svg class="admin-client-expand__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button></td>
        </tr><tr class="admin-client-detail-row" ${opened ? "" : "hidden"} data-client-detail-row="${esc(c.key)}">
          <td colspan="7">${opened ? renderClientDetail(c) : ""}</td>
        </tr>`;
        })
        .join("") : `<tr class="admin-client-search-empty"><td colspan="7">${clients.length ? "За вашим запитом клієнтів не знайдено." : "Клієнтів поки немає."}</td></tr>`;
    }


    // Delegation survives re-renders of the customer table.
    clientsTbody.addEventListener("click", async (event) => {
      const attention = event.target.closest("[data-toggle-client-attention]");
      if (attention) {
        try {
          AdminCustomers.toggleAttention(
            localStorage,
            attention.dataset.toggleClientAttention,
          );
          renderDashboard();
        } catch (error) {
          showUndoToast(error.message, null);
        }
        return;
      }
      const toggle = event.target.closest("[data-toggle-client]");
      if (toggle) {
        const key = toggle.dataset.toggleClient;
        if (expandedClientKeys.has(key)) {
          expandedClientKeys.delete(key);
          customerSelectedOrders.delete(key); // Reopening details starts with notes collapsed.
          // Also reset any open add-note composer for this client.
          for (const composerKey of openClientNoteComposers) {
            if (composerKey.startsWith(`${key}::`))
              openClientNoteComposers.delete(composerKey);
          }
        } else expandedClientKeys.add(key);
        renderDashboard();
        return;
      }
      const notesShortcut = event.target.closest(
        "[data-client-notes-for-order]",
      );
      if (notesShortcut) {
        const key = notesShortcut.closest("[data-client-details]")?.dataset
          .clientDetails;
        if (!key) return;
        const id = notesShortcut.dataset.clientNotesForOrder;
        const isOpen = notesShortcut.getAttribute("aria-expanded") === "true";
        if (isOpen) openClientNoteComposers.delete(clientNoteDraftKey(key, id));
        customerSelectedOrders.set(key, isOpen ? "" : id);
        renderDashboard();
        return;
      }
      const composeToggle = event.target.closest("[data-client-note-compose]");
      if (composeToggle) {
        const panel = composeToggle.closest("[data-client-details]");
        const key = panel?.dataset.clientDetails;
        const orderId = composeToggle.dataset.clientNoteCompose;
        if (!key) return;
        const composerKey = clientNoteDraftKey(key, orderId);
        const open = !openClientNoteComposers.has(composerKey);
        if (open) openClientNoteComposers.add(composerKey);
        else openClientNoteComposers.delete(composerKey);
        composeToggle.setAttribute("aria-expanded", String(open));
        composeToggle.textContent = open ? "Скасувати" : "+ Додати примітку";
        const form = document.getElementById(composeToggle.getAttribute("aria-controls"));
        if (form) form.hidden = !open;
        if (open) form?.elements.note?.focus();
        else {
          // Cancel means discard this unfinished entry, not save it for later.
          customerNoteDrafts.delete(composerKey);
          if (form) form.elements.note.value = "";
        }
        return;
      }
      const historyLink = event.target.closest("[data-client-order]");
      if (historyLink) {
        const id = historyLink.dataset.clientOrder;
        searchInput.value = "";
        statusFilter.value = "all";
        window.AstelCustomSelect?.refresh();
        document.querySelector('[data-admin-tab="panel-orders"]')?.click();
        renderDashboard();
        scrollToOrderCard(id);
        return;
      }
      const assignButton = event.target.closest(
        "[data-assign-legacy-client-note]",
      );
      if (assignButton) {
        const key = assignButton.closest("[data-client-details]")?.dataset
          .clientDetails;
        const client = buildClientsList(loadAllOrders()).find(
          (item) => item.key === key,
        );
        if (!client) return;
        const select = Array.from(
          assignButton
            .closest(".admin-client-legacy-notes")
            ?.querySelectorAll("[data-legacy-note-order]") || [],
        ).find(
          (element) =>
            element.dataset.legacyNoteOrder ===
            assignButton.dataset.assignLegacyClientNote,
        );
        const orderId = select?.value || "";
        try {
          AdminCustomers.assignLegacyNote(
            localStorage,
            key,
            assignButton.dataset.assignLegacyClientNote,
            orderId,
            clientOrderIds(client),
          );
          renderDashboard();
          showUndoToast("Примітку прив’язано до замовлення", null);
        } catch (error) {
          showUndoToast(error.message, null);
        }
        return;
      }
      const deleteButton = event.target.closest(
        "[data-delete-client-note], [data-delete-legacy-client-note]",
      );
      if (deleteButton) {
        const key = deleteButton.closest("[data-client-details]")?.dataset
          .clientDetails;
        if (
          !key ||
          !(await confirmAdminDelete({
            title: "Видалити примітку?",
            message: "Після видалення відновити цю примітку буде неможливо.",
            subject: noteDeletionSubject(
              deleteButton.closest(".admin-client-note"),
              "Внутрішня примітка",
            ),
          }))
        )
          return;
        try {
          if (deleteButton.hasAttribute("data-delete-legacy-client-note")) {
            AdminCustomers.deleteNote(
              localStorage,
              key,
              deleteButton.dataset.deleteLegacyClientNote,
            );
          } else {
            const client = buildClientsList(loadAllOrders()).find(
              (item) => item.key === key,
            );
            if (!client) return;
            AdminCustomers.deleteOrderNote(
              localStorage,
              key,
              deleteButton.dataset.noteOrder,
              deleteButton.dataset.deleteClientNote,
              clientOrderIds(client),
            );
          }
          renderDashboard();
          showUndoToast("Примітку видалено", null);
        } catch (error) {
          showUndoToast(error.message, null);
        }
        return;
      }
    });
    clientsTbody.addEventListener("input", (event) => {
      const form = event.target.closest("[data-client-note-form]");
      if (form && event.target.name === "note") {
        customerNoteDrafts.set(
          clientNoteDraftKey(form.dataset.clientNoteForm, form.dataset.orderId),
          event.target.value,
        );
      }
    });
    clientsTbody.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-client-note-form]");
      if (!form) return;
      event.preventDefault();
      const key = form.dataset.clientNoteForm;
      const orderId = form.dataset.orderId;
      const input = form.elements.note;
      const client = buildClientsList(loadAllOrders()).find(
        (item) => item.key === key,
      );
      if (!client) return;
      try {
        AdminCustomers.addOrderNote(
          localStorage,
          key,
          orderId,
          input.value,
          clientOrderIds(client),
        );
        customerNoteDrafts.delete(clientNoteDraftKey(key, orderId));
        openClientNoteComposers.delete(clientNoteDraftKey(key, orderId));
        renderDashboard();
        showUndoToast("Примітку до замовлення додано", null);
      } catch (error) {
        input.focus();
        showUndoToast(error.message, null);
      }
    });

    // Reuse the branch picker's visual language for the city field. Both fields
    // allow manual entry, but their suggestions are never browser-native menus.
    function cityPickerParts(form) {
      return {
        input: form.querySelector("[data-admin-city]"),
        list: form.querySelector("[data-admin-city-options]"),
        toggle: form.querySelector("[data-admin-city-toggle]"),
      };
    }
    function closeAdminCityPicker(form) {
      if (!form) return;
      const { input, list, toggle } = cityPickerParts(form);
      if (list) list.hidden = true;
      if (input) input.setAttribute("aria-expanded", "false");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
    function renderAdminCityChoices(form, query = "") {
      const { list, input } = cityPickerParts(form);
      if (!list || !input) return;
      const normalize = (value) => String(value || "").trim().toLocaleLowerCase("uk");
      // Include the current order's city even if it is absent from the local directory.
      const orderCities = loadAllOrders().map((order) => order.delivery?.city).filter(Boolean);
      const currentCity = loadAllOrders().find(
        (order) => String(order.orderId) === form.dataset.orderEditor,
      )?.delivery?.city;
      const priority = [currentCity, "Київ", "Львів", "Дніпро", "Одеса", "Харків"];
      const cities = [...new Set([...priority, ...AdminDelivery.cityOptions(), ...orderCities].filter(Boolean))];
      const matches = cities.filter((city) => normalize(city).includes(normalize(query)));
      list.replaceChildren();
      if (!matches.length) {
        const empty = document.createElement("span");
        empty.className = "admin-branch-picker__empty";
        empty.textContent = "Місто не знайдено. Можна ввести назву вручну.";
        list.append(empty);
        return;
      }
      matches.slice(0, 80).forEach((city) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "admin-branch-picker__option";
        option.setAttribute("role", "option");
        option.dataset.adminCityOption = city;
        const title = document.createElement("span");
        title.className = "admin-branch-picker__title";
        title.textContent = city;
        option.append(title);
        list.append(option);
      });
    }
    function openAdminCityPicker(form, query = "") {
      const { input, list, toggle } = cityPickerParts(form);
      if (!input || !list || !toggle) return;
      ordersContainer.querySelectorAll("[data-order-editor]").forEach((other) => {
        closeAdminCityPicker(other);
        closeAdminBranchPicker(other);
      });
      renderAdminCityChoices(form, query);
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-expanded", "true");
    }
    function chooseAdminCity(form, city) {
      const { input } = cityPickerParts(form);
      if (!input) return;
      const changed = input.value !== city;
      input.value = city;
      closeAdminCityPicker(form);
      // Existing order-draft logic clears obsolete branches when the city changes.
      if (changed) {
        form.dataset.adminCitySelecting = "1";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        delete form.dataset.adminCitySelecting;
      }
      form.dataset.adminCitySkipFocus = "1";
      input.focus();
      delete form.dataset.adminCitySkipFocus;
    }

    // The admin picker uses the SAME region/carrier directory as customer checkout.
    // Native <datalist> cannot reliably open on click, so we render an accessible
    // interactive listbox while preserving free-text entry and existing drafts.
    function branchPickerParts(form) {
      return {
        input: form.querySelector("[data-admin-branch-input]"),
        list: form.querySelector("[data-admin-branch-options]"),
        toggle: form.querySelector("[data-admin-branch-toggle]"),
        hint: form.querySelector("[data-admin-delivery-hint]"),
      };
    }
    function closeAdminBranchPicker(form) {
      if (!form) return;
      const { input, list, toggle } = branchPickerParts(form);
      if (list) list.hidden = true;
      if (input) input.setAttribute("aria-expanded", "false");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
    function openAdminBranchPicker(form) {
      const { input, list, toggle } = branchPickerParts(form);
      if (!input || !list || !toggle) return;
      ordersContainer
        .querySelectorAll("[data-order-editor]")
        .forEach((other) => {
          closeAdminCityPicker(other);
          if (other !== form) closeAdminBranchPicker(other);
        });
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-expanded", "true");
    }
    function renderAdminBranchChoices(form, choices, message) {
      const { list } = branchPickerParts(form);
      if (!list) return;
      list.replaceChildren();
      if (!choices.length) {
        const empty = document.createElement("span");
        empty.className = "admin-branch-picker__empty";
        empty.textContent =
          message || "Немає пропозицій. Можна ввести адресу вручну.";
        list.append(empty);
        return;
      }
      choices.forEach((choice) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "admin-branch-picker__option";
        option.setAttribute("role", "option");
        option.dataset.adminBranchOption = choice.title;
        const title = document.createElement("span");
        title.className = "admin-branch-picker__title";
        title.textContent = choice.title;
        option.append(title);
        if (choice.subtitle) {
          const subtitle = document.createElement("small");
          subtitle.className = "admin-branch-picker__subtitle";
          subtitle.textContent = choice.subtitle;
          option.append(subtitle);
        }
        list.append(option);
      });
    }
    async function refreshAdminBranches(
      form,
      { show = false, all = false } = {},
    ) {
      const { input, list, hint } = branchPickerParts(form);
      if (!input || !list || !hint) return;
      const city = String(form.elements.city.value || "").trim();
      const carrier = form.elements.carrierKey.value;
      const type = form.elements.deliveryType.value;
      const revision = String(Number(form.dataset.deliveryRevision || 0) + 1);
      form.dataset.deliveryRevision = revision;
      if (show) openAdminBranchPicker(form);

      if (!city) {
        renderAdminBranchChoices(form, [], "Спочатку вкажіть місто доставки.");
        hint.textContent = "Вкажіть місто, щоб побачити варіанти доставки.";
        return;
      }
      const order = loadAllOrders().find(
        (o) => String(o.orderId) === form.dataset.orderEditor,
      );
      const normalize = (v) =>
        String(v || "")
          .trim()
          .toLocaleLowerCase("uk");
      const sameDestination =
        normalize(city) === normalize(order?.delivery?.city) &&
        carrier === order?.delivery?.carrierKey &&
        type === (order?.delivery?.type || "Відділення");
      const previous = AdminDelivery.uniqueBranches([
        ...(sameDestination ? [order?.delivery?.branch] : []),
        ...AdminDelivery.orderBranches(loadAllOrders(), city, carrier, type),
      ]);
      const query = all ? "" : input.value.trim().toLocaleLowerCase("uk");
      const matches = (v) =>
        !query ||
        String(v || "")
          .toLocaleLowerCase("uk")
          .includes(query);
      const choices = new Map();
      previous.filter(matches).forEach((address) => {
        choices.set(normalize(address), {
          title: address,
          subtitle: "З попереднього замовлення · перевірте актуальність",
        });
      });
      const updateChoices = (
        message = "Немає пропозицій. Введіть адресу вручну.",
      ) => {
        renderAdminBranchChoices(
          form,
          [...choices.values()].slice(0, 60),
          message,
        );
      };
      updateChoices("Завантаження варіантів доставки…");
      hint.textContent =
        "Введіть адресу вручну або оберіть варіант, доступний у формі покупця. Перевірте дані перед відправленням.";

      // The public checkout directory has a generated fallback for offline/demo
      // use. The admin displays the same entries, but does not call them verified.
      const directoryCity = city
        .replace(/^(?:м\.|місто)\s*/i, "")
        .split(",")[0]
        .trim();
      try {
        const [customerItems, verified] = await Promise.all([
          typeof DeliveryDirectory !== "undefined" &&
          typeof DeliveryDirectory.getBranches === "function"
            ? DeliveryDirectory.getBranches(carrier, type, directoryCity, "")
            : Promise.resolve([]),
          AdminDelivery.fetchVerifiedBranches(city, carrier, type).catch(
            () => null,
          ),
        ]);
        if (form.dataset.deliveryRevision !== revision || !form.isConnected)
          return;
        (customerItems || []).forEach((item) => {
          if (!item?.title || (!matches(item.title) && !matches(item.subtitle)))
            return;
          const key = normalize(item.title);
          if (!choices.has(key))
            choices.set(key, {
              title: item.title,
              subtitle:
                item.subtitle ||
                "Варіант з оформлення замовлення · перевірте актуальність",
            });
        });
        (verified || []).forEach((address) => {
          if (!matches(address)) return;
          choices.set(normalize(address), {
            title: address,
            subtitle: "Із підключеного довідника доставки",
          });
        });
        updateChoices();
        hint.textContent = verified?.length
          ? "Можна обрати адресу з довідника або ввести вручну."
          : "Варіанти як у формі покупця (можуть бути демонстраційними). Перевірте адресу перед відправленням.";
      } catch (_) {
        if (form.dataset.deliveryRevision !== revision || !form.isConnected)
          return;
        updateChoices();
        hint.textContent =
          "Довідник недоступний. Можна вибрати попередню адресу або ввести вручну.";
      }
    }
    function updateDestinationDraft(form) {
      const id = form.dataset.orderEditor;
      const next = {
        city: form.elements.city.value,
        carrierKey: form.elements.carrierKey.value,
        deliveryType: form.elements.deliveryType.value,
      };
      const oldKey = form.dataset.adminDeliveryKey || "";
      const key = JSON.stringify([
        next.city.trim(),
        next.carrierKey,
        next.deliveryType,
      ]);
      if (oldKey && oldKey !== key) {
        form.elements.branch.value = "";
        orderAddressDrafts.set(id, "");
      }
      form.dataset.adminDeliveryKey = key;
      orderDestinationDrafts.set(id, next);
      refreshAdminBranches(form, {
        show: !branchPickerParts(form).list.hidden,
        all: true,
      });
    }
    ordersContainer.addEventListener("click", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (!form) return;
      if (event.target.closest("[data-admin-city-toggle]")) {
        event.preventDefault();
        if (cityPickerParts(form).list.hidden) openAdminCityPicker(form);
        else closeAdminCityPicker(form);
        return;
      }
      const cityOption = event.target.closest("[data-admin-city-option]");
      if (cityOption) {
        event.preventDefault();
        chooseAdminCity(form, cityOption.dataset.adminCityOption);
        return;
      }
      if (event.target.closest("[data-admin-branch-toggle]")) {
        event.preventDefault();
        const pickerOpen = !branchPickerParts(form).list.hidden;
        if (pickerOpen) closeAdminBranchPicker(form);
        else refreshAdminBranches(form, { show: true, all: true });
        return;
      }
      const option = event.target.closest("[data-admin-branch-option]");
      if (option) {
        event.preventDefault();
        const input = branchPickerParts(form).input;
        input.value = option.dataset.adminBranchOption;
        orderAddressDrafts.set(form.dataset.orderEditor, input.value);
        closeAdminBranchPicker(form);
        form.dataset.adminBranchSkipFocus = "1";
        input.focus();
        delete form.dataset.adminBranchSkipFocus;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    ordersContainer.addEventListener("focusin", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (form && event.target.matches("[data-admin-city]") && !form.dataset.adminCitySkipFocus) {
        openAdminCityPicker(form);
      }
      if (
        form &&
        event.target.matches("[data-admin-branch-input]") &&
        !form.dataset.adminBranchSkipFocus
      ) {
        refreshAdminBranches(form, { show: true, all: true });
      }
    });
    ordersContainer.addEventListener("change", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (
        form &&
        event.target.matches(
          '[name="city"], [name="carrierKey"], [name="deliveryType"]',
        )
      ) {
        updateDestinationDraft(form);
      }
    });
    ordersContainer.addEventListener("input", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (!form) return;
      if (event.target.matches("[data-admin-branch-input]")) {
        orderAddressDrafts.set(form.dataset.orderEditor, event.target.value);
        if (!branchPickerParts(form).list.hidden)
          refreshAdminBranches(form, { show: true });
      }
      if (event.target.matches("[data-admin-city]")) {
        updateDestinationDraft(form);
        if (!form.dataset.adminCitySelecting)
          openAdminCityPicker(form, event.target.value);
      }
    });
    ordersContainer.addEventListener("keydown", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (!form || !event.target.matches("[data-admin-city]")) return;
      const { list } = cityPickerParts(form);
      if (event.key === "Escape") {
        closeAdminCityPicker(form);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (list.hidden) openAdminCityPicker(form);
        list.querySelector("[data-admin-city-option]")?.focus();
      }
    });
    ordersContainer.addEventListener("keydown", (event) => {
      const cityOption = event.target.closest("[data-admin-city-option]");
      if (!cityOption) return;
      const form = cityOption.closest("[data-order-editor]");
      const { input, list } = cityPickerParts(form);
      if (event.key === "Escape") {
        closeAdminCityPicker(form);
        form.dataset.adminCitySkipFocus = "1";
        input.focus();
        delete form.dataset.adminCitySkipFocus;
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const options = [...list.querySelectorAll("[data-admin-city-option]")];
        const pos = options.indexOf(cityOption);
        options[(pos + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
      } else if (event.key === "Enter" || event.key === " ") {
        // Click handler also handles pointer selection; button activation handles Enter/Space.
        event.preventDefault();
        chooseAdminCity(form, cityOption.dataset.adminCityOption);
      }
    });
    ordersContainer.addEventListener("keydown", (event) => {
      const form = event.target.closest("[data-order-editor]");
      if (!form || !event.target.matches("[data-admin-branch-input]")) return;
      const { list } = branchPickerParts(form);
      if (event.key === "Escape") {
        closeAdminBranchPicker(form);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (list.hidden) refreshAdminBranches(form, { show: true, all: true });
        list.querySelector("[data-admin-branch-option]")?.focus();
      }
    });
    ordersContainer.addEventListener("keydown", (event) => {
      const option = event.target.closest("[data-admin-branch-option]");
      if (!option) return;
      const form = option.closest("[data-order-editor]");
      const list = branchPickerParts(form).list;
      if (event.key === "Escape") {
        closeAdminBranchPicker(form);
        branchPickerParts(form).input.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const options = [
          ...list.querySelectorAll("[data-admin-branch-option]"),
        ];
        const pos = options.indexOf(option);
        options[
          (pos + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
            options.length
        ]?.focus();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      ordersContainer.querySelectorAll("[data-order-editor]").forEach((form) => {
        if (!event.target.closest("[data-admin-branch-picker]")) closeAdminBranchPicker(form);
        if (!event.target.closest("[data-admin-city-picker]")) closeAdminCityPicker(form);
      });
    });

    ordersContainer.addEventListener("keydown", (event) => {
      const tab = event.target.closest?.("[data-order-tab]");
      if (!tab) return;
      const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(event.key)) return;
      const tabs = [...tab.closest('[role="group"]').querySelectorAll("[data-order-tab]")];
      const index = tabs.indexOf(tab);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });

    // Order Actions Click Handler
    ordersContainer.addEventListener("click", async (e) => {
      const card = e.target.closest(".admin-order-card");
      if (!card) return;
      const orderId = String(card.getAttribute("data-order-id"));
      const ttnInput = card.querySelector(".order-ttn-input");
      const currentTtn = ttnInput ? ttnInput.value.trim() : undefined;

      const paneToggle = e.target.closest("[data-order-tab]");
      if (paneToggle) {
        setOrderPane(card, orderId, paneToggle.dataset.orderTab);
        return;
      }

      const notesToggle = e.target.closest("[data-admin-order-notes-toggle]");
      if (notesToggle) {
        if (expandedOrderNoteIds.has(orderId)) {
          expandedOrderNoteIds.delete(orderId);
          openOrderNoteComposers.delete(orderId);
        } else expandedOrderNoteIds.add(orderId);
        refreshOrderNoteUI(orderId);
        return;
      }
      const composeToggle = e.target.closest("[data-admin-order-note-compose]");
      if (composeToggle) {
        const open = !openOrderNoteComposers.has(orderId);
        if (open) openOrderNoteComposers.add(orderId);
        else openOrderNoteComposers.delete(orderId);
        composeToggle.setAttribute("aria-expanded", String(open));
        composeToggle.textContent = open ? "Скасувати" : "+ Додати примітку";
        const form = card.querySelector("[data-admin-order-note-form]");
        if (form) form.hidden = !open;
        if (open) form?.elements.note?.focus();
        else {
          // Cancel discards unfinished text; saving closes the editor as well.
          orderNoteDrafts.delete(orderId);
          if (form) form.elements.note.value = "";
        }
        return;
      }
      const deleteNoteButton = e.target.closest(
        "[data-admin-order-note-delete]",
      );
      if (deleteNoteButton) {
        const order = loadAllOrders().find(
          (entry) => String(entry.orderId) === orderId,
        );
        if (!order) return;
        const confirmed = await confirmAdminDelete({
          title: "Видалити примітку?",
          message: "Після видалення відновити цю примітку буде неможливо.",
          subject: noteDeletionSubject(
            deleteNoteButton.closest(".admin-order-note"),
            `Замовлення #${orderId}`,
          ),
        });
        if (!confirmed) return;
        try {
          const key = AdminCustomers.keyFor(order.customer);
          const client = buildClientsList(loadAllOrders()).find(
            (item) => item.key === key,
          );
          AdminCustomers.deleteOrderNote(
            localStorage,
            key,
            orderId,
            deleteNoteButton.dataset.adminOrderNoteDelete,
            clientOrderIds(client || { orders: [order] }),
          );
          refreshOrderNoteUI(orderId);
          showUndoToast("Примітку видалено", null);
        } catch (error) {
          showUndoToast(error.message, null);
        }
        return;
      }

      const editOrderBtn = e.target.closest("[data-edit-order]");
      if (editOrderBtn) {
        if (
          !loadAllOrders().some(
            (o) =>
              String(o.orderId) === orderId && o.statusCode === "processing",
          )
        )
          return;
        if (editingOrderIds.has(orderId)) {
          editingOrderIds.delete(orderId);
          orderAddressDrafts.delete(orderId);
          orderDestinationDrafts.delete(orderId);
        } else editingOrderIds.add(orderId);
        // renderDashboard initializes the delivery selectors for every open editor.
        renderDashboard();
        return;
      }
      if (e.target.closest("[data-cancel-order-edit]")) {
        orderAddressDrafts.delete(orderId);
        orderDestinationDrafts.delete(orderId);
        editingOrderIds.delete(orderId);
        activeOrderPanes.delete(orderId);
        renderDashboard();
        scrollToOrderCard(orderId);
        return;
      }
      const addLineBtn = e.target.closest("[data-add-order-line]");
      if (addLineBtn) {
        const editor = card.querySelector("[data-order-editor]");
        const id = editor?.querySelector("[data-add-product-select]")?.value;
        const product = PRODUCTS_DATA[id];
        if (
          !editor ||
          !product ||
          !product.inStock ||
          product.isVisible === false
        )
          return;
        const existing = Array.from(
          editor.querySelectorAll("[data-line-id]"),
        ).find((el) => el.dataset.lineId === id);
        const min = CartManager.getMinQty(product);
        if (existing)
          existing.querySelector(".admin-edit-qty").value =
            Number(existing.querySelector(".admin-edit-qty").value) + min;
        else
          editor.querySelector(".admin-edit-lines").insertAdjacentHTML(
            "beforeend",
            renderOrderLine({
              id,
              title: product.title,
              price: product.numericPrice,
              qty: min,
            }),
          );
        return;
      }
      const removeLineBtn = e.target.closest("[data-remove-order-line]");
      if (removeLineBtn) {
        removeLineBtn.closest("[data-line-id]")?.remove();
        return;
      }

      // 1. Click "Редагувати" TTN button -> switch pill back to input
      const editTtnBtn = e.target.closest("[data-edit-ttn]");
      if (editTtnBtn) {
        editingTtnOrderIds.add(orderId);
        renderDashboard();
        const newCard = Array.from(
          ordersContainer.querySelectorAll(".admin-order-card"),
        ).find((element) => element.getAttribute("data-order-id") === orderId);
        const inp = newCard && newCard.querySelector(".order-ttn-input");
        if (inp) {
          inp.focus();
          inp.select();
        }
        return;
      }

      // 2. Click "Зберегти ТТН" button -> save TTN and switch to saved pill view
      const saveTtnBtn = e.target.closest("[data-save-ttn]");
      if (saveTtnBtn && ttnInput) {
        const val = ttnInput.value.trim();
        const order = loadAllOrders().find(
          (entry) => String(entry.orderId) === orderId,
        );
        if (!AdminSafety.isValidTtn(val, order?.delivery?.carrierKey)) {
          ttnInput.focus();
          ttnInput.classList.add("has-error");
          AstelAdminValidation?.reportField(
            ttnInput,
            "Введіть коректний номер ТТН для вибраної служби доставки",
            { manual: true },
          );
          showUndoToast(
            "Введіть коректний номер ТТН для цієї служби доставки",
            null,
          );
          return;
        }
        editingTtnOrderIds.delete(orderId);
        persistOrderUpdate(orderId, null, val, true);
        return;
      }

      // Pipeline steps are read-only; payment status is displayed and filtered separately.

      // 4. Click "Позначити відправленим →" / "Прийняти в обробку →" / "✓ Завершити (Виконано)"
      const advanceBtn = e.target.closest("[data-advance-status]");
      if (advanceBtn) {
        const nextCode = advanceBtn.getAttribute("data-advance-status");

        // Require TTN before moving order to "shipped" ("Відправлено")
        if (nextCode === "shipped") {
          const allOrders = loadAllOrders();
          const ord = allOrders.find((o) => String(o.orderId) === orderId);
          const savedTtn = ord && ord.ttn ? ord.ttn.trim() : "";
          const effectiveTtn = currentTtn !== undefined ? currentTtn : savedTtn;

          if (
            !AdminSafety.isValidTtn(effectiveTtn, ord?.delivery?.carrierKey)
          ) {
            if (ttnInput) {
              ttnInput.classList.remove("has-error");
              void ttnInput.offsetWidth; // Restart shake animation
              ttnInput.classList.add("has-error");
              AstelAdminValidation?.reportField(
                ttnInput,
                "Введіть коректний номер ТТН для вибраної служби доставки",
                { manual: true },
              );
              ttnInput.focus();

              // Keep the existing shake animation; the shared validator owns the inline text.
              ttnInput.addEventListener(
                "input",
                () => ttnInput.classList.remove("has-error"),
                { once: true },
              );
            }
            showUndoToast(
              `Вкажіть коректний номер накладної (ТТН) для замовлення #${orderId}`,
              null,
            );
            return;
          }

          editingTtnOrderIds.delete(orderId);
          persistOrderUpdate(orderId, "shipped", effectiveTtn, true);
          return;
        }

        if (currentTtn) editingTtnOrderIds.delete(orderId);
        persistOrderUpdate(orderId, nextCode, currentTtn, true);
        return;
      }

      // 5. Click "Скасувати замовлення"
      const cancelBtn = e.target.closest("[data-cancel-order]");
      if (cancelBtn) {
        editingTtnOrderIds.delete(orderId);
        persistOrderUpdate(orderId, "canceled", currentTtn, true);
        return;
      }

      // 6. Click "↺ Повернути в роботу" / "↺ Відновити замовлення"
      const reopenBtn = e.target.closest("[data-reopen-order]");
      if (reopenBtn) {
        persistOrderUpdate(orderId, "processing", currentTtn, true);
        return;
      }
    });

    ordersContainer.addEventListener("input", (event) => {
      const form = event.target.closest("[data-admin-order-note-form]");
      if (form && event.target.name === "note") {
        orderNoteDrafts.set(
          form.dataset.adminOrderNoteForm,
          event.target.value,
        );
      }
    });
    ordersContainer.addEventListener("submit", (e) => {
      const noteForm = e.target.closest("[data-admin-order-note-form]");
      if (noteForm) {
        e.preventDefault();
        const orderId = noteForm.dataset.adminOrderNoteForm;
        const order = loadAllOrders().find(
          (entry) => String(entry.orderId) === orderId,
        );
        if (!order) return;
        const key = AdminCustomers.keyFor(order.customer);
        const client = buildClientsList(loadAllOrders()).find(
          (item) => item.key === key,
        );
        try {
          AdminCustomers.addOrderNote(
            localStorage,
            key,
            orderId,
            noteForm.elements.note.value,
            clientOrderIds(client || { orders: [order] }),
          );
          orderNoteDrafts.delete(orderId);
          openOrderNoteComposers.delete(orderId);
          expandedOrderNoteIds.add(orderId);
          refreshOrderNoteUI(orderId);
          showUndoToast("Примітку до замовлення додано", null);
        } catch (error) {
          noteForm.elements.note.focus();
          showUndoToast(error.message, null);
        }
        return;
      }
      const form = e.target.closest("[data-order-editor]");
      if (!form) return;
      e.preventDefault();
      try {
        saveOrderEditor(form);
      } catch (err) {
        showUndoToast(err.message, null);
      }
    });

    // Allow pressing Enter inside TTN input to save TTN immediately
    ordersContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.classList.contains("order-ttn-input")) {
        e.preventDefault();
        const card = e.target.closest(".admin-order-card");
        if (!card) return;
        const orderId = String(card.getAttribute("data-order-id"));
        const val = e.target.value.trim();
        const order = loadAllOrders().find(
          (entry) => String(entry.orderId) === orderId,
        );
        if (!AdminSafety.isValidTtn(val, order?.delivery?.carrierKey)) {
          e.target.classList.add("has-error");
          AstelAdminValidation?.reportField(
            e.target,
            "Введіть коректний номер ТТН для вибраної служби доставки",
            { manual: true },
          );
          showUndoToast(
            "Введіть коректний номер ТТН для цієї служби доставки",
            null,
          );
          return;
        }
        editingTtnOrderIds.delete(orderId);
        persistOrderUpdate(orderId, null, val, true);
      }
    });

    searchInput.addEventListener("input", renderDashboard);
    clientSearchInput.addEventListener("input", () => {
      renderClientsTable(buildClientsList(loadAllOrders()));
    });
    statusFilter.addEventListener("change", renderDashboard);

    // Catalog Inventory / Media (localStorage prototype).
    const productsTbody = document.getElementById("admin-products-tbody");
    const addProductForm = document.getElementById("admin-new-product-form");
    const productDrafts = new Map();
    const detailsDirty = new Set();
    // Capture the real saved editor values, rather than remembering whether
    // the user has ever typed/clicked anything since opening the editor.
    const editorBaselines = new Map();
    const detailOpen = new Set();
    AstelProductEditor.bind(addProductForm);
    const options = (items, selected) =>
      Object.entries(items)
        .map(
          ([key, label]) =>
            `<option value="${esc(key)}" ${key === selected ? "selected" : ""}>${esc(label)}</option>`,
        )
        .join("");

    function initialDraft(p) {
      return {
        price: String(p.numericPrice),
        category: p.category,
        saleTermsCode: p.saleTermsCode,
        inStock: p.inStock,
        images: [...p.images],
      };
    }
    function getDraft(id) {
      return productDrafts.get(id) || initialDraft(PRODUCTS_DATA[id]);
    }
    function isDirty(id, draft) {
      const p = PRODUCTS_DATA[id];
      if (!p) return false;
      return (
        draft.price !== String(p.numericPrice) ||
        draft.category !== p.category ||
        draft.saleTermsCode !== p.saleTermsCode ||
        draft.inStock !== p.inStock ||
        JSON.stringify(draft.images) !== JSON.stringify(p.images)
      );
    }
    function setDraft(id, draft) {
      if (isDirty(id, draft)) productDrafts.set(id, draft);
      else productDrafts.delete(id);
    }
    function readRowDraft(row) {
      const id = row.dataset.productId;
      const old = getDraft(id);
      return {
        ...old,
        price: row.querySelector(".admin-price-input").value,
        category: row.querySelector("[data-product-category]").value,
        saleTermsCode: row.querySelector("[data-product-terms]").value,
      };
    }
    function feedback(row) {
      const dirty =
        productDrafts.has(row.dataset.productId) ||
        detailsDirty.has(row.dataset.productId);
      row.classList.toggle("has-pending-changes", dirty);
      const button = row.querySelector("[data-save-product]");
      button.disabled = !dirty;
      const metaRow = row.nextElementSibling;
      const notice = metaRow?.matches(".admin-inventory-meta-row")
        ? metaRow.querySelector(".admin-inventory-unsaved")
        : null;
      metaRow?.classList.toggle("has-pending-changes", dirty);
      if (notice) notice.hidden = !dirty;
    }
    function renderPhotoEditor(p, images) {
      return `<section class="admin-photo-editor" data-product-photos="${esc(p.id)}" aria-label="Фотографії товару: ${esc(p.title)}">
                <div class="admin-photo-editor__top">
                  <div class="admin-photo-editor__heading">
                    <span class="admin-photo-editor__title">Фотографії</span>
                    <span class="admin-photo-editor__count">${images.length} / 12</span>
                  </div>
                  <span class="admin-photo-editor__hint">Перетягніть фото, щоб змінити порядок. Перше фото — головне. Натисніть «Оновити» для збереження.</span>
                </div>
                <div class="admin-photo-list" role="list" aria-label="Порядок фотографій">
                  ${images
                    .map(
                      (src, i) => `
                    <div class="admin-photo-item ${i === 0 ? "is-main" : ""}" role="listitem"
                      data-photo-index="${i}" draggable="true" tabindex="0"
                      aria-label="Фото ${i + 1}${i === 0 ? ", головне" : ""}. Перетягніть або натисніть Alt зі стрілкою для зміни порядку">
                      <div class="admin-photo-item__preview">
                        <img src="${esc(src)}" alt="Фото ${i + 1}: ${esc(p.title)}" draggable="false" />
                        <button type="button" class="admin-photo-item__remove" data-photo-remove="${i}"
                          aria-label="Видалити фото ${i + 1}" title="Видалити фото">×</button>
                      </div>
                      <div class="admin-photo-item__footer">
                        <span class="admin-photo-item__number">${i === 0 ? "Головне" : `Фото ${i + 1}`}</span>
                        <span class="admin-photo-item__handle" aria-hidden="true" title="Перетягніть для зміни порядку">⠿</span>
                      </div>
                    </div>`,
                    )
                    .join("")}
                  ${
                    images.length < 12
                      ? `
                    <label class="admin-photo-add-tile" title="Додати фотографії до товару">
                      <input class="admin-photo-add-tile__input" type="file"
                        accept="image/png,image/jpeg,image/webp" multiple data-photo-upload="${esc(p.id)}"
                        aria-label="Додати фото до товару ${esc(p.title)}" />
                      <span class="admin-photo-add-tile__icon" aria-hidden="true">+</span>
                      <span>Додати фото</span>
                    </label>`
                      : ""
                  }
                </div>
                <p class="admin-photo-warning">Зображення зберігаються лише в цьому браузері до підключення сервера.</p>
              </section>`;
    }
    function renderDetailsRow(p) {
      return `<tr class="admin-product-details-row" data-product-details-id="${esc(p.id)}" ${detailOpen.has(p.id) ? "" : "hidden"}>
            <td colspan="6"><form novalidate class="admin-product-details-form admin-language-editor" data-editor-language="uk" data-edit-product="${esc(p.id)}">
              <h3>Редагування товару — ${esc(p.title)}</h3>
              <p class="admin-photo-warning">Фотографії, опис, характеристики та PDF залишаються чернеткою до натискання «Оновити» у рядку товару.</p>
              ${renderPhotoEditor(p, getDraft(p.id).images)}
              <div class="admin-editor-language-tabs" data-editor-language-tabs role="tablist" aria-label="Мова редагування">
                <button type="button" role="tab" data-editor-lang="uk" aria-selected="true">Українська</button>
                <button type="button" role="tab" data-editor-lang="en" aria-selected="false" tabindex="-1">English</button>
              </div>
              <div class="admin-editor-language-context" data-editor-language-context role="status" aria-live="polite">
                <span class="admin-editor-language-context__code" data-editor-language-code>UA</span>
                <div class="admin-editor-language-context__copy">
                  <strong data-editor-language-heading>Ви редагуєте українську версію</strong>
                  <span data-editor-language-help>Заповнюйте назву, опис і характеристики українською. Для англійської версії перейдіть на вкладку English.</span>
                </div>
              </div>
              <div class="admin-product-name-grid">
                <label data-editor-field-lang="uk">Назва товару українською
                  <input name="title" type="text" maxlength="200" placeholder="Назва товару українською" /></label>
                <label data-editor-field-lang="en">Назва товару англійською
                  <input name="titleEn" type="text" maxlength="200" placeholder="Переклад назви товару англійською" /></label>
              </div>
              <div class="admin-description-grid">
                <label class="admin-new-product-description" data-editor-field-lang="uk">Опис товару українською
                  <textarea name="description" rows="5"></textarea></label>
                <label class="admin-new-product-description" data-editor-field-lang="en">Опис товару англійською
                  <textarea name="descriptionEn" rows="5"></textarea></label>
              </div>
              <div class="admin-new-product-extras">
                <section class="admin-extra-block"><div class="admin-extra-heading"><div><h3>Таблиці характеристик</h3><p>Створюйте таблиці з власними назвами та додавайте характеристики українською й англійською.</p></div>
                  <button type="button" class="admin-btn admin-btn--outline" data-add-spec-section>+ Додати таблицю</button></div>
                  <div data-spec-sections class="admin-spec-sections"></div></section>
                <section class="admin-extra-block"><div class="admin-extra-heading"><div><h3>Специфікації та документація</h3><p>Можна додавати, видаляти та замінювати PDF-файли.</p></div>
                  <button type="button" class="admin-btn admin-btn--outline" data-add-doc-row>+ Додати PDF</button></div>
                  <div data-doc-rows class="admin-document-rows"></div></section>
              </div><datalist data-custom-spec-names></datalist>
            </form></td></tr>`;
    }
    function detailsForm(id) {
      return Array.from(
        productsTbody.querySelectorAll("[data-edit-product]"),
      ).find((f) => f.dataset.editProduct === id);
    }
    function showDetails(id) {
      const target = Array.from(
        productsTbody.querySelectorAll("[data-product-details-id]"),
      ).find((row) => row.dataset.productDetailsId === id);
      if (!target) return;
      const opening = !detailOpen.has(id);
      if (opening) {
        detailOpen.add(id);
        target.hidden = false;
        const form = detailsForm(id);
        if (form && !form.dataset.initialized) {
          AstelProductEditor.bind(form);
          AstelProductEditor.populate(form, PRODUCTS_DATA[id]);
          editorBaselines.set(id, productEditorSnapshot(form));
          form.dataset.initialized = "true";
        }
      } else {
        detailOpen.delete(id);
        target.hidden = true;
      }
      const button = Array.from(
        productsTbody.querySelectorAll("[data-toggle-product-details]"),
      ).find((b) => b.dataset.toggleProductDetails === id);
      if (button) {
        button.innerHTML = opening
          ? '<span aria-hidden="true">▴</span> Сховати редактор'
          : '<span aria-hidden="true">✎</span> Редагувати товар';
        button.setAttribute("aria-expanded", String(opening));
      }
    }
    function cleanupRemovedPdfFiles(previousDocs) {
      if (typeof AstelProductFiles === "undefined") return;
      const retained = new Set(
        Object.values(PRODUCTS_DATA).flatMap((p) =>
          (p.docs || []).map((d) => d.url),
        ),
      );
      for (const d of previousDocs || []) {
        if (AstelProductFiles.isRef(d.url) && !retained.has(d.url))
          AstelProductFiles.remove(d.url).catch(() => {});
      }
    }
    function productAuditSnapshot(product) {
      if (!product) return null;
      return {
        title: product.title, titleEn: product.titleEn,
        price: Number(product.numericPrice ?? product.price),
        inStock: !!product.inStock, isVisible: product.isVisible !== false,
        category: product.category, saleTermsCode: product.saleTermsCode,
        imagesCount: product.images?.length || 0,
        specs: JSON.stringify(product.specSections || []),
        docsCount: product.docs?.length || 0,
        descriptions: JSON.stringify([product.description, product.descriptionEn]),
      };
    }
    function logProductChanges(id, before, product) {
      const after = productAuditSnapshot(product);
      if (!before || !after) return;
      const diff = [];
      const add = (label, oldValue, newValue) => {
        if (oldValue !== newValue) diff.push(`${label}: ${oldValue} → ${newValue}`);
      };
      add("Назва", before.title, after.title);
      add("English", before.titleEn, after.titleEn);
      add("Ціна", `${before.price} ₴`, `${after.price} ₴`);
      add("Наявність", before.inStock ? "Доступний до замовлення" : "Немає в наявності", after.inStock ? "Доступний до замовлення" : "Немає в наявності");
      add("Категорія", CatalogManager.CATEGORIES[before.category] || before.category, CatalogManager.CATEGORIES[after.category] || after.category);
      add("Умови продажу", before.saleTermsCode, after.saleTermsCode);
      add("Видимість", before.isVisible ? "Показано" : "Приховано", after.isVisible ? "Показано" : "Приховано");
      add("Фотографії", before.imagesCount, after.imagesCount);
      add("PDF", before.docsCount, after.docsCount);
      if (before.specs !== after.specs) diff.push("Оновлено таблиці характеристик");
      if (before.descriptions !== after.descriptions) diff.push("Оновлено опис товару");
      if (!diff.length) return;
      const stockOnly = diff.every((entry) => entry.startsWith("Ціна:") || entry.startsWith("Наявність:"));
      activityRecord({ type: stockOnly ? "inventory" : "product", action: "product.updated",
        entityType: "product", entityId: id, summary: stockOnly ? "Оновлено склад або ціну" : "Оновлено товар",
        detail: `${product.title}: ${diff.join("; ")}` });
    }

    function renderCategoryManager() {
      const list = document.getElementById("admin-category-list");
      if (list)
        list.innerHTML = Object.entries(CatalogManager.CATEGORIES)
          .map(([key, name]) => {
            const count = Object.values(PRODUCTS_DATA).filter(
              (p) => p.category === key,
            ).length;
            const fixed = CatalogManager.isFixedCategory(key);
            return `<div class="admin-category-chip"${fixed ? ' title="Базова категорія — використовується на головній сторінці"' : ""}>
              <span>${esc(name)} <small>${count}</small></span>
              ${
                fixed
                  ? `<span class="admin-category-chip__fixed" role="img" aria-label="Базову категорію не можна видалити"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>`
                  : `<button type="button" data-delete-category="${esc(key)}" aria-label="Видалити категорію ${esc(name)}"
                    title="${count ? "Спочатку перенесіть товари до іншої категорії" : "Видалити категорію"}" ${count ? "disabled" : ""}>×</button>`
              }
            </div>`;
          })
          .join("");
      const select = addProductForm?.querySelector('[name="category"]');
      if (select) {
        const selected = select.value;
        select.innerHTML = options(CatalogManager.CATEGORIES, selected);
        if (CatalogManager.CATEGORIES[selected]) select.value = selected;
      }
    }
    document
      .getElementById("admin-add-category-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        try {
          const name = form.elements.uk.value.trim();
          CatalogManager.addCategory(
            form.elements.uk.value,
            form.elements.en.value,
          );
          activityRecord({ type: "product", action: "category.added", entityType: "category",
            entityId: name, summary: "Створено категорію", detail: name });
          form.reset();
          renderProductsTable();
          showUndoToast("Категорію додано", null);
        } catch (err) {
          AstelAdminValidation?.reportField(form.elements.uk, err.message, {
            manual: true,
          });
          showUndoToast(err.message, null);
        }
      });
    document
      .getElementById("admin-category-list")
      ?.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-delete-category]");
        if (!btn) return;
        const code = btn.dataset.deleteCategory;
        if (CatalogManager.isFixedCategory(code)) return;
        if ([...productDrafts.values()].some((d) => d.category === code)) {
          showUndoToast(
            "Є незбережені зміни категорії в таблиці товарів",
            null,
          );
          return;
        }
        const name = CatalogManager.CATEGORIES[code];
        if (
          !(await confirmAdminDelete({
            title: "Видалити категорію?",
            message:
              "Категорію буде видалено з каталогу. Цю дію неможливо скасувати.",
            subject: name,
          }))
        )
          return;
        try {
          CatalogManager.deleteCategory(code);
          activityRecord({ type: "product", action: "category.deleted", entityType: "category",
            entityId: code, summary: "Видалено категорію", detail: name });
          renderProductsTable();
          showUndoToast("Категорію видалено", null);
        } catch (err) {
          showUndoToast(err.message, null);
        }
      });
    function renderProductsTable() {
      // Detach already-open editors to preserve uncommitted text and selected File objects.
      const savedForms = new Map();
      productsTbody
        .querySelectorAll('[data-edit-product][data-initialized="true"]')
        .forEach((form) => {
          savedForms.set(form.dataset.editProduct, form);
          form.remove();
        });
      const items = Object.values(PRODUCTS_DATA);
      for (const id of productDrafts.keys())
        if (!PRODUCTS_DATA[id]) productDrafts.delete(id);
      document.getElementById("tab-count-products").textContent = items.length;
      renderCategoryManager();
      productsTbody.innerHTML = items
        .map((p) => {
          const draft = getDraft(p.id),
            dirty = productDrafts.has(p.id) || detailsDirty.has(p.id);
          return `<tr class="admin-inventory-product-row ${dirty ? "has-pending-changes" : ""}" data-product-id="${esc(p.id)}">
              <td>${
                p.isVisible === false
                  ? `<span class="admin-product-link">${esc(p.title)}</span><span class="admin-inventory-hidden-label">Приховано</span>`
                  : `<a href="product.html?id=${encodeURIComponent(p.id)}" class="admin-product-link">${esc(p.title)}</a>`
              }</td>
              <td data-label="Категорія"><select class="admin-select admin-inventory-select" data-product-category aria-label="Категорія">${options(CatalogManager.CATEGORIES, draft.category)}</select></td>
              <td data-label="Умови продажу"><select class="admin-select admin-inventory-select" data-product-terms aria-label="Умови продажу">${options(CatalogManager.SALE_TERMS, draft.saleTermsCode)}</select></td>
              <td data-label="Ціна без ПДВ"><input type="number" class="admin-price-input" value="${esc(draft.price)}" min="1" max="99999999" step="1" aria-label="Ціна" /></td>
              <td data-label="Наявність"><button type="button" class="stock-toggle-btn ${draft.inStock ? "is-instock" : "is-outstock"}" data-toggle-stock="${esc(p.id)}">${draft.inStock ? "● Доступний до замовлення" : "○ Немає в наявності"}</button></td>
              <td class="admin-inventory-product-row__actions"><div class="admin-inventory-actions">
                <button type="button" class="admin-btn admin-btn--outline" data-save-product="${esc(p.id)}" ${dirty ? "" : "disabled"}>Оновити</button>
                <button type="button" class="admin-inventory-visibility ${p.isVisible === false ? "is-hidden" : ""}"
                  data-toggle-product-visibility="${esc(p.id)}"
                  title="${p.isVisible === false ? "Показати товар у каталозі" : "Приховати товар з каталогу"}"
                  aria-label="${p.isVisible === false ? "Показати товар" : "Приховати товар"}: ${esc(p.title)}"
                  aria-pressed="${p.isVisible === false ? "true" : "false"}">
                  <img src="assets/images/${p.isVisible === false ? "visibility.svg" : "visibility_off.svg"}" alt="" />
                </button>
                <button type="button" class="admin-inventory-delete" data-delete-product="${esc(p.id)}" title="Видалити товар" aria-label="Видалити товар ${esc(p.title)}"><img src="assets/images/delete.svg" alt="" /></button>
              </div></td>
            </tr>
            <tr class="admin-inventory-meta-row ${dirty ? "has-pending-changes" : ""}" data-product-meta-id="${esc(p.id)}">
              <td colspan="6"><div class="admin-inventory-meta-bar">
                <button type="button" class="admin-product-content-toggle" data-toggle-product-details="${esc(p.id)}"
                  aria-expanded="${detailOpen.has(p.id)}"><span aria-hidden="true">${detailOpen.has(p.id) ? "▴" : "✎"}</span> ${detailOpen.has(p.id) ? "Сховати редактор" : "Редагувати товар"}</button>
                <span class="admin-inventory-unsaved" role="status" ${dirty ? "" : "hidden"}>Не збережено</span>
              </div></td>
            </tr>${renderDetailsRow(p)}`;
        })
        .join("");
      savedForms.forEach((form, id) => {
        const row = Array.from(
          productsTbody.querySelectorAll("[data-product-details-id]"),
        ).find((r) => r.dataset.productDetailsId === id);
        row?.querySelector("form")?.replaceWith(form);
        // Keep the unsaved text/File objects, but refresh the gallery to reflect
        // changes made by dragging, uploading or removing a photo.
        const gallery = form.querySelector("[data-product-photos]");
        if (gallery && PRODUCTS_DATA[id]) {
          const template = document.createElement("template");
          template.innerHTML = renderPhotoEditor(
            PRODUCTS_DATA[id],
            getDraft(id).images,
          ).trim();
          gallery.replaceWith(template.content.firstElementChild);
        }
      });
    }
    async function compressImage(file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Підтримуються PNG, JPG та WebP");
      if (file.size > 6 * 1024 * 1024)
        throw new Error("Фото не може перевищувати 6 МБ");
      const objectUrl = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () =>
            reject(new Error("Не вдалося відкрити зображення"));
          img.src = objectUrl;
        });
        for (const dimension of [1200, 960, 720, 560]) {
          const scale = Math.min(
            1,
            dimension / Math.max(img.naturalWidth, img.naturalHeight),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          for (const quality of [0.8, 0.67, 0.5]) {
            const data = canvas.toDataURL("image/jpeg", quality);
            if (CatalogManager.validImageSource(data)) return data;
          }
        }
        throw new Error("Фото завелике для локального збереження");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
    async function imagesFromInput(input) {
      const files = Array.from(input?.files || []);
      const images = [];
      for (const file of files) images.push(await compressImage(file));
      return images;
    }
    function productEditorSnapshot(form) {
      // Only values that affect a saved product belong in this snapshot.
      // Gallery photos already use productDrafts, and changing the language
      // tab or focus must not count as a product modification.
      const fields = Array.from(form.querySelectorAll("input, textarea, select"))
        .filter((field) => !field.matches("[data-photo-upload]"))
        .map((field) => {
          if (field.type === "file") {
            return Array.from(field.files || [], (file) => [
              file.name, file.size, file.type, file.lastModified,
            ]);
          }
          if (field.type === "checkbox" || field.type === "radio")
            return field.checked;
          return field.value;
        });
      return JSON.stringify({
        fields,
        // Include the row/section structure and original PDF attachments.
        // Thus, adding then removing an item returns to the clean state.
        sections: Array.from(form.querySelectorAll(".admin-spec-section"),
          (section) => section.querySelectorAll(".admin-spec-row").length),
        docs: Array.from(form.querySelectorAll(".admin-document-row"),
          (row) => row.dataset.originalDoc || null),
      });
    }
    function refreshProductEditorDirty(form) {
      if (form.dataset.initialized !== "true") return;
      const id = form.dataset.editProduct;
      const baseline = editorBaselines.get(id);
      if (baseline === undefined) return;
      if (productEditorSnapshot(form) === baseline) detailsDirty.delete(id);
      else detailsDirty.add(id);
      const row = Array.from(
        productsTbody.querySelectorAll("tr[data-product-id]"),
      ).find((r) => r.dataset.productId === id);
      if (row) feedback(row);
    }
    // Confirmed structural changes are reported by AstelProductEditor *after*
    // the item is actually removed. Cancelled deletion changes nothing.
    productsTbody.addEventListener("astel:product-editor-mutated", (e) => {
      const form = e.target.closest("[data-edit-product]");
      if (form) refreshProductEditorDirty(form);
    });
    productsTbody.addEventListener("input", (e) => {
      const form = e.target.closest("[data-edit-product]");
      if (form) {
        if (!e.target.matches("[data-photo-upload]"))
          refreshProductEditorDirty(form);
        return;
      }
      const row = e.target.closest("tr[data-product-id]");
      if (!row || !e.target.matches(".admin-price-input")) return;
      setDraft(row.dataset.productId, readRowDraft(row));
      feedback(row);
    });
    productsTbody.addEventListener("change", (e) => {
      const form = e.target.closest("[data-edit-product]");
      if (form) {
        if (!e.target.matches("[data-photo-upload]"))
          refreshProductEditorDirty(form);
        return;
      }
      const row = e.target.closest("tr[data-product-id]");
      if (
        !row ||
        !e.target.matches(
          "[data-product-category],[data-product-terms],.admin-price-input",
        )
      )
        return;
      setDraft(row.dataset.productId, readRowDraft(row));
      feedback(row);
    });
    productsTbody.addEventListener("click", async (e) => {
      const form = e.target.closest("[data-edit-product]");
      if (
        form &&
        e.target.closest("button") &&
        !e.target.closest(
          "[data-editor-lang], [data-remove-spec-row], [data-remove-spec-section], [data-remove-doc-row]",
        )
      ) {
        // Add-row/add-section actions mutate synchronously; compare the form
        // after the editor's delegated handler has applied the mutation.
        refreshProductEditorDirty(form);
      }
      const btn = e.target.closest("button");
      if (!btn) return;
      const row = btn.closest("tr[data-product-id]");
      if (btn.hasAttribute("data-toggle-product-details")) {
        showDetails(btn.dataset.toggleProductDetails);
        return;
      }
      if (btn.hasAttribute("data-toggle-stock")) {
        const id = btn.dataset.toggleStock,
          draft = readRowDraft(row);
        draft.inStock = !draft.inStock;
        setDraft(id, draft);
        renderProductsTable();
      } else if (btn.hasAttribute("data-save-product") && row) {
        const id = row.dataset.productId;
        const draft = readRowDraft(row);
        const price = CatalogManager.validPrice(draft.price);
        if (price == null) {
          const input = row.querySelector(".admin-price-input");
          AstelAdminValidation?.reportField(
            input,
            "Вкажіть цілу ціну від 1 до 99 999 999 грн",
            { manual: true },
          );
          AstelAdminValidation?.focusFirst(input);
          showUndoToast("Вкажіть цілу ціну від 1 до 99 999 999 грн", null);
          return;
        }
        const previous = getDraft(id);
        const form = detailsForm(id);
        const patch = {
          price,
          category: draft.category,
          saleTermsCode: draft.saleTermsCode,
          inStock: draft.inStock,
          images: [...draft.images],
        };
        const button = btn;
        button.disabled = true;
        try {
          if (detailsDirty.has(id) && form?.dataset.initialized) {
            if (!AstelAdminValidation.validateForm(form)) {
              showUndoToast("Заповніть пропущені поля!", null);
              return;
            }
            if (!AstelProductEditor.validateTranslations(form)) {
              showUndoToast("Заповніть пропущені поля!", null);
              return;
            }
            Object.assign(patch, AstelProductEditor.extractProductNames(form));
            Object.assign(patch, AstelProductEditor.extractDescriptions(form));
            patch.specSections = AstelProductEditor.extractSections(form);
            patch.docs = await AstelProductEditor.extractDocuments(form);
            // Existing built-in rows are represented in the new unified editor.
            patch.techSpecs = [];
            patch.generalSpecs = [];
          }
          const before = productAuditSnapshot(PRODUCTS_DATA[id]);
          const oldDocs = [...(PRODUCTS_DATA[id]?.docs || [])];
          CatalogManager.updateProduct(id, patch);
          logProductChanges(id, before, PRODUCTS_DATA[id]);
          cleanupRemovedPdfFiles(oldDocs);
          if (form?.dataset.initialized) {
            AstelProductEditor.populate(form, PRODUCTS_DATA[id]);
            editorBaselines.set(id, productEditorSnapshot(form));
          }
          productDrafts.delete(id);
          detailsDirty.delete(id);
          renderProductsTable();
          showUndoToast("Товар оновлено", null);
        } catch (err) {
          setDraft(id, previous);
          renderProductsTable();
          showUndoToast(
            err.name === "QuotaExceededError"
              ? "Недостатньо місця в localStorage"
              : err.message,
            null,
          );
        } finally {
          button.disabled = false;
        }
      } else if (btn.hasAttribute("data-toggle-product-visibility")) {
        const id = btn.dataset.toggleProductVisibility;
        const product = PRODUCTS_DATA[id];
        if (!product) return;
        const willHide = product.isVisible !== false;
        const accepted = await confirmAdminDelete({
          title: willHide ? "Приховати товар?" : "Показати товар?",
          message: willHide
            ? "Товар зникне з каталогу, документації та прямих сторінок товарів для покупців. Він залишиться у складському обліку й буде доступний для редагування."
            : "Товар знову буде доступний покупцям у каталозі та на сторінці товару.",
          subject: product.title,
          confirmLabel: willHide ? "Приховати" : "Показати",
          neutral: true,
        });
        if (!accepted) return;
        try {
          CatalogManager.updateProduct(id, { isVisible: !willHide });
          activityRecord({ type: "product", action: "product.visibility", entityType: "product",
            entityId: id, summary: willHide ? "Приховано товар" : "Опубліковано товар",
            detail: product.title });
          renderProductsTable();
          showUndoToast(
            willHide
              ? "Товар приховано з каталогу"
              : "Товар повернуто до каталогу",
            null,
          );
        } catch (err) {
          showUndoToast(err.message, null);
        }
      } else if (btn.hasAttribute("data-delete-product")) {
        const id = btn.dataset.deleteProduct,
          p = PRODUCTS_DATA[id];
        if (!p) return;
        if (
          !(await confirmAdminDelete({
            title: "Видалити товар?",
            message:
              "Товар буде видалено з каталогу. Цю дію неможливо скасувати.",
            subject: p.title,
          }))
        )
          return;
        try {
          const oldDocs = [...(p.docs || [])];
          productDrafts.delete(id);
          detailsDirty.delete(id);
          editorBaselines.delete(id);
          detailOpen.delete(id);
          CatalogManager.deleteProduct(id);
          activityRecord({ type: "product", action: "product.deleted", entityType: "product",
            entityId: id, summary: "Видалено товар", detail: p.title });
          cleanupRemovedPdfFiles(oldDocs);
          renderProductsTable();
          showUndoToast("Товар видалено з каталогу", null);
        } catch (err) {
          showUndoToast(err.message, null);
        }
      } else if (btn.hasAttribute("data-photo-remove")) {
        const photosRow = btn.closest("[data-product-photos]");
        const id = photosRow?.dataset.productPhotos,
          p = PRODUCTS_DATA[id];
        if (!p) return;
        const draft = { ...getDraft(id), images: [...getDraft(id).images] };
        const index = Number(btn.dataset.photoRemove);
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= draft.images.length
        )
          return;
        if (draft.images.length === 1) {
          showUndoToast("Потрібно залишити хоча б одне фото", null);
          return;
        }
        draft.images.splice(index, 1);
        setDraft(id, draft);
        renderProductsTable();
      }
    });
    AstelPhotoGallery.mount(
      productsTbody,
      ({ id, from, target, after, focusMoved = false }) => {
        const product = PRODUCTS_DATA[id];
        if (!product) return;
        const old = getDraft(id),
          result = AstelPhotoGallery.moveImages(
            old.images,
            from,
            target,
            after,
          );
        if (!result.changed) return;
        setDraft(id, { ...old, images: result.images });
        renderProductsTable();
        if (focusMoved) {
          const gallery = Array.from(
            productsTbody.querySelectorAll("[data-product-photos]"),
          ).find((row) => row.dataset.productPhotos === id);
          gallery
            ?.querySelector(
              `.admin-photo-item[data-photo-index="${result.newIndex}"]`,
            )
            ?.focus();
        }
      },
    );
    productsTbody.addEventListener("change", async (e) => {
      const input = e.target.closest("[data-photo-upload]");
      if (!input) return;
      const id = input.dataset.photoUpload,
        p = PRODUCTS_DATA[id];
      if (!p) return;
      try {
        const files = await imagesFromInput(input);
        const draft = getDraft(id);
        // The placeholder is not a real photo; replace it with the first upload.
        const existingImages = draft.images.filter(
          (src) => src !== CatalogManager.DEFAULT_PRODUCT_IMAGE,
        );
        const images = [...existingImages, ...files];
        if (images.length > 12) throw new Error("Максимум 12 фото");
        setDraft(id, { ...draft, images });
        renderProductsTable();
      } catch (err) {
        showUndoToast(err.message, null);
      }
    });
    addProductForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = addProductForm.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        if (!AstelProductEditor.validateTranslations(addProductForm)) {
          showUndoToast("Заповніть пропущені поля!", null);
          return;
        }
        const data = new FormData(addProductForm);
        const specSections = AstelProductEditor.extractSections(addProductForm);
        const docs = await AstelProductEditor.extractDocuments(addProductForm);
        const photoFiles = AstelProductEditor.getPhotos(addProductForm);
        // CatalogManager uses default.png when there are no uploaded photos.
        const photos = [];
        for (const file of photoFiles) photos.push(await compressImage(file));
        const newProduct = CatalogManager.addProduct({
          id: String(data.get("id") || "").trim(),
          ...AstelProductEditor.extractProductNames(addProductForm),
          description: String(data.get("description") || "").trim(),
          descriptionEn: String(data.get("descriptionEn") || "").trim(),
          price: String(data.get("price") || "").trim(),
          category: String(data.get("category") || ""),
          saleTermsCode: String(data.get("saleTermsCode") || ""),
          inStock: !!data.get("inStock"),
          images: photos,
          specSections,
          docs,
        });
        activityRecord({ type: "product", action: "product.added", entityType: "product",
          entityId: newProduct.id, summary: "Додано новий товар", detail: newProduct.title });
        addProductForm.reset();
        AstelProductEditor.reset(addProductForm);
        renderProductsTable();
        showUndoToast(`Додано товар: ${newProduct.title}`, null);
      } catch (err) {
        showUndoToast(
          err.name === "QuotaExceededError"
            ? "Бракує місця в localStorage для фото / PDF"
            : err.message,
          null,
        );
      } finally {
        button.disabled = false;
      }
    });
    window.addEventListener("astel:catalog-updated", () =>
      renderProductsTable(),
    );

    // Create Demo Order Button
    document
      .getElementById("create-demo-order-btn")
      .addEventListener("click", () => {
        const now = Date.now();
        const demoOrder = {
          orderId: OrderLifecycle.generateId(now),
          createdAt: now,
          expiresAt: now + 15 * 60 * 1000,
          locked: true,
          status: "Передано в обробку",
          statusCode: "processing",
          ttn: "",
          customer: {
            firstName: "Олександр",
            lastName: "Ковальчук",
            phone: "+380679876543",
            email: "kovalchuk@energy.ua",
          },
          delivery: {
            city: "Львів",
            carrierKey: "nova",
            carrierName: "Нова Пошта",
            type: "Відділення",
            branch: "Відділення №4: вул. Городоцька, 359",
          },
          payment: "Оплата банківською картою",
          paymentStatus: "unpaid",
          subtotal: 43000,
          items: [
            {
              id: "com-900-psg-4g",
              title: "GSM/LTE-модем COM-900-PSG-4G (для лічильників GAMA)",
              price: 4300,
              qty: 10,
              image: "assets/images/items/СОМ-900-PSG-4G.png",
            },
          ],
        };
        // Append to raw history, never the filtered manager view: that view
        // intentionally excludes orders still inside their editing window.
        const currentList = OrderLifecycle.readHistory();
        currentList.unshift(demoOrder);
        localStorage.setItem(COMPLETED_ORDERS_KEY, JSON.stringify(currentList));
        // Demo orders are ready for processing; do not replace a customer's editable order.
        activityRecord({ type: "order", action: "order.created", entityType: "order",
          entityId: demoOrder.orderId, summary: "Створено тестове замовлення",
          detail: "Демонстраційне замовлення, додане менеджером" });
        renderDashboard();
        showUndoToast(
          `Створено нове тестове замовлення #${demoOrder.orderId}`,
          null,
        );
      });

    // Switch Admin Tabs
    const tabBtns = document.querySelectorAll("[data-admin-tab]");
    const panels = document.querySelectorAll(".admin-panel");
    const filterBar = document.getElementById("orders-filter-bar");
    const clientFilterBar = document.getElementById("clients-filter-bar");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-admin-tab");
        tabBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        panels.forEach((p) => p.classList.toggle("is-active", p.id === target));
        filterBar.hidden = target !== "panel-orders";
        clientFilterBar.hidden = target !== "panel-clients";
        if (target === "panel-activity") AstelAdminActivity.renderGlobal();
        if (target === "panel-clients") {
          renderClientsTable(buildClientsList(loadAllOrders()));
        }
      });
    });

    // Warranty cases and manual payment ledger are separate from the original
    // order status and recognized revenue. Keep all records browser-local until API integration.
    const operationsBindings = {
      findOrder: (id) => loadAllOrders().find((o) => String(o.orderId) === String(id)),
      refresh: () => renderDashboard(),
      activity: activityRecord,
      toast: (message) => showUndoToast(message, null),
    };
    AstelAdminWarranty.bindUI(operationsBindings);
    AstelAdminPayments.bindUI(operationsBindings);

    renderDashboard();
    renderProductsTable();

    // Expiry is based on the original timestamp, not on whether the status page is open.
    // Keep the manager's queue fresh if it remains open through the 15-minute deadline.
    setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const next = getOrderFingerprint(loadAllOrders());
      if (next !== lastOrderFingerprint) renderDashboard();
    }, 1000);
    window.addEventListener("storage", (event) => {
      if (
        [
          ACTIVE_ORDER_KEY,
          COMPLETED_ORDERS_KEY,
          AdminCustomers.STORAGE_KEY,
          AstelAdminWarranty.KEY,
          AstelAdminPayments.KEY,
        ].includes(event.key)
      )
        renderDashboard();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") renderDashboard();
    });
  });
}
