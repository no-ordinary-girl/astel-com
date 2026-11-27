/* Astel-com: local-only payment reconciliation. Manual records are NOT provider verification. */
(function (root) {
  "use strict";
  const KEY = "astelkom_order_payments_v1";
  const METHODS = Object.freeze({ bank: "Банківський переказ", cash: "Готівка", cod: "Післяплата", other: "Інший спосіб" });
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const storage = (provided) => provided || root.localStorage;
  const read = (store) => {
    try {
      const data = JSON.parse(storage(store).getItem(KEY) || "[]");
      return Array.isArray(data) ? data.filter((r) => r && r.id && r.orderId).slice(0, 3000) : [];
    } catch { return []; }
  };
  const entriesFor = (orderId, store) => read(store).filter((r) => r.orderId === String(orderId));
  function toCents(value) {
    const input = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(input)) throw new Error("Введіть додатну суму у гривнях (до 2 знаків після коми)");
    const cents = Math.round(Number(input) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 999999999999) throw new Error("Некоректна сума платежу");
    return cents;
  }
  function legacyVerifiedCents(order) {
    const v = order?.paymentVerification;
    if (v?.verified === true && v.provider && v.orderId === String(order.orderId || order.id) && v.currency === "UAH" && Number(v.amount) === Number(order.subtotal))
      return Math.max(0, Math.round(Number(v.amount) * 100));
    return 0;
  }
  function summary(order, store) {
    const entries = entriesFor(order?.orderId || order?.id, store);
    const total = Math.max(0, Math.round(Number(order?.subtotal || 0) * 100));
    const confirmed = entries.filter((r) => r.status === "confirmed");
    const received = confirmed.reduce((sum, r) => sum + (r.type === "refund" ? -r.amountCents : r.amountCents), legacyVerifiedCents(order));
    const pending = entries.filter((r) => r.status === "pending" && r.type === "payment").reduce((sum, r) => sum + r.amountCents, 0);
    return { total, received, remaining: Math.max(0, total - received), overpaid: Math.max(0, received - total), pending, entries, legacyVerified: legacyVerifiedCents(order) > 0 };
  }
  function status(order, store) {
    const s = summary(order, store);
    if (s.received > s.total) return "overpaid";
    if (s.total > 0 && s.received === s.total) return "paid";
    if (s.received > 0) return "partial";
    if (s.pending > 0) return "pending";
    return /готівк|cash/i.test(String(order?.payment || "")) ? "cash-on-delivery" : "unpaid";
  }
  // A pending record does not affect the balance. A manager-confirmed record
  // is written in one operation, eliminating the old add-then-confirm workflow.
  function createRecord(order, payload, nextStatus, store) {
    requireActiveOrder(order);
    const orderId = String(order?.orderId || "");
    if (!orderId) throw new Error("Замовлення не знайдено");
    const type = String(payload.type);
    if (!["payment", "refund"].includes(type)) throw new Error("Невідомий тип платежу");
    if (!Object.hasOwn(METHODS, payload.method)) throw new Error("Оберіть спосіб оплати");
    if (!["pending", "confirmed"].includes(nextStatus)) throw new Error("Невірний статус запису");
    const amountCents = toCents(payload.amount);
    if (type === "refund" && summary(order, store).received < amountCents)
      throw new Error("Сума повернення перевищує підтверджене надходження");
    const now = Date.now();
    const entry = {
      id: `pay-${now}-${Math.random().toString(36).slice(2, 9)}`, orderId, type, amountCents,
      status: nextStatus, method: payload.method,
      reference: String(payload.reference || "").trim().slice(0, 80),
      note: String(payload.note || "").trim().slice(0, 500),
      createdBy: "Сергій", createdAt: now, updatedAt: now,
      ...(nextStatus === "confirmed" ? { confirmedBy: "Сергій" } : {}),
    };
    storage(store).setItem(KEY, JSON.stringify([entry, ...read(store)]));
    return entry;
  }
  function add(order, payload, store) {
    return createRecord(order, payload, "pending", store);
  }
  function recordConfirmed(order, payload, store) {
    return createRecord(order, payload, "confirmed", store);
  }
  function defaultMethod(order) {
    const method = String(order?.payment || "").toLowerCase();
    if (/готів|cash/.test(method)) return "cash";
    if (/післяплат|cod/.test(method)) return "cod";
    if (/банк|карто|pay|переказ/.test(method)) return "bank";
    return "other";
  }
  function changeState(order, entryId, nextStatus, store) {
    requireActiveOrder(order);
    if (!["confirmed", "void"].includes(nextStatus)) throw new Error("Невірний статус запису");
    const all = read(store);
    const existing = all.find((r) => r.id === entryId && r.orderId === String(order?.orderId));
    if (!existing || existing.status === "void") throw new Error("Запис не знайдено або він уже скасований");
    if (nextStatus === "confirmed" && existing.status !== "pending") throw new Error("Цей платіж уже підтверджено");
    const newValue = { ...existing, status: nextStatus, updatedAt: Date.now(), confirmedBy: nextStatus === "confirmed" ? "Сергій" : existing.confirmedBy };
    const hypothetical = all.map((r) => r.id === entryId ? newValue : r);
    const incoming = hypothetical.filter((r) => r.orderId === String(order.orderId) && r.status === "confirmed")
      .reduce((sum, r) => sum + (r.type === "refund" ? -r.amountCents : r.amountCents), legacyVerifiedCents(order));
    if (incoming < 0) throw new Error("Неможливо скасувати надходження, коли вже підтверджено відповідне повернення");
    storage(store).setItem(KEY, JSON.stringify(hypothetical));
    return newValue;
  }
  const format = (cents) => `${(Number(cents || 0) / 100).toLocaleString("uk-UA", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} ₴`;
  const dateTime = (time) => new Date(time).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const STATUS_LABELS = Object.freeze({ confirmed: "Підтверджено менеджером", pending: "Очікує підтвердження", void: "Запис скасовано" });
  const isCanceled = (order) => order?.statusCode === "canceled";
  function requireActiveOrder(order) {
    if (isCanceled(order)) throw new Error("Розрахунки та оплата недоступні для скасованого замовлення");
  }
  function panel(order) {
    if (isCanceled(order)) return `<div class="admin-order-workspace__notice" role="status">
      <strong>Розрахунки та оплата недоступні</strong>
      <p>Замовлення скасовано. Фінансові операції недоступні до його відновлення. Раніше створені платіжні записи збережено.</p>
    </div>`;
    const s = summary(order);
    const entries = [...s.entries].sort((a, b) => b.createdAt - a.createdAt);
    const oid = escape(order.orderId);
    const dueLabel = s.overpaid ? "Переплата" : "Залишок до сплати";
    const quick = s.remaining > 0 && s.pending === 0;
    return `<section class="admin-operations admin-reconciliation" data-reconciliation="${oid}" aria-label="Розрахунки та оплата">
      <div class="admin-operations__heading admin-reconciliation__heading"><div><h3>Розрахунки та оплата</h3><p>Ручне підтвердження менеджером · без перевірки через банк</p></div>
        <div class="admin-operations-actions">
          ${quick ? `<button type="button" class="admin-btn admin-btn--primary" data-payment-full="${oid}">✓ Підтвердити оплату</button>` : ""}
          ${s.remaining > 0 ? `<button type="button" class="admin-btn admin-btn--outline" data-payment-add="${oid}">+ Часткова оплата</button>` : ""}
          ${s.received > 0 ? `<button type="button" class="admin-btn admin-btn--outline" data-payment-refund="${oid}">↩ Повернення коштів</button>` : ""}
        </div></div>
      <div class="admin-reconciliation__balance" aria-label="Поточний баланс замовлення">
        <div><span>Сума замовлення</span><strong>${format(s.total)}</strong></div>
        <div><span>Отримано</span><strong class="admin-reconciliation__received">${format(s.received)}</strong></div>
        <div><span>${dueLabel}</span><strong class="${s.overpaid ? "admin-payment-metrics__overpaid" : ""}">${format(s.overpaid || s.remaining)}</strong></div>
      </div>
      ${order.statusCode === "canceled" && s.received > 0 ? `<p class="admin-payment-pending">Замовлення скасовано, але є підтверджені надходження на ${format(s.received)}. Перевірте потребу повернення коштів.</p>` : ""}
      ${s.pending ? `<p class="admin-payment-pending">Очікують перевірки операції на ${format(s.pending)}. Щоб уникнути подвійного обліку, підтвердіть або скасуйте їх перед швидким підтвердженням повної оплати.</p>` : ""}
      ${s.legacyVerified ? `<p class="admin-payment-pending">Враховано раніше підтверджену оплату на ${format(legacyVerifiedCents(order))}.</p>` : ""}
      ${entries.length ? `<div class="admin-operations-transactions">${entries.map((entry) => `<div class="admin-operations-transaction ${entry.status === "void" ? "is-void" : ""}">
        <div class="admin-operations-transaction__main"><strong>${entry.type === "refund" ? "Повернення" : "Надходження"} · ${METHODS[entry.method] || "Інше"}</strong>
        <small>${dateTime(entry.createdAt)} · ${escape(entry.createdBy || "Менеджер")}</small>
        ${entry.reference ? `<small>Референс: ${escape(entry.reference)}</small>` : ""}${entry.note ? `<small>${escape(entry.note)}</small>` : ""}</div>
        <div class="admin-operations-transaction__side"><strong class="${entry.type === "refund" ? "is-refund" : ""}">${entry.type === "refund" ? "−" : "+"}${format(entry.amountCents)}</strong><span class="admin-payment-record-state admin-payment-record-state--${entry.status}">${STATUS_LABELS[entry.status] || "—"}</span>
          <div class="admin-operations-transaction__actions">${entry.status === "pending" ? `<button type="button" class="admin-operations-link" data-payment-confirm="${escape(entry.id)}" data-payment-order="${oid}">Підтвердити</button>` : ""}
          ${entry.status !== "void" ? `<button type="button" class="admin-operations-link admin-operations-link--muted" data-payment-void="${escape(entry.id)}" data-payment-order="${oid}">Скасувати запис</button>` : ""}</div></div>
      </div>`).join("")}</div>` : `<p class="admin-operations-empty">Операцій поки немає. Для повної оплати достатньо одного підтвердження. Часткові надходження та повернення реєструйте окремо.</p>`}
    </section>`;
  }
  let context = null;
  function dialog(order, type) {
    const el = document.createElement("dialog"); el.className = "admin-operations-dialog";
    const methodOptions = Object.entries(METHODS).map(([code, label]) => `<option value="${code}">${label}</option>`).join("");
    el.innerHTML = `<form method="dialog" class="admin-operations-dialog__body" data-payment-form>
      <div class="admin-operations-dialog__top"><div><span class="admin-operations-eyebrow">Замовлення #${escape(order.orderId)}</span><h2>${type === "refund" ? "Повернення коштів" : "Часткова оплата"}</h2></div><button class="admin-operations-dialog__close" type="button" data-close-dialog aria-label="Закрити">×</button></div>
      <p class="admin-operations-dialog__description">Підтверджений запис одразу враховується в балансі. Обирайте «Очікує перевірки» лише якщо надходження ще не підтверджено. Це ручний облік, не банківська перевірка.</p>
      <div class="admin-operations-form-grid"><label class="admin-operations-field"><span>Сума, ₴</span><input type="number" inputmode="decimal" min="0.01" max="9999999999.99" step="0.01" name="amount" required placeholder="Наприклад, 20000" /></label>
      <label class="admin-operations-field"><span>Спосіб ${type === "refund" ? "повернення" : "оплати"}</span><select name="method" required>${methodOptions}</select></label>
      <label class="admin-operations-field"><span>Номер операції / референс <small>(необов'язково)</small></span><input name="reference" maxlength="80" placeholder="Банківська операція, номер квитанції…" /></label>
      <label class="admin-operations-field"><span>Примітка <small>(необов'язково)</small></span><input name="note" maxlength="500" placeholder="Наприклад, аванс за виготовлення" /></label>
      <label class="admin-operations-field admin-operations-field--full"><span>Стан операції</span><select name="verification" required>
        <option value="confirmed">Отримання / повернення перевірено менеджером</option>
        <option value="pending">Очікує перевірки — не враховувати в балансі</option>
      </select></label></div>
      <p class="admin-operations-error" data-form-error hidden></p>
      <div class="admin-operations-dialog__actions"><button type="button" class="admin-btn admin-btn--outline" data-close-dialog>Скасувати</button><button type="submit" class="admin-btn admin-btn--primary">Зберегти запис</button></div>
    </form>`;
    const close = () => { if (el.open) el.close(); el.remove(); };
    el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-close-dialog]")) close(); });
    el.addEventListener("close", () => el.remove());
    el.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      try {
        const currentOrder = context?.findOrder?.(order.orderId);
        if (!currentOrder) throw new Error("Замовлення не знайдено");
        requireActiveOrder(currentOrder);
        const entry = data.verification === "confirmed"
          ? recordConfirmed(currentOrder, { ...data, type }) : add(currentOrder, { ...data, type });
        context?.activity?.({ type: "payment", action: type === "refund" ? "payment.refund.created" : "payment.created", entityType: "order", entityId: String(order.orderId), summary: type === "refund" ? "Зареєстровано повернення коштів" : "Додано запис про платіж", detail: `${format(entry.amountCents)} · ${METHODS[entry.method]} · ${entry.status === "confirmed" ? "Підтверджено менеджером" : "Очікує перевірки"}` });
        close(); context?.refresh?.(); context?.toast?.(entry.status === "confirmed" ? "Операцію підтверджено й враховано в балансі" : "Запис додано. Він очікує перевірки.");
      } catch (err) { const message = form.querySelector("[data-form-error]"); message.textContent = err.message; message.hidden = false; }
    });
    document.body.append(el); el.showModal();
    el.querySelector('[name="method"]').value = defaultMethod(order);
    root.AstelCustomSelect?.refresh?.();
    el.querySelector("[name='amount']").focus();
  }
  async function confirmFullPayment(order) {
    const current = summary(order);
    if (!current.remaining || current.pending) {
      context?.toast?.("Перевірте існуючі платежі перед підтвердженням");
      return;
    }
    if (typeof root.AstelAdminConfirm !== "function") return;
    const accepted = await root.AstelAdminConfirm({
      title: "Підтвердити повну оплату?",
      message: "Виконуйте цю дію тільки після перевірки фактичного отримання коштів. Запис підтверджує менеджер, а не банк чи платіжний сервіс.",
      subject: `Замовлення #${order.orderId} · ${format(current.remaining)}`,
      confirmLabel: "Підтвердити оплату", neutral: true,
    });
    if (!accepted) return;
    const latest = context?.findOrder?.(order.orderId);
    if (!latest || isCanceled(latest)) {
      context?.toast?.("Розрахунки та оплата недоступні для скасованого замовлення");
      context?.refresh?.();
      return;
    }
    const fresh = summary(latest);
    if (fresh.pending || fresh.remaining !== current.remaining) {
      context?.toast?.("Баланс змінився. Перевірте платежі ще раз.");
      context?.refresh?.();
      return;
    }
    try {
      const entry = recordConfirmed(latest, {
        type: "payment", amount: (fresh.remaining / 100).toFixed(2),
        method: defaultMethod(latest), note: "Повна оплата підтверджена менеджером",
      });
      context?.activity?.({ type: "payment", action: "payment.confirmed", entityType: "order", entityId: String(order.orderId), summary: "Підтверджено повну оплату", detail: `${format(entry.amountCents)} · ${METHODS[entry.method]} · Підтверджено менеджером` });
      context?.refresh?.(); context?.toast?.("Повну оплату підтверджено");
    } catch (error) { context?.toast?.(error.message); }
  }

  async function updateRecord(order, recordId, next) {
    const current = entriesFor(order.orderId).find((r) => r.id === recordId);
    if (!current) return;
    const accepted = await root.AstelAdminConfirm?.({
      title: next === "confirmed" ? "Підтвердити операцію?" : "Скасувати запис про операцію?",
      message: next === "confirmed" ? "Підтверджуйте лише після фактичної перевірки оплати або повернення. Це ручний запис менеджера, не автоматична перевірка банку." : "Запис залишиться в історії зі статусом «Скасовано» і більше не впливатиме на баланс.",
      subject: `${current.type === "refund" ? "Повернення" : "Платіж"} · ${format(current.amountCents)}`,
      confirmLabel: next === "confirmed" ? "Підтвердити" : "Скасувати запис",
      neutral: next === "confirmed",
    });
    if (!accepted) return;
    try {
      const latest = context?.findOrder?.(order.orderId);
      if (!latest) throw new Error("Замовлення не знайдено");
      const changed = changeState(latest, recordId, next);
      context?.activity?.({ type: "payment", action: next === "confirmed" ? "payment.confirmed" : "payment.void", entityType: "order", entityId: String(order.orderId), summary: next === "confirmed" ? "Менеджер підтвердив операцію" : "Скасовано запис про операцію", detail: `${changed.type === "refund" ? "Повернення" : "Платіж"} · ${format(changed.amountCents)} · ${METHODS[changed.method]}` });
      context?.refresh?.(); context?.toast?.(next === "confirmed" ? "Операцію підтверджено" : "Запис скасовано");
    } catch (err) { context?.toast?.(err.message); }
  }
  function bindUI(config) {
    if (context) return;
    context = config;
    document.addEventListener("click", (e) => {
      const quick = e.target.closest("[data-payment-full]");
      const add = e.target.closest("[data-payment-add]");
      const refund = e.target.closest("[data-payment-refund]");
      const confirm = e.target.closest("[data-payment-confirm]");
      const cancel = e.target.closest("[data-payment-void]");
      const id = quick?.dataset.paymentFull || add?.dataset.paymentAdd || refund?.dataset.paymentRefund || confirm?.dataset.paymentOrder || cancel?.dataset.paymentOrder;
      if (!id) return;
      const order = context.findOrder(id); if (!order) return;
      if (isCanceled(order)) {
        context?.toast?.("Розрахунки та оплата недоступні для скасованого замовлення");
        context?.refresh?.();
        return;
      }
      if (quick) confirmFullPayment(order);
      else if (add || refund) dialog(order, refund ? "refund" : "payment");
      else updateRecord(order, (confirm || cancel).dataset[confirm ? "paymentConfirm" : "paymentVoid"], confirm ? "confirmed" : "void");
    });
  }
  const api = Object.freeze({ KEY, METHODS, read, entriesFor, toCents, legacyVerifiedCents, summary, status, add, recordConfirmed, defaultMethod, changeState, panel, bindUI });
  root.AstelAdminPayments = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
