/* Astel-Com admin dashboard (localStorage demo, not production authorization). */
"use strict";

const AdminSafety = Object.freeze({
  escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[ch]);
  },
  normalizeTtn(value) {
    return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  },
  isValidTtn(value, carrierKey) {
    const code = AdminSafety.normalizeTtn(value);
    if (carrierKey === "nova") return /^\d{14}$/.test(code);
    if (carrierKey === "ukr") return /^(?:[A-Z]{2}\d{9}[A-Z]{2}|\d{13,14})$/.test(code);
    return /^[A-Z0-9-]{8,32}$/.test(code) && (code.match(/\d/g) || []).length >= 5;
  },
  safeImageUrl(value) {
    const src = String(value ?? "");
    return /^assets\/images\/[\p{L}\p{N} _.,()\-\/]+\.(?:png|webp|jpg|jpeg|svg)$/u.test(src) && !src.includes("..")
      ? src : "assets/images/logo-main.svg";
  },
});
if (typeof module !== "undefined") module.exports = AdminSafety;

if (typeof document !== "undefined") {
      document.addEventListener("DOMContentLoaded", function () {
        const ACTIVE_ORDER_KEY = "astelkom_active_order";
        const COMPLETED_ORDERS_KEY = "astelkom_completed_orders";

        const esc = AdminSafety.escapeHtml;

        const STATUS_LABELS = {
          active: "Прийнято (редагування)",
          processing: "Передано в обробку",
          shipped: "Відправлено",
          completed: "Виконано",
          canceled: "Скасовано",
        };

        const PIPELINE_STEPS = [
          { code: "active", label: "1. Прийнято" },
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
              if (!id || id === activeEditableOrderId || OrderLifecycle.isEditable(ord, now)) return;

              // A legacy history entry may have been copied before its editing window ended.
              // Never expose it before expiry, and normalize it once the deadline has passed.
              const releasedOrd = !ord.locked && Number.isFinite(Number(ord.expiresAt))
                && Number(ord.expiresAt) <= now
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

        function persistOrderUpdate(
          orderId,
          newStatusCode,
          newTtn,
          recordUndo = true,
        ) {
          const cleanId = String(orderId);
          const allOrders = loadAllOrders();
          const targetOrd = allOrders.find(
            (o) => String(o.orderId) === cleanId,
          );
          if (!targetOrd) return;

          const prevStatusCode = targetOrd.statusCode;
          const prevTtn = targetOrd.ttn || "";
          const finalStatusCode = newStatusCode || prevStatusCode;
          const finalTtn =
            newTtn !== undefined ? AdminSafety.normalizeTtn(newTtn) : prevTtn;

          if (finalTtn && !AdminSafety.isValidTtn(finalTtn, targetOrd.delivery?.carrierKey)) {
            showUndoToast("Невірний формат ТТН для вибраної служби доставки", null);
            return false;
          }
          if (["shipped", "completed"].includes(finalStatusCode) && !finalTtn) {
            showUndoToast("Додайте номер ТТН перед відправкою або завершенням замовлення", null);
            return false;
          }

          const updatedOrd = {
            ...targetOrd,
            orderId: cleanId,
            statusCode: finalStatusCode,
            status: STATUS_LABELS[finalStatusCode] || "Виконано",
            ttn: finalTtn,
            locked: finalStatusCode !== "active",
          };

          // 1. Update active order in localStorage if it matches this orderId
          try {
            const rawActive = localStorage.getItem(ACTIVE_ORDER_KEY);
            if (rawActive) {
              const act = JSON.parse(rawActive);
              if (String(act.orderId || act.id) === cleanId) {
                localStorage.setItem(
                  ACTIVE_ORDER_KEY,
                  JSON.stringify(updatedOrd),
                );
              }
            }
          } catch (e) {}

          // 2. Write complete list back to astelkom_completed_orders so it persists reliably
          const updatedList = allOrders.map((o) =>
            String(o.orderId) === cleanId ? updatedOrd : o,
          );
          localStorage.setItem(
            COMPLETED_ORDERS_KEY,
            JSON.stringify(updatedList),
          );

          renderDashboard();

          if (recordUndo && prevStatusCode !== finalStatusCode) {
            showUndoToast(
              `Замовлення #${cleanId}: статус змінено на «${STATUS_LABELS[finalStatusCode]}»`,
              () => {
                persistOrderUpdate(cleanId, prevStatusCode, prevTtn, false);
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
                persistOrderUpdate(cleanId, finalStatusCode, prevTtn, false);
              },
            );
          }
        }

        function buildClientsList(orders) {
          const clientsMap = new Map();

          const upsertClient = (c, delivery, orderSubtotal, statusCode) => {
            if (!c) return;
            const key = (c.email || c.phone || "guest").toLowerCase();
            const existing = clientsMap.get(key) || {
              firstName: c.firstName || "Ім'я",
              lastName: c.lastName || "Прізвище",
              phone: c.phone || "—",
              email: c.email || "—",
              address: delivery
                ? `м. ${delivery.city}, ${delivery.carrierName} (${delivery.branch})`
                : "—",
              ordersCount: 0,
              totalSpent: 0,
            };

            if (orderSubtotal !== undefined) {
              existing.ordersCount += 1;
              if (statusCode !== "canceled") {
                existing.totalSpent += Number(orderSubtotal || 0);
              }
            }
            if (delivery && existing.address === "—") {
              existing.address = `м. ${delivery.city}, ${delivery.carrierName} (${delivery.branch})`;
            }
            clientsMap.set(key, existing);
          };

          if (typeof AuthManager !== "undefined" && AuthManager.getUser()) {
            const u = AuthManager.getUser();
            upsertClient(u, u.address);
          }

          orders.forEach((ord) => {
            upsertClient(
              ord.customer,
              ord.delivery,
              ord.subtotal,
              ord.statusCode,
            );
          });

          return Array.from(clientsMap.values());
        }

        const ordersContainer = document.getElementById(
          "admin-orders-container",
        );
        const clientsTbody = document.getElementById("admin-clients-tbody");
        const searchInput = document.getElementById("admin-search");
        const statusFilter = document.getElementById("admin-status-filter");

        let lastOrderFingerprint = "";
        function getOrderFingerprint(orders) {
          return JSON.stringify(orders.map((o) => [o.orderId, o.statusCode, o.ttn, o.subtotal, o.locked, o.finalizedAt]));
        }

        function renderDashboard() {
          const allOrders = loadAllOrders();
          lastOrderFingerprint = getOrderFingerprint(allOrders);
          const clients = buildClientsList(allOrders);

          const pendingCount = allOrders.filter(
            (o) =>
              o.statusCode === "active" ||
              o.statusCode === "processing" ||
              o.statusCode === "shipped",
          ).length;
          const totalRevenue = allOrders
            .filter((o) => o.statusCode === "completed")
            .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);

          document.getElementById("kpi-total-orders").textContent =
            allOrders.length;
          document.getElementById("kpi-pending-orders").textContent =
            pendingCount;
          document.getElementById("kpi-revenue").textContent =
            formatMoney(totalRevenue);
          document.getElementById("kpi-clients-count").textContent =
            clients.length;

          document.getElementById("tab-count-orders").textContent =
            allOrders.length;
          document.getElementById("tab-count-clients").textContent =
            clients.length;

          const query = searchInput.value.trim().toLowerCase();
          const statusVal = statusFilter.value;

          const filteredOrders = allOrders.filter((ord) => {
            if (statusVal !== "all" && ord.statusCode !== statusVal) {
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
                const isClosed =
                  ord.statusCode === "completed" ||
                  ord.statusCode === "canceled";
                const currentStepIdx = PIPELINE_STEPS.findIndex(
                  (s) => s.code === ord.statusCode,
                );

                // 1. Read-only Pipeline Stepper (Visual progress only)
                const pipelineHtml = PIPELINE_STEPS.map((step, idx) => {
                  let cls = "pipeline-step";
                  if (ord.statusCode === step.code) {
                    cls += " is-current";
                    if (step.code === "completed") cls += " is-completed-step";
                  } else if (currentStepIdx > idx && !isClosed) {
                    cls += " is-passed";
                  }
                  return `
                    <div class="${cls}">
                      ${currentStepIdx > idx && !isClosed ? "✓ " : ""}${step.label}
                    </div>
                  `;
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
                const hasSavedTtn = Boolean(
                  ord.ttn && ord.ttn.trim().length > 0,
                );
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
                      <button type="button" class="admin-btn admin-btn--outline" data-reopen-order="${esc(ord.orderId)}" style="height: 36px; padding: 0 14px;">
                        ↺ Повернути в роботу
                      </button>
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
                      <span class="status-pill status-pill--${ord.statusCode}">
                        ${STATUS_LABELS[ord.statusCode]}
                      </span>
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
                        <div><strong>Точка видачі:</strong> ${esc(ord.delivery?.branch)}</div>
                        <div><strong>Оплата:</strong> ${esc(ord.payment)} | <strong>Сума:</strong> ${formatMoney(ord.subtotal)}</div>
                        ${ord.ttn ? `<div><strong>ТТН:</strong> <span style="font-family: var(--font-mono); font-weight: 700; color: #059669;">${esc(ord.ttn)}</span></div>` : ""}
                      </div>
                    </div>

                    <div class="admin-order-items">
                      ${itemsHtml}
                    </div>

                    <div class="admin-order-card__controls">
                      ${bottomControlsHtml}
                    </div>
                  </article>
                `;
              })
              .join("");
          }

          // Render Clients Table
          clientsTbody.innerHTML = clients
            .map((c) => {
              const initials =
                ((c.firstName || "К")[0] || "К") +
                ((c.lastName || "Л")[0] || "");
              return `
                <tr>
                  <td>
                    <div class="client-name-cell">
                      <span class="client-avatar-sm">${esc(initials.toUpperCase())}</span>
                      <strong>${esc(c.firstName)} ${esc(c.lastName)}</strong>
                    </div>
                  </td>
                  <td style="font-family: var(--font-mono);">${esc(c.phone)}</td>
                  <td>${esc(c.email)}</td>
                  <td>${esc(c.address)}</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">${c.ordersCount}</td>
                  <td style="font-family: var(--font-mono); font-weight: 700;">${formatMoney(c.totalSpent)}</td>
                </tr>
              `;
            })
            .join("");
        }

        // Order Actions Click Handler
        ordersContainer.addEventListener("click", (e) => {
          const card = e.target.closest(".admin-order-card");
          if (!card) return;
          const orderId = String(card.getAttribute("data-order-id"));
          const ttnInput = card.querySelector(".order-ttn-input");
          const currentTtn = ttnInput ? ttnInput.value.trim() : undefined;

          // 1. Click "Редагувати" TTN button -> switch pill back to input
          const editTtnBtn = e.target.closest("[data-edit-ttn]");
          if (editTtnBtn) {
            editingTtnOrderIds.add(orderId);
            renderDashboard();
            const newCard = Array.from(ordersContainer.querySelectorAll(".admin-order-card"))
              .find((element) => element.getAttribute("data-order-id") === orderId);
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
            const order = loadAllOrders().find((entry) => String(entry.orderId) === orderId);
            if (!AdminSafety.isValidTtn(val, order?.delivery?.carrierKey)) {
              ttnInput.focus();
              ttnInput.classList.add("has-error");
              showUndoToast("Введіть коректний номер ТТН для цієї служби доставки", null);
              return;
            }
            editingTtnOrderIds.delete(orderId);
            persistOrderUpdate(orderId, null, val, true);
            return;
          }

          // 3. Click Pipeline Step button (1. Прийнято / 2. В обробці / 3. Відправлено / 4. Виконано)

          // 4. Click "Позначити відправленим →" / "Прийняти в обробку →" / "✓ Завершити (Виконано)"
          const advanceBtn = e.target.closest("[data-advance-status]");
          if (advanceBtn) {
            const nextCode = advanceBtn.getAttribute("data-advance-status");

            // Require TTN before moving order to "shipped" ("Відправлено")
            if (nextCode === "shipped") {
              const allOrders = loadAllOrders();
              const ord = allOrders.find((o) => String(o.orderId) === orderId);
              const savedTtn = ord && ord.ttn ? ord.ttn.trim() : "";
              const effectiveTtn =
                currentTtn !== undefined ? currentTtn : savedTtn;

              if (!AdminSafety.isValidTtn(effectiveTtn, ord?.delivery?.carrierKey)) {
                if (ttnInput) {
                  ttnInput.classList.remove("has-error");
                  void ttnInput.offsetWidth; // Restart shake animation
                  ttnInput.classList.add("has-error");
                  ttnInput.focus();

                  // Show inline error hint under the input if not already shown
                  const group = ttnInput.closest(".ttn-inline-box");
                  if (group && !group.querySelector(".ttn-error-hint")) {
                    const hint = document.createElement("span");
                    hint.className = "ttn-error-hint";
                    hint.textContent =
                      "Введіть коректний номер ТТН для вибраної служби доставки";
                    group.appendChild(hint);
                  }

                  ttnInput.addEventListener(
                    "input",
                    () => {
                      ttnInput.classList.remove("has-error");
                      const h = group && group.querySelector(".ttn-error-hint");
                      if (h) h.remove();
                    },
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

        // Allow pressing Enter inside TTN input to save TTN immediately
        ordersContainer.addEventListener("keydown", (e) => {
          if (
            e.key === "Enter" &&
            e.target.classList.contains("order-ttn-input")
          ) {
            e.preventDefault();
            const card = e.target.closest(".admin-order-card");
            if (!card) return;
            const orderId = String(card.getAttribute("data-order-id"));
            const val = e.target.value.trim();
            const order = loadAllOrders().find((entry) => String(entry.orderId) === orderId);
            if (!AdminSafety.isValidTtn(val, order?.delivery?.carrierKey)) {
              e.target.classList.add("has-error");
              showUndoToast("Введіть коректний номер ТТН для цієї служби доставки", null);
              return;
            }
            editingTtnOrderIds.delete(orderId);
            persistOrderUpdate(orderId, null, val, true);
          }
        });

        searchInput.addEventListener("input", renderDashboard);
        statusFilter.addEventListener("change", renderDashboard);

        // Catalog Stock & Prices Table
        const productsTbody = document.getElementById("admin-products-tbody");

        function renderProductsTable() {
          if (typeof PRODUCTS_DATA === "undefined") return;
          const items = Object.values(PRODUCTS_DATA);
          document.getElementById("tab-count-products").textContent =
            items.length;

          productsTbody.innerHTML = items
            .map((p) => {
              const inStock = p.inStock;
              const numericPrice = p.numericPrice;

              return `
                <tr data-product-id="${esc(p.id)}">
                  <td>
                    <a href="product.html?id=${esc(p.id)}" style="font-weight: 600; text-decoration: underline;">
                      ${esc(p.title)}
                    </a>
                  </td>
                  <td>${esc(p.categoryName)}</td>
                  <td>${esc(p.saleTerms)}</td>
                  <td>
                    <input
                      type="number"
                      class="admin-price-input"
                      value="${numericPrice}"
                      min="1"
                      max="99999999"
                      step="1"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      class="stock-toggle-btn ${inStock ? "is-instock" : "is-outstock"}"
                      data-toggle-stock="${esc(p.id)}"
                      data-current-stock="${inStock}"
                    >
                      ${inStock ? "● В наявності" : "○ Немає в наявності"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="admin-btn admin-btn--outline"
                      data-save-product="${esc(p.id)}"
                      style="height: 36px; padding: 0 12px;"
                    >
                      Оновити
                    </button>
                  </td>
                </tr>
              `;
            })
            .join("");
        }

        productsTbody.addEventListener("click", (e) => {
          const stockBtn = e.target.closest("[data-toggle-stock]");
          const saveProdBtn = e.target.closest("[data-save-product]");

          if (stockBtn) {
            const id = stockBtn.getAttribute("data-toggle-stock");
            const cur = stockBtn.getAttribute("data-current-stock") === "true";
            try {
              CatalogManager.updateProduct(id, { inStock: !cur });
              renderProductsTable();
            } catch (error) {
              showUndoToast(error.message, null);
            }
          } else if (saveProdBtn) {
            const id = saveProdBtn.getAttribute("data-save-product");
            const row = saveProdBtn.closest("tr");
            const priceInput = row?.querySelector(".admin-price-input");
            const newPrice = priceInput?.value.trim() || "";
            if (CatalogManager.validPrice(newPrice) === null) {
              priceInput?.focus();
              priceInput?.setAttribute("aria-invalid", "true");
              showUndoToast("Вкажіть цілу ціну від 1 до 99 999 999 грн", null);
              return;
            }
            try {
              CatalogManager.updateProduct(id, { price: Number(newPrice) });
              showUndoToast("Ціну товару успішно оновлено", null);
              renderProductsTable();
            } catch (error) {
              showUndoToast(error.message, null);
            }
          }
        });

        // Create Demo Order Button
        document
          .getElementById("create-demo-order-btn")
          .addEventListener("click", () => {
            const now = Date.now();
            const demoOrder = {
              orderId: "AK-" + String(now).slice(-6),
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
            const currentList = loadAllOrders();
            currentList.unshift(demoOrder);
            localStorage.setItem(
              COMPLETED_ORDERS_KEY,
              JSON.stringify(currentList),
            );
            // Demo orders are ready for processing; do not replace a customer's editable order.
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

        tabBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-admin-tab");
            tabBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
            panels.forEach((p) =>
              p.classList.toggle("is-active", p.id === target),
            );
            filterBar.style.display =
              target === "panel-orders" ? "flex" : "none";
          });
        });

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
          if ([ACTIVE_ORDER_KEY, COMPLETED_ORDERS_KEY].includes(event.key)) renderDashboard();
        });
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") renderDashboard();
        });
      });
}
