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
    if (typeof CatalogManager !== 'undefined' && CatalogManager.validImageSource(src)) return src;
    return /^assets\/images\/[\p{L}\p{N} _.,()\-\/]+\.(?:png|webp|jpg|jpeg|svg)$/u.test(src) && !src.includes("..")
      ? src : "assets/images/logo-main.svg";
  },
});
// Payment and order-progress are independent dimensions of the admin filter.
// A localStorage payment flag alone is not proof: use OrderFinance.paymentStatus().
const AdminOrderFilters = Object.freeze({
  matches(order, selectedValue, finance) {
    if (selectedValue === "all") return true;
    if (selectedValue.startsWith("payment:")) {
      return finance.paymentStatus(order) === selectedValue.slice("payment:".length);
    }
    return order.statusCode === selectedValue;
  },
});
if (typeof module !== "undefined") module.exports = {
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

        // Styled confirmation for destructive admin actions. Never interpolate product
        // or category names into HTML: those labels may originate from user input.
        function confirmAdminDelete({ title, message, subject, confirmLabel='Видалити' }) {
          return new Promise(resolve => {
            const dialog = document.createElement('dialog');
            dialog.className = 'admin-confirm-dialog';
            dialog.setAttribute('aria-labelledby', 'admin-confirm-title');
            dialog.setAttribute('aria-describedby', 'admin-confirm-message');

            const heading = document.createElement('h2');
            heading.id = 'admin-confirm-title';
            heading.textContent = title;
            const description = document.createElement('p');
            description.id = 'admin-confirm-message';
            description.textContent = message;
            const item = document.createElement('strong');
            item.className = 'admin-confirm-dialog__subject';
            item.textContent = subject;
            const actions = document.createElement('div');
            actions.className = 'admin-confirm-dialog__actions';
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = 'admin-btn admin-btn--outline';
            cancel.textContent = 'Скасувати';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'admin-btn admin-confirm-dialog__danger';
            remove.textContent = confirmLabel;
            actions.append(cancel, remove);
            dialog.append(heading, description, item, actions);

            let settled = false;
            const finish = accepted => {
              if (settled) return;
              settled = true;
              if (dialog.open) dialog.close();
              dialog.remove();
              resolve(accepted);
            };
            cancel.addEventListener('click', () => finish(false));
            remove.addEventListener('click', () => finish(true));
            dialog.addEventListener('cancel', event => {
              event.preventDefault();
              finish(false);
            });
            dialog.addEventListener('click', event => {
              if (event.target === dialog) finish(false);
            });
            document.body.append(dialog);
            dialog.showModal();
            cancel.focus();
          });
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

        function writeOrder(updatedOrd) {
          const cleanId=String(updatedOrd.orderId);
          const orders=loadAllOrders();
          const list=orders.some(o=>String(o.orderId)===cleanId)
            ? orders.map(o=>String(o.orderId)===cleanId ? updatedOrd : o)
            : [updatedOrd,...orders];
          localStorage.setItem(COMPLETED_ORDERS_KEY,JSON.stringify(list));
          try {
            const active=JSON.parse(localStorage.getItem(ACTIVE_ORDER_KEY)||'null');
            if(active && String(active.orderId||active.id)===cleanId)
              localStorage.setItem(ACTIVE_ORDER_KEY,JSON.stringify(updatedOrd));
          } catch(_){}
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
            ...OrderFinance.transition(targetOrd,finalStatusCode),
            orderId:cleanId,
            status:STATUS_LABELS[finalStatusCode],
            ttn:finalTtn,
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
          return JSON.stringify(orders.map((o) => [o.orderId, o.statusCode, o.ttn, o.subtotal, o.locked, o.finalizedAt, o.paymentStatus, o.paymentVerification, o.payment, o.recognizedRevenue, o.customer, o.delivery, o.items]));
        }

        const CARRIERS={nova:'Нова Пошта',ukr:'Укрпошта',meest:'Meest пошта'};
        const payMethods=['Готівка','Оплата банківською картою','Google Pay'];
        function renderOrderLine(item) {
          const product=PRODUCTS_DATA[item.id];
          const min=product ? CartManager.getMinQty(product) : 1;
          return `<div class="admin-edit-line" data-line-id="${esc(item.id)}" data-line-price="${Number(item.price)||0}">
            <span class="admin-edit-line__title">${esc(item.title)}</span>
            <span class="admin-edit-line__price">${formatMoney(item.price)} / шт.</span>
            <label>Кількість <input class="admin-edit-qty" type="number" min="${min}" max="1000000" step="1" value="${Number(item.qty)||min}"></label>
            <button type="button" class="admin-btn admin-btn--danger" data-remove-order-line>Видалити</button>
          </div>`;
        }
        function renderOrderEditor(ord) {
          const field=(name,value,label,type='text')=>`<label class="admin-edit-field">${label}<input name="${name}" type="${type}" value="${esc(value||'')}" required></label>`;
          const select=(name,value,opts)=>`<label class="admin-edit-field">${name==='carrierKey'?'Служба доставки':'Спосіб оплати'}<select name="${name}" class="admin-select">${opts.map(([key,label])=>`<option value="${esc(key)}" ${key===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
          return `<form class="admin-order-editor" data-order-editor="${esc(ord.orderId)}">
            <h3>Редагування замовлення #${esc(ord.orderId)}</h3>
            <div class="admin-edit-grid">
              ${field('firstName',ord.customer?.firstName,'Ім’я')}
              ${field('lastName',ord.customer?.lastName,'Прізвище')}
              ${field('phone',ord.customer?.phone,'Телефон','tel')}
              ${field('email',ord.customer?.email,'E-mail','email')}
              <label class="admin-edit-field">Місто
                <input name="city" list="admin-city-list-${esc(ord.orderId)}" value="${esc(ord.delivery?.city||'')}" autocomplete="off" required data-admin-city>
                <datalist id="admin-city-list-${esc(ord.orderId)}">${AdminDelivery.cityOptions().map(city=>`<option value="${esc(city)}"></option>`).join('')}</datalist>
              </label>
              <label class="admin-edit-field">Відділення / адреса
                <select name="branchChoice" class="admin-select" data-admin-branch-select required></select>
                <input name="branchManual" type="text" placeholder="Введіть фактичну адресу вручну" data-admin-branch-manual hidden>
                <span class="admin-delivery-hint" data-admin-delivery-hint aria-live="polite"></span>
              </label>
              ${select('carrierKey',ord.delivery?.carrierKey,Object.entries(CARRIERS))}
              <label class="admin-edit-field">Тип доставки
                <select name="deliveryType" class="admin-select">
                  <option value="Відділення" ${ord.delivery?.type==='Відділення'?'selected':''}>Відділення</option>
                  <option value="Поштомат" ${ord.delivery?.type==='Поштомат'?'selected':''}>Поштомат</option>
                </select>
              </label>
              ${select('payment',ord.payment,payMethods.map(x=>[x,x]))}
            </div>
            <h4>Товари замовлення</h4>
            <div class="admin-edit-lines">${(ord.items||[]).map(renderOrderLine).join('')}</div>
            <div class="admin-edit-add-row">
              <select class="admin-select" data-add-product-select>
                ${Object.values(PRODUCTS_DATA).filter(p=>p.inStock).map(p=>`<option value="${esc(p.id)}">${esc(p.title)} — ${formatMoney(p.numericPrice)}</option>`).join('')}
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
            const card = [...ordersContainer.querySelectorAll('.admin-order-card')]
              .find((element) => element.dataset.orderId === orderId);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
        function saveOrderEditor(form) {
          const id=form.dataset.orderEditor;
          const ord=loadAllOrders().find(o=>String(o.orderId)===id);
          if(!ord || ord.statusCode!=='processing') throw new Error('Редагування дозволено лише на стадії «В обробці»');
          const data=new FormData(form);
          const customer={firstName:String(data.get('firstName')||'').trim(), lastName:String(data.get('lastName')||'').trim(),phone:String(data.get('phone')||'').trim(), email:String(data.get('email')||'').trim()};
          const carrierKey=String(data.get('carrierKey')||'');
          const deliveryType=String(data.get('deliveryType')||'');
          if(!['Відділення','Поштомат'].includes(deliveryType)) throw new Error('Невірний тип доставки');
          const branchChoice=String(data.get('branchChoice')||'');
          const branch=branchChoice==='__manual__' ? String(data.get('branchManual')||'').trim() : branchChoice;
          const delivery={...ord.delivery,city:String(data.get('city')||'').trim(),branch,type:deliveryType,carrierKey,carrierName:CARRIERS[carrierKey]||''};
          const payment=String(data.get('payment')||'');
          if(!payMethods.includes(payment)) throw new Error('Некоректний спосіб оплати');
          const items=[...form.querySelectorAll('[data-line-id]')].map(el=>{
            const product=PRODUCTS_DATA[el.dataset.lineId];
            const original=(ord.items||[]).find(i=>i.id===el.dataset.lineId);
            if(!product && !original) throw new Error('Товар не знайдено');
            const qty=Number(el.querySelector('.admin-edit-qty').value);
            const min=product ? CartManager.getMinQty(product) : 1;
            if(!Number.isInteger(qty) || qty<min) throw new Error(`Мінімальна кількість для ${product?.title||original?.title}: ${min}`);
            const price=Number(el.dataset.linePrice);
            return {id:el.dataset.lineId,title:product?.title||original.title,price,qty,image:product?.image||original.image};
          });
          if(new Set(items.map(i=>i.id)).size!==items.length) throw new Error('Товар повторюється в замовленні');
          const subtotal=OrderFinance.validateEdits(customer,delivery,items);
          // Switching payment method invalidates any previously verified payment for this method.
          const changedPayment=payment!==ord.payment || subtotal!==Number(ord.subtotal);
          const updated={...ord,customer,delivery,payment,items,subtotal,
            ...(changedPayment ? {paymentStatus:'unpaid',paymentVerification:null} : {})};
          writeOrder(updated);
          editingOrderIds.delete(id);
          renderDashboard();
          scrollToOrderCard(id);
          showUndoToast(`Дані замовлення #${id} оновлено`,()=>writeOrder(ord));
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
          const totalRevenue = OrderFinance.total(allOrders);

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
                  const passed = ord.statusCode !== "canceled" && currentStepIdx > idx;
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
                        <span class="admin-payment-state admin-payment-state--${OrderFinance.paymentStatus(ord)}">
                          ${esc(OrderFinance.paymentLabel(ord))}
                        </span>
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
                        <div><strong>Точка видачі:</strong> ${esc(ord.delivery?.type||'Відділення')}, ${esc(ord.delivery?.branch)}</div>
                        <div><strong>Оплата:</strong> ${esc(ord.payment)} | <strong>Сума:</strong> ${formatMoney(ord.subtotal)}</div>
                        ${ord.ttn ? `<div><strong>ТТН:</strong> <span style="font-family: var(--font-mono); font-weight: 700; color: #059669;">${esc(ord.ttn)}</span></div>` : ""}
                      </div>
                    </div>

                    <div class="admin-order-items">
                      ${itemsHtml}
                    </div>
                    ${ord.statusCode==='processing' ? `
                      <div class="admin-edit-actions">
                        <button class="admin-btn admin-btn--outline" data-edit-order="${esc(ord.orderId)}" type="button">
                          ${editingOrderIds.has(String(ord.orderId)) ? 'Закрити редагування' : 'Редагувати дані, доставку й товари'}
                        </button>
                      </div>
                      ${editingOrderIds.has(String(ord.orderId)) ? renderOrderEditor(ord) : ''}
                    ` : ''}

                    ${!editingOrderIds.has(String(ord.orderId)) ? `<div class="admin-order-card__controls">
                      ${bottomControlsHtml}
                    </div>` : ''}
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

        // Dependent city / carrier / delivery-type branch dropdown.
        async function refreshAdminBranches(form) {
          const city=form.elements.city.value.trim();
          const carrier=form.elements.carrierKey.value;
          const type=form.elements.deliveryType.value;
          const branchSelect=form.querySelector('[data-admin-branch-select]');
          const manual=form.querySelector('[data-admin-branch-manual]');
          const hint=form.querySelector('[data-admin-delivery-hint]');
          if(!branchSelect || !manual || !hint) return;
          const revision=String(Number(form.dataset.deliveryRevision||0)+1);
          form.dataset.deliveryRevision=revision;
          const order=loadAllOrders().find(o=>String(o.orderId)===form.dataset.orderEditor);
          const previousValue=branchSelect.value || order?.delivery?.branch || '';
          const sameDestination=city===order?.delivery?.city && carrier===order?.delivery?.carrierKey && type===(order?.delivery?.type||'Відділення');
          const suggestions=AdminDelivery.orderBranches(loadAllOrders(),city,carrier,type);
          const original=sameDestination ? (order?.delivery?.branch||'') : '';
          const entries=AdminDelivery.uniqueBranches([original,...suggestions]);
          function populate(options,verified=false){
            const chosen=options.includes(previousValue) && sameDestination ? previousValue : original;
            branchSelect.replaceChildren();
            const addOption=(value,label)=>{
              const opt=document.createElement('option');opt.value=value;opt.textContent=label;branchSelect.append(opt);
            };
            addOption('','Оберіть відділення / адресу');
            options.forEach(x=>addOption(x,x));
            addOption('__manual__','Ввести адресу вручну');
            branchSelect.value=chosen && options.includes(chosen) ? chosen : '__manual__';
            manual.value=branchSelect.value==='__manual__' ? (sameDestination?previousValue:'') : '';
            manual.hidden=branchSelect.value!=='__manual__';
            manual.required=!manual.hidden;
            if(!verified)hint.textContent=options.length?'Адреси з попередніх замовлень (актуальність не перевірена).':'Довідник відділень не підключено. Введіть адресу вручну.';
          }
          populate(entries);
          try {
            const verified=await AdminDelivery.fetchVerifiedBranches(city,carrier,type);
            if(form.dataset.deliveryRevision!==revision || !form.isConnected)return;
            if(verified?.length){
              const typedManual=branchSelect.value==='__manual__'?manual.value.trim():'';
              populate(AdminDelivery.uniqueBranches(verified),true);
              if(typedManual){branchSelect.value='__manual__';manual.hidden=false;manual.required=true;manual.value=typedManual;}
              hint.textContent='Актуальні адреси від служби доставки.';
            }
          }catch(err){ if(form.dataset.deliveryRevision===revision)hint.textContent='Довідник недоступний. Перевірте адресу вручну.'; }
        }
        ordersContainer.addEventListener('change',e=>{
          const form=e.target.closest('[data-order-editor]');if(!form)return;
          if(e.target.matches('[name="branchChoice"]')){
            const manual=form.querySelector('[data-admin-branch-manual]');
            manual.hidden=e.target.value!=='__manual__';
            manual.required=!manual.hidden;
            if(!manual.hidden)manual.focus();
          }
          if(e.target.matches('[name="city"], [name="carrierKey"], [name="deliveryType"]'))refreshAdminBranches(form);
        });
        ordersContainer.addEventListener('input',e=>{
          if(!e.target.matches('[data-admin-city]'))return;
          const form=e.target.closest('[data-order-editor]');
          if(form) refreshAdminBranches(form);
        });

        // Order Actions Click Handler
        ordersContainer.addEventListener("click", (e) => {
          const card = e.target.closest(".admin-order-card");
          if (!card) return;
          const orderId = String(card.getAttribute("data-order-id"));
          const ttnInput = card.querySelector(".order-ttn-input");
          const currentTtn = ttnInput ? ttnInput.value.trim() : undefined;

          const editOrderBtn=e.target.closest('[data-edit-order]');
          if(editOrderBtn) {
            if(!loadAllOrders().some(o=>String(o.orderId)===orderId&&o.statusCode==='processing')) return;
            if(editingOrderIds.has(orderId)) editingOrderIds.delete(orderId);
            else editingOrderIds.add(orderId);
            renderDashboard();
            const newlyOpened=[...ordersContainer.querySelectorAll('[data-order-editor]')]
              .find(form=>form.dataset.orderEditor===orderId);
            if(newlyOpened)refreshAdminBranches(newlyOpened);
            return;
          }
          if (e.target.closest('[data-cancel-order-edit]')) {
            editingOrderIds.delete(orderId);
            renderDashboard();
            scrollToOrderCard(orderId);
            return;
          }
          const addLineBtn=e.target.closest('[data-add-order-line]');
          if(addLineBtn) {
            const editor=card.querySelector('[data-order-editor]');
            const id=editor?.querySelector('[data-add-product-select]')?.value;
            const product=PRODUCTS_DATA[id];
            if(!editor||!product||!product.inStock) return;
            const existing=Array.from(editor.querySelectorAll('[data-line-id]')).find(el=>el.dataset.lineId===id);
            const min=CartManager.getMinQty(product);
            if(existing) existing.querySelector('.admin-edit-qty').value=Number(existing.querySelector('.admin-edit-qty').value)+min;
            else editor.querySelector('.admin-edit-lines').insertAdjacentHTML('beforeend',renderOrderLine({id,title:product.title,price:product.numericPrice,qty:min}));
            return;
          }
          const removeLineBtn=e.target.closest('[data-remove-order-line]');
          if(removeLineBtn){removeLineBtn.closest('[data-line-id]')?.remove();return;}

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

        ordersContainer.addEventListener('submit',(e)=>{
          const form=e.target.closest('[data-order-editor]');if(!form)return;
          e.preventDefault();
          try{saveOrderEditor(form);}catch(err){showUndoToast(err.message,null);}
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

        // Catalog Inventory / Media (localStorage prototype).
        const productsTbody=document.getElementById('admin-products-tbody');
        const addProductForm=document.getElementById('admin-new-product-form');
        const productDrafts=new Map();
        const detailsDirty=new Set();
        const detailOpen=new Set();
        AstelProductEditor.bind(addProductForm);
        const options=(items,selected)=>Object.entries(items).map(([key,label])=>
          `<option value="${esc(key)}" ${key===selected?'selected':''}>${esc(label)}</option>`).join('');

        function initialDraft(p) {
          return {price:String(p.numericPrice),category:p.category,
            saleTermsCode:p.saleTermsCode,inStock:p.inStock,images:[...p.images]};
        }
        function getDraft(id) {
          return productDrafts.get(id) || initialDraft(PRODUCTS_DATA[id]);
        }
        function isDirty(id,draft) {
          const p=PRODUCTS_DATA[id];if(!p)return false;
          return draft.price !== String(p.numericPrice) || draft.category!==p.category ||
            draft.saleTermsCode!==p.saleTermsCode || draft.inStock!==p.inStock ||
            JSON.stringify(draft.images)!==JSON.stringify(p.images);
        }
        function setDraft(id,draft) {
          if(isDirty(id,draft)) productDrafts.set(id,draft);
          else productDrafts.delete(id);
        }
        function readRowDraft(row) {
          const id=row.dataset.productId;
          const old=getDraft(id);
          return {...old,price:row.querySelector('.admin-price-input').value,
            category:row.querySelector('[data-product-category]').value,
            saleTermsCode:row.querySelector('[data-product-terms]').value};
        }
        function feedback(row) {
          const dirty=productDrafts.has(row.dataset.productId)||detailsDirty.has(row.dataset.productId);
          row.classList.toggle('has-pending-changes',dirty);
          const button=row.querySelector('[data-save-product]');
          button.disabled=!dirty;
          const metaRow=row.nextElementSibling;
          const notice=metaRow?.matches('.admin-inventory-meta-row')
            ? metaRow.querySelector('.admin-inventory-unsaved') : null;
          metaRow?.classList.toggle('has-pending-changes', dirty);
          if(notice)notice.hidden=!dirty;
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
                  ${images.map((src,i)=>`
                    <div class="admin-photo-item ${i===0?'is-main':''}" role="listitem"
                      data-photo-index="${i}" draggable="true" tabindex="0"
                      aria-label="Фото ${i+1}${i===0?', головне':''}. Перетягніть або натисніть Alt зі стрілкою для зміни порядку">
                      <div class="admin-photo-item__preview">
                        <img src="${esc(src)}" alt="Фото ${i+1}: ${esc(p.title)}" draggable="false" />
                        <button type="button" class="admin-photo-item__remove" data-photo-remove="${i}"
                          aria-label="Видалити фото ${i+1}" title="Видалити фото">×</button>
                      </div>
                      <div class="admin-photo-item__footer">
                        <span class="admin-photo-item__number">${i===0?'Головне':`Фото ${i+1}`}</span>
                        <span class="admin-photo-item__handle" aria-hidden="true" title="Перетягніть для зміни порядку">⠿</span>
                      </div>
                    </div>`).join('')}
                  ${images.length<12?`
                    <label class="admin-photo-add-tile" title="Додати фотографії до товару">
                      <input class="admin-photo-add-tile__input" type="file"
                        accept="image/png,image/jpeg,image/webp" multiple data-photo-upload="${esc(p.id)}"
                        aria-label="Додати фото до товару ${esc(p.title)}" />
                      <span class="admin-photo-add-tile__icon" aria-hidden="true">+</span>
                      <span>Додати фото</span>
                    </label>`:''}
                </div>
                <p class="admin-photo-warning">Зображення зберігаються лише в цьому браузері до підключення сервера.</p>
              </section>`;
        }
        function renderDetailsRow(p) {
          return `<tr class="admin-product-details-row" data-product-details-id="${esc(p.id)}" ${detailOpen.has(p.id)?'':'hidden'}>
            <td colspan="6"><form class="admin-product-details-form admin-language-editor" data-editor-language="uk" data-edit-product="${esc(p.id)}">
              <h3>Редагування товару — ${esc(p.title)}</h3>
              <p class="admin-photo-warning">Фотографії, опис, характеристики та PDF залишаються чернеткою до натискання «Оновити» у рядку товару.</p>
              ${renderPhotoEditor(p,getDraft(p.id).images)}
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
                <label data-editor-field-lang="uk">Назва товару
                  <input name="title" type="text" maxlength="200" placeholder="Введіть назву товару українською" /></label>
                <label data-editor-field-lang="en">Назва товару
                  <input name="titleEn" type="text" maxlength="200" placeholder="Перекладіть назву товару англійською" /></label>
              </div>
              <div class="admin-description-grid">
                <label class="admin-new-product-description" data-editor-field-lang="uk">Опис товару українською
                  <textarea name="description" rows="5"></textarea></label>
                <label class="admin-new-product-description" data-editor-field-lang="en">Опис товару англійською
                  <textarea name="descriptionEn" rows="5"></textarea></label>
              </div>
              <div class="admin-new-product-extras">
                <section class="admin-extra-block"><div class="admin-extra-heading"><div><h3>Таблиці характеристик</h3><p>Назви й значення двома мовами; свої назви таблиць вводяться прямо у формі.</p></div>
                  <button type="button" class="admin-btn admin-btn--outline" data-add-spec-section>+ Додати таблицю</button></div>
                  <div data-spec-sections class="admin-spec-sections"></div></section>
                <section class="admin-extra-block"><div class="admin-extra-heading"><div><h3>Специфікації та документація</h3><p>Можна додавати, видаляти та замінювати PDF-файли.</p></div>
                  <button type="button" class="admin-btn admin-btn--outline" data-add-doc-row>+ Додати PDF</button></div>
                  <div data-doc-rows class="admin-document-rows"></div></section>
              </div><datalist data-custom-spec-names></datalist>
            </form></td></tr>`;
        }
        function detailsForm(id){
          return Array.from(productsTbody.querySelectorAll('[data-edit-product]')).find(f=>f.dataset.editProduct===id);
        }
        function showDetails(id){
          const target=Array.from(productsTbody.querySelectorAll('[data-product-details-id]')).find(row=>row.dataset.productDetailsId===id);
          if(!target)return;
          const opening=!detailOpen.has(id);
          if(opening){
            detailOpen.add(id);target.hidden=false;
            const form=detailsForm(id);
            if(form && !form.dataset.initialized){AstelProductEditor.bind(form);AstelProductEditor.populate(form,PRODUCTS_DATA[id]);form.dataset.initialized='true';}
          }else{detailOpen.delete(id);target.hidden=true;}
          const button=Array.from(productsTbody.querySelectorAll('[data-toggle-product-details]')).find(b=>b.dataset.toggleProductDetails===id);
          if(button){button.innerHTML=opening?'<span aria-hidden="true">▴</span> Сховати редактор':'<span aria-hidden="true">✎</span> Редагувати товар';button.setAttribute('aria-expanded',String(opening));}
        }
        function cleanupRemovedPdfFiles(previousDocs){
          if(typeof AstelProductFiles==='undefined')return;
          const retained=new Set(Object.values(PRODUCTS_DATA).flatMap(p=>(p.docs||[]).map(d=>d.url)));
          for(const d of previousDocs||[]){
            if(AstelProductFiles.isRef(d.url) && !retained.has(d.url))
              AstelProductFiles.remove(d.url).catch(()=>{});
          }
        }
        function renderCategoryManager() {
          const list=document.getElementById('admin-category-list');
          if(list) list.innerHTML=Object.entries(CatalogManager.CATEGORIES).map(([key,name])=>{
            const count=Object.values(PRODUCTS_DATA).filter(p=>p.category===key).length;
            return `<div class="admin-category-chip">
              <span>${esc(name)} <small>${count}</small></span>
              <button type="button" data-delete-category="${esc(key)}" aria-label="Видалити категорію ${esc(name)}"
                title="${count?'Спочатку перенесіть товари до іншої категорії':'Видалити категорію'}" ${count?'disabled':''}>×</button>
            </div>`;
          }).join('');
          const select=addProductForm?.querySelector('[name="category"]');
          if(select) {
            const selected=select.value;
            select.innerHTML=options(CatalogManager.CATEGORIES,selected);
            if(CatalogManager.CATEGORIES[selected])select.value=selected;
          }
        }
        document.getElementById('admin-add-category-form')?.addEventListener('submit',e=>{
          e.preventDefault();
          const form=e.currentTarget;
          try {
            CatalogManager.addCategory(form.elements.uk.value,form.elements.en.value);
            form.reset();renderProductsTable();showUndoToast('Категорію додано',null);
          }catch(err){showUndoToast(err.message,null);}
        });
        document.getElementById('admin-category-list')?.addEventListener('click',async e=>{
          const btn=e.target.closest('[data-delete-category]');if(!btn)return;
          const code=btn.dataset.deleteCategory;
          if([...productDrafts.values()].some(d=>d.category===code)) {
            showUndoToast('Є незбережені зміни категорії в таблиці товарів',null);return;
          }
          const name=CatalogManager.CATEGORIES[code];
          if(!await confirmAdminDelete({title:'Видалити категорію?', message:'Категорію буде видалено з каталогу. Цю дію неможливо скасувати.', subject:name}))return;
          try{CatalogManager.deleteCategory(code);renderProductsTable();showUndoToast('Категорію видалено',null);}
          catch(err){showUndoToast(err.message,null);}
        });
        function renderProductsTable() {
          // Detach already-open editors to preserve uncommitted text and selected File objects.
          const savedForms=new Map();
          productsTbody.querySelectorAll('[data-edit-product][data-initialized="true"]').forEach(form=>{
            savedForms.set(form.dataset.editProduct,form);form.remove();
          });
          const items=Object.values(PRODUCTS_DATA);
          for(const id of productDrafts.keys()) if(!PRODUCTS_DATA[id]) productDrafts.delete(id);
          document.getElementById('tab-count-products').textContent=items.length;
          renderCategoryManager();
          productsTbody.innerHTML=items.map(p=>{
            const draft=getDraft(p.id),dirty=productDrafts.has(p.id)||detailsDirty.has(p.id);
            return `<tr class="admin-inventory-product-row ${dirty?'has-pending-changes':''}" data-product-id="${esc(p.id)}">
              <td><a href="product.html?id=${encodeURIComponent(p.id)}" class="admin-product-link">${esc(p.title)}</a></td>
              <td><select class="admin-select admin-inventory-select" data-product-category aria-label="Категорія">${options(CatalogManager.CATEGORIES,draft.category)}</select></td>
              <td><select class="admin-select admin-inventory-select" data-product-terms aria-label="Умови продажу">${options(CatalogManager.SALE_TERMS,draft.saleTermsCode)}</select></td>
              <td><input type="number" class="admin-price-input" value="${esc(draft.price)}" min="1" max="99999999" step="1" aria-label="Ціна" /></td>
              <td><button type="button" class="stock-toggle-btn ${draft.inStock?'is-instock':'is-outstock'}" data-toggle-stock="${esc(p.id)}">${draft.inStock?'● В наявності':'○ Немає в наявності'}</button></td>
              <td><div class="admin-inventory-actions">
                <button type="button" class="admin-btn admin-btn--outline" data-save-product="${esc(p.id)}" ${dirty?'':'disabled'}>Оновити</button>
                <button type="button" class="admin-inventory-delete" data-delete-product="${esc(p.id)}" title="Видалити товар" aria-label="Видалити товар ${esc(p.title)}"><img src="assets/images/delete.svg" alt="" /></button>
              </div></td>
            </tr>
            <tr class="admin-inventory-meta-row ${dirty?'has-pending-changes':''}" data-product-meta-id="${esc(p.id)}">
              <td colspan="6"><div class="admin-inventory-meta-bar">
                <button type="button" class="admin-product-content-toggle" data-toggle-product-details="${esc(p.id)}"
                  aria-expanded="${detailOpen.has(p.id)}"><span aria-hidden="true">${detailOpen.has(p.id)?'▴':'✎'}</span> ${detailOpen.has(p.id)?'Сховати редактор':'Редагувати товар'}</button>
                <span class="admin-inventory-unsaved" role="status" ${dirty?'':'hidden'}>Не збережено</span>
              </div></td>
            </tr>${renderDetailsRow(p)}`;
          }).join('');
          savedForms.forEach((form,id)=>{
            const row=Array.from(productsTbody.querySelectorAll('[data-product-details-id]')).find(r=>r.dataset.productDetailsId===id);
            row?.querySelector('form')?.replaceWith(form);
            // Keep the unsaved text/File objects, but refresh the gallery to reflect
            // changes made by dragging, uploading or removing a photo.
            const gallery=form.querySelector('[data-product-photos]');
            if(gallery && PRODUCTS_DATA[id]) {
              const template=document.createElement('template');
              template.innerHTML=renderPhotoEditor(PRODUCTS_DATA[id],getDraft(id).images).trim();
              gallery.replaceWith(template.content.firstElementChild);
            }
          });
        }
        async function compressImage(file) {
          if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Підтримуються PNG, JPG та WebP');
          if(file.size>6*1024*1024) throw new Error('Фото не може перевищувати 6 МБ');
          const objectUrl=URL.createObjectURL(file);
          try {
            const img=new Image();
            await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Не вдалося відкрити зображення'));img.src=objectUrl;});
            for(const dimension of [1200,960,720,560]) {
              const scale=Math.min(1,dimension/Math.max(img.naturalWidth,img.naturalHeight));
              const canvas=document.createElement('canvas');
              canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
              canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
              const ctx=canvas.getContext('2d');
              ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
              ctx.drawImage(img,0,0,canvas.width,canvas.height);
              for(const quality of [.8,.67,.5]) {
                const data=canvas.toDataURL('image/jpeg',quality);
                if(CatalogManager.validImageSource(data)) return data;
              }
            }
            throw new Error('Фото завелике для локального збереження');
          } finally{URL.revokeObjectURL(objectUrl);}
        }
        async function imagesFromInput(input) {
          const files=Array.from(input?.files||[]);
          const images=[];
          for(const file of files) images.push(await compressImage(file));
          return images;
        }
        productsTbody.addEventListener('input',(e)=>{
          const form=e.target.closest('[data-edit-product]');
          if(form){detailsDirty.add(form.dataset.editProduct);
            const id=form.dataset.editProduct;
            const row=Array.from(productsTbody.querySelectorAll('tr[data-product-id]')).find(r=>r.dataset.productId===id);
            if(row)feedback(row);return;}
          const row=e.target.closest('tr[data-product-id]');
          if(!row || !e.target.matches('.admin-price-input'))return;
          setDraft(row.dataset.productId,readRowDraft(row));feedback(row);
        });
        productsTbody.addEventListener('change',(e)=>{
          const form=e.target.closest('[data-edit-product]');
          if(form){detailsDirty.add(form.dataset.editProduct);
            const id=form.dataset.editProduct;
            const row=Array.from(productsTbody.querySelectorAll('tr[data-product-id]')).find(r=>r.dataset.productId===id);
            if(row)feedback(row);return;}
          const row=e.target.closest('tr[data-product-id]');
          if(!row || !e.target.matches('[data-product-category],[data-product-terms],.admin-price-input'))return;
          setDraft(row.dataset.productId,readRowDraft(row));feedback(row);
        });
        productsTbody.addEventListener('click',async(e)=>{
          const form=e.target.closest('[data-edit-product]');
          if(form && e.target.closest('button') && !e.target.closest('[data-editor-lang]')){
            const id=form.dataset.editProduct;
            detailsDirty.add(id);
            const parent=Array.from(productsTbody.querySelectorAll('tr[data-product-id]')).find(r=>r.dataset.productId===id);
            if(parent)feedback(parent);
          }
          const btn=e.target.closest('button');if(!btn)return;
          const row=btn.closest('tr[data-product-id]');
          if(btn.hasAttribute('data-toggle-product-details')){showDetails(btn.dataset.toggleProductDetails);return;}
          if(btn.hasAttribute('data-toggle-stock')) {
            const id=btn.dataset.toggleStock,draft=readRowDraft(row);
            draft.inStock=!draft.inStock;
            setDraft(id,draft);renderProductsTable();
          } else if(btn.hasAttribute('data-save-product') && row){
            const id=row.dataset.productId;
            const draft=readRowDraft(row);
            const price=CatalogManager.validPrice(draft.price);
            if(price==null){const input=row.querySelector('.admin-price-input');input.focus();input.setAttribute('aria-invalid','true');showUndoToast('Вкажіть цілу ціну від 1 до 99 999 999 грн',null);return;}
            const previous=getDraft(id);
            const form=detailsForm(id);
            const patch={price,category:draft.category,saleTermsCode:draft.saleTermsCode,
                inStock:draft.inStock,images:[...draft.images]};
            const button=btn;button.disabled=true;
            try{
              if(detailsDirty.has(id)&&form?.dataset.initialized){
                if(!AstelProductEditor.validateTranslations(form)){
                  showUndoToast('Потрібен переклад англійською — заповніть підсвічені поля',null);
                  return;
                }
                Object.assign(patch,AstelProductEditor.extractProductNames(form));
                Object.assign(patch,AstelProductEditor.extractDescriptions(form));
                patch.specSections=AstelProductEditor.extractSections(form);
                patch.docs=await AstelProductEditor.extractDocuments(form);
                // Existing built-in rows are represented in the new unified editor.
                patch.techSpecs=[];patch.generalSpecs=[];
              }
              const oldDocs=[...(PRODUCTS_DATA[id]?.docs||[])];
              CatalogManager.updateProduct(id,patch);
              cleanupRemovedPdfFiles(oldDocs);
              if(form?.dataset.initialized)AstelProductEditor.populate(form,PRODUCTS_DATA[id]);
              productDrafts.delete(id);detailsDirty.delete(id);
              renderProductsTable();showUndoToast('Товар оновлено',null);
            }catch(err){setDraft(id,previous);renderProductsTable();showUndoToast(err.name==='QuotaExceededError'?'Недостатньо місця в localStorage':err.message,null);}
            finally{button.disabled=false;}
          } else if(btn.hasAttribute('data-delete-product')) {
            const id=btn.dataset.deleteProduct,p=PRODUCTS_DATA[id];if(!p)return;
            if(!await confirmAdminDelete({title:'Видалити товар?', message:'Товар буде видалено з каталогу. Цю дію неможливо скасувати.', subject:p.title})) return;
            try {const oldDocs=[...(p.docs||[])];productDrafts.delete(id);detailsDirty.delete(id);detailOpen.delete(id);CatalogManager.deleteProduct(id);cleanupRemovedPdfFiles(oldDocs);renderProductsTable();showUndoToast('Товар видалено з каталогу',null);}
            catch(err){showUndoToast(err.message,null);}
          } else if(btn.hasAttribute('data-photo-remove')) {
            const photosRow=btn.closest('[data-product-photos]');
            const id=photosRow?.dataset.productPhotos,p=PRODUCTS_DATA[id];if(!p)return;
            const draft={...getDraft(id),images:[...getDraft(id).images]};
            const index=Number(btn.dataset.photoRemove);
            if(!Number.isInteger(index)||index<0||index>=draft.images.length)return;
            if(draft.images.length===1){showUndoToast('Потрібно залишити хоча б одне фото',null);return;}
            draft.images.splice(index,1);setDraft(id,draft);renderProductsTable();
          }
        });
        AstelPhotoGallery.mount(productsTbody, ({id,from,target,after,focusMoved=false}) => {
          const product=PRODUCTS_DATA[id];if(!product)return;
          const old=getDraft(id), result=AstelPhotoGallery.moveImages(old.images,from,target,after);
          if(!result.changed)return;
          setDraft(id,{...old,images:result.images});renderProductsTable();
          if(focusMoved) {
            const gallery=Array.from(productsTbody.querySelectorAll('[data-product-photos]'))
              .find(row=>row.dataset.productPhotos===id);
            gallery?.querySelector(`.admin-photo-item[data-photo-index="${result.newIndex}"]`)?.focus();
          }
        });
        productsTbody.addEventListener('change',async(e)=>{
          const input=e.target.closest('[data-photo-upload]');if(!input)return;
          const id=input.dataset.photoUpload,p=PRODUCTS_DATA[id];if(!p)return;
          try{
            const files=await imagesFromInput(input);
            const draft=getDraft(id),images=[...draft.images,...files];
            if(images.length>12) throw new Error('Максимум 12 фото');
            setDraft(id,{...draft,images});renderProductsTable();
          }catch(err){showUndoToast(err.message,null);}
        });
        addProductForm?.addEventListener('submit',async(e)=>{
          e.preventDefault();
          const button=addProductForm.querySelector('[type="submit"]');button.disabled=true;
          try {
            if(!AstelProductEditor.validateTranslations(addProductForm)){
              showUndoToast('Заповніть англійські переклади у виділених полях',null);
              return;
            }
            const data=new FormData(addProductForm);
            const specSections=AstelProductEditor.extractSections(addProductForm);
            const docs=await AstelProductEditor.extractDocuments(addProductForm);
            const photoFiles=AstelProductEditor.getPhotos(addProductForm);
            if(!photoFiles.length) throw new Error('Додайте принаймні одну фотографію');
            const photos=[];for(const file of photoFiles)photos.push(await compressImage(file));
            const newProduct=CatalogManager.addProduct({
              id:String(data.get('id')||'').trim(),
              ...AstelProductEditor.extractProductNames(addProductForm),
              description:String(data.get('description')||'').trim(),
              descriptionEn:String(data.get('descriptionEn')||'').trim(),
              price:String(data.get('price')||'').trim(),category:String(data.get('category')||''),
              saleTermsCode:String(data.get('saleTermsCode')||''),inStock:!!data.get('inStock'),images:photos,
              specSections,docs,
            });
            addProductForm.reset();AstelProductEditor.reset(addProductForm);renderProductsTable();
            showUndoToast(`Додано товар: ${newProduct.title}`,null);
          }catch(err){showUndoToast(err.name==='QuotaExceededError'?'Бракує місця в localStorage для фото / PDF':err.message,null);}
          finally{button.disabled=false;}
        });
        window.addEventListener('astel:catalog-updated',()=>renderProductsTable());

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
