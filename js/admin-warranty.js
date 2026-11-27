/* Astel-com warranty cases: frontend prototype, separate from order status and revenue. */
(function (root) {
  "use strict";
  const KEY = "astelkom_warranty_cases_v1";
  const RESOLUTIONS = Object.freeze({
    diagnosis: "Діагностика",
    repair: "Ремонт",
    replacement: "Заміна товару",
    refund: "Повернення коштів",
    other: "Інше рішення",
  });
  const OUTCOMES = Object.freeze({
    open: "Відкрито",
    investigating: "На розгляді",
    replacement_sent: "Заміну відправлено",
    resolved: "Вирішено",
    rejected: "Відмовлено",
  });
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
  const short = (v, n = 500) => String(v ?? "").trim().slice(0, n);
  const storage = (provided) => provided || root.localStorage;
  const rows = (store) => {
    try {
      const value = JSON.parse(storage(store).getItem(KEY) || "[]");
      return Array.isArray(value) ? value.filter((c) => c && c.id && c.orderId).slice(0, 2000) : [];
    } catch { return []; }
  };
  const forOrder = (orderId, store) => rows(store).filter((c) => c.orderId === String(orderId));
  const save = (order, payload, caseId = null, store) => {
    const id = String(order?.orderId || "");
    if (!id || !Array.isArray(order.items)) throw new Error("Замовлення не знайдено");
    const all = rows(store);
    const previous = caseId ? all.find((c) => c.id === caseId && c.orderId === id) : null;
    if (caseId && !previous) throw new Error("Гарантійне звернення не знайдено");
    if (!previous && order.statusCode !== "completed") throw new Error("Нове гарантійне звернення можна додати лише до виконаного замовлення");
    const productId = short(payload.productId, 120);
    const product = order.items.find((item) => String(item.id) === productId);
    if (!product) throw new Error("Оберіть товар із замовлення");
    const reason = short(payload.reason, 1200);
    if (reason.length < 5) throw new Error("Опишіть причину звернення (щонайменше 5 символів)");
    if (!Object.hasOwn(RESOLUTIONS, payload.resolution)) throw new Error("Оберіть спосіб вирішення");
    if (!Object.hasOwn(OUTCOMES, payload.outcome)) throw new Error("Оберіть результат звернення");
    const ttn = short(payload.replacementTtn, 40).replace(/\s+/g, "").toUpperCase();
    if (ttn && !/^[A-Z0-9-]{8,32}$/.test(ttn)) throw new Error("Перевірте номер ТТН заміни");
    if (payload.outcome === "replacement_sent" && payload.resolution !== "replacement") throw new Error("Для відправлення заміни оберіть рішення «Заміна товару»");
    if (payload.outcome === "replacement_sent" && !ttn) throw new Error("Введіть ТТН відправленої заміни");
    const now = Date.now();
    const current = {
      id: previous?.id || `wc-${now}-${Math.random().toString(36).slice(2, 9)}`,
      orderId: id,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      createdBy: previous?.createdBy || "Сергій",
      productId,
      productTitle: short(product.title || product.id, 250),
      reason,
      resolution: payload.resolution,
      outcome: payload.outcome,
      replacementTtn: ttn,
    };
    const updated = previous ? all.map((item) => item.id === previous.id ? current : item) : [current, ...all];
    storage(store).setItem(KEY, JSON.stringify(updated));
    return { record: current, previous };
  };
  const formatDate = (ts) => new Date(ts).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  function panel(order) {
    const cases = forOrder(order.orderId);
    if (order.statusCode !== "completed" && !cases.length) return "";
    const items = cases.map((c) => `<article class="admin-operations-record">
      <div class="admin-operations-record__head"><strong>${escape(c.productTitle)}</strong><span class="admin-operations-chip admin-operations-chip--${escape(c.outcome)}">${OUTCOMES[c.outcome] || "На розгляді"}</span></div>
      <p><span>Причина:</span> ${escape(c.reason)}</p>
      <p><span>Рішення:</span> ${RESOLUTIONS[c.resolution] || "—"}</p>
      ${c.replacementTtn ? `<p><span>ТТН заміни:</span> <b>${escape(c.replacementTtn)}</b></p>` : ""}
      <div class="admin-operations-record__foot"><small>${escape(c.createdBy || "Автор не вказаний")} · ${formatDate(c.updatedAt)}</small><button type="button" class="admin-operations-link" data-warranty-edit="${escape(c.id)}" data-warranty-order="${escape(order.orderId)}">Редагувати звернення</button></div>
    </article>`).join("");
    return `<section class="admin-operations admin-warranty" aria-label="Гарантійні звернення">
      <div class="admin-operations__heading"><div><h3>Гарантійні звернення ${cases.length ? `<span class="admin-operations-count">${cases.length}</span>` : ""}</h3><p>Окремо від статусу й суми початкового замовлення</p></div>
      ${order.statusCode === "completed" ? `<button type="button" class="admin-btn admin-btn--outline" data-warranty-add="${escape(order.orderId)}">+ Гарантійне звернення</button>` : ""}</div>
      ${cases.length ? `<div class="admin-operations-records">${items}</div>` : `<p class="admin-operations-empty">Гарантійних звернень немає.</p>`}
    </section>`;
  }
  let context = null;
  function dialog(order, existing) {
    const el = document.createElement("dialog");
    el.className = "admin-operations-dialog";
    const choices = (dict, value, placeholder) => `<option value="">${placeholder}</option>${Object.entries(dict).map(([code,label]) => `<option value="${escape(code)}" ${value === code ? "selected" : ""}>${escape(label)}</option>`).join("")}`;
    const itemChoices = order.items.map((item) => `<option value="${escape(item.id)}" ${String(existing?.productId || "") === String(item.id) ? "selected" : ""}>${escape(item.title || item.id)} · ${Number(item.qty) || 0} шт.</option>`).join("");
    el.innerHTML = `<form method="dialog" class="admin-operations-dialog__body" data-warranty-form>
      <div class="admin-operations-dialog__top"><div><span class="admin-operations-eyebrow">Замовлення #${escape(order.orderId)}</span><h2>${existing ? "Редагувати гарантійне звернення" : "Нове гарантійне звернення"}</h2></div><button type="button" class="admin-operations-dialog__close" data-close-dialog aria-label="Закрити">×</button></div>
      <p class="admin-operations-dialog__description">Початкове замовлення залишається «Виконано». Нове звернення має власну історію та результат.</p>
      <div class="admin-operations-form-grid">
        <label class="admin-operations-field"><span>Товар у замовленні</span><select name="productId" required><option value="">Оберіть товар</option>${itemChoices}</select></label>
        <label class="admin-operations-field"><span>Спосіб вирішення</span><select name="resolution" required>${choices(RESOLUTIONS, existing?.resolution, "Оберіть рішення")}</select></label>
        <label class="admin-operations-field admin-operations-field--full"><span>Причина звернення</span><textarea name="reason" required minlength="5" maxlength="1200" placeholder="Наприклад, несправний модем після отримання">${escape(existing?.reason || "")}</textarea></label>
        <label class="admin-operations-field"><span>Результат / статус</span><select name="outcome" required>${choices(OUTCOMES, existing?.outcome || "open", "Оберіть результат")}</select></label>
        <label class="admin-operations-field"><span>ТТН відправленої заміни <small>(за потреби)</small></span><input name="replacementTtn" maxlength="40" value="${escape(existing?.replacementTtn || "")}" placeholder="Номер накладної заміни" /></label>
      </div>
      <p class="admin-operations-error" data-form-error hidden></p>
      <div class="admin-operations-dialog__actions"><button type="button" class="admin-btn admin-btn--outline" data-close-dialog>Скасувати</button><button type="submit" class="admin-btn admin-btn--primary">${existing ? "Зберегти зміни" : "Створити звернення"}</button></div>
    </form>`;
    const close = () => { if (el.open) el.close(); el.remove(); };
    el.addEventListener("click", (event) => { if (event.target === el || event.target.closest("[data-close-dialog]")) close(); });
    el.addEventListener("close", () => el.remove());
    el.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      try {
        const result = save(order, data, existing?.id);
        context?.activity?.({ type: "order", action: existing ? "warranty.update" : "warranty.create", entityType: "order", entityId: String(order.orderId), summary: existing ? "Оновлено гарантійне звернення" : "Створено гарантійне звернення", detail: `${result.record.productTitle} · ${OUTCOMES[result.record.outcome]}${result.record.replacementTtn ? ` · ТТН ${result.record.replacementTtn}` : ""}` });
        close(); context?.refresh?.(); context?.toast?.("Гарантійне звернення збережено");
      } catch (err) {
        const error = form.querySelector("[data-form-error]"); error.hidden = false; error.textContent = err.message;
      }
    });
    document.body.append(el);
    el.showModal();
    el.querySelector("[name='productId']").focus();
  }
  function bindUI(config) {
    if (context) return;
    context = config;
    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-warranty-add]");
      const edit = e.target.closest("[data-warranty-edit]");
      if (!add && !edit) return;
      const id = add?.dataset.warrantyAdd || edit.dataset.warrantyOrder;
      const order = context.findOrder(id);
      if (!order) return;
      const existing = edit ? forOrder(id).find((c) => c.id === edit.dataset.warrantyEdit) : null;
      if (edit && !existing) return;
      dialog(order, existing);
    });
  }
  const api = Object.freeze({ KEY, RESOLUTIONS, OUTCOMES, forOrder, save, panel, bindUI });
  root.AstelAdminWarranty = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
