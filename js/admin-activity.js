/* Astel-Com admin activity — FRONTEND PROTOTYPE ONLY.
 * Local browser records are neither secure nor an authoritative audit trail.
 * Replace the storage/actor boundary with an authenticated backend later. */
"use strict";

const AstelAdminActivity = (() => {
  const STORAGE_KEY = "astelkom_admin_activity_v1";
  const MAX_EVENTS = 500;
  const TYPES = Object.freeze({
    order: { label: "Замовлення", icon: "package" },
    delivery: { label: "Доставка", icon: "truck" },
    payment: { label: "Оплата", icon: "wallet" },
    product: { label: "Товари", icon: "box" },
    customer: { label: "Клієнти", icon: "user" },
    note: { label: "Примітки", icon: "message" },
    inventory: { label: "Склад та ціни", icon: "layers" },
  });
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
  const trimText = (value, max = 300) => String(value ?? "").trim().slice(0, max);
  const actor = () => ({
    id: "demo-serhii",
    name: (typeof document !== "undefined" && document.querySelector("#admin-greeting")?.dataset.name) || "Сергій",
  });
  // Official Google Material Symbols Outlined ligatures (Apache-2.0).
  // Matching font subset is loaded in admin.html.
  const icons = Object.freeze({
    package: "receipt_long",
    truck: "local_shipping",
    wallet: "account_balance_wallet",
    box: "inventory_2",
    user: "person_outline",
    message: "chat_bubble_outline",
    layers: "layers",
  });
  const icon = (key) => `<span class="admin-material-icon" aria-hidden="true">${icons[key] || icons.package}</span>`;

  function read() {
    try {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(events) ? events.filter((e) => e && e.id && e.summary && e.createdAt).slice(0, MAX_EVENTS) : [];
    } catch (_) { return []; }
  }
  function record({ type = "order", action = "updated", entityType = "order", entityId = "", summary, detail = "", actorName, createdAt = Date.now() }) {
    const who = actor();
    if (!trimText(summary)) return null;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Number(createdAt) || Date.now(),
      actorId: who.id,
      actorName: trimText(actorName || who.name, 80),
      type: Object.hasOwn(TYPES, type) ? type : "order",
      action: trimText(action, 64),
      entityType: trimText(entityType, 30),
      entityId: trimText(entityId, 120),
      summary: trimText(summary, 200),
      detail: trimText(detail, 550),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...read()].slice(0, MAX_EVENTS)));
      document.dispatchEvent(new CustomEvent("astel:activity-recorded", { detail: entry }));
    } catch (e) {
      // Audit data is best-effort until the backend exists; never block order saves.
      console.warn("Не вдалося зберегти локальну історію дій", e);
    }
    return entry;
  }
  const forOrder = (id) => read().filter((e) => e.entityType === "order" && e.entityId === String(id));
  const dateTime = (ts) => new Date(ts).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const timeOnly = (ts) => new Date(ts).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  const dayKey = (ts) => new Date(ts).toLocaleDateString("sv-SE");
  function dateLabel(ts) {
    const key = dayKey(ts);
    if (key === dayKey(Date.now())) return "Сьогодні";
    if (key === dayKey(Date.now() - 86400000)) return "Учора";
    return new Date(ts).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  }
  function itemHTML(event, context = "global") {
    const conf = TYPES[event.type] || TYPES.order;
    const order = event.entityType === "order";
    const identifier = event.entityId
      ? `${order ? "#" : ""}${event.entityId}` : "";
    return `<li class="admin-activity-entry admin-activity-entry--${escape(event.type)}">
      <span class="admin-activity-entry__icon">${icon(conf.icon)}</span>
      <div class="admin-activity-entry__body">
        <div class="admin-activity-entry__top">
          <strong>${escape(event.summary)}</strong>
          <time datetime="${new Date(event.createdAt).toISOString()}" title="${escape(dateTime(event.createdAt))}">${context === "order" ? escape(dateTime(event.createdAt)) : escape(timeOnly(event.createdAt))}</time>
        </div>
        ${event.detail ? `<p class="admin-activity-entry__detail">${escape(event.detail)}</p>` : ""}
        <div class="admin-activity-entry__meta">
          <span class="admin-activity-entry__actor">${icon("user")} ${escape(event.actorName || "Автор невідомий")}</span>
          <span class="admin-activity-entry__separator" aria-hidden="true">·</span>
          <span>${escape(conf.label)}</span>
          ${context === "global" && identifier ? `<span class="admin-activity-entry__separator" aria-hidden="true">·</span>${order ? `<button type="button" class="admin-activity-entry__link" data-activity-open-order="${escape(event.entityId)}">${escape(identifier)}</button>` : `<span>${escape(identifier)}</span>`}` : ""}
        </div>
      </div>
    </li>`;
  }
  function rowsHTML(events, context = "global") {
    if (!events.length) return "";
    if (context === "order") return `<ol class="admin-activity-entries">${events.map((e) => itemHTML(e, context)).join("")}</ol>`;
    let last = "";
    return events.map((e) => {
      const key = dayKey(e.createdAt);
      const heading = key === last ? "" : `<h3 class="admin-activity-date">${escape(dateLabel(e.createdAt))}</h3>`;
      last = key;
      return `${heading}<ol class="admin-activity-entries">${itemHTML(e)}</ol>`;
    }).join("");
  }
  const openOrders = new Set();
  const emptyOrder = `<div class="admin-activity-empty admin-activity-empty--inline">
    ${icon("package")}<span>Змін поки немає. Тут з’являтимуться дії менеджерів із цим замовленням.</span>
  </div>`;
  const orderRows = (id) => rowsHTML(forOrder(id), "order") || emptyOrder;
  function orderSection(id) {
    const entries = forOrder(id);
    return `<details class="admin-order-history" data-order-history="${escape(id)}" ${openOrders.has(String(id)) ? "open" : ""}>
      <summary class="admin-order-history__toggle">
        <span class="admin-order-history__label">${icon("layers")} Історія змін <span class="admin-order-history__count" data-order-history-count="${escape(id)}">${entries.length}</span></span>
        <span class="admin-material-icon admin-order-history__arrow" aria-hidden="true">expand_more</span>
      </summary>
      <div class="admin-order-history__content" data-order-history-list="${escape(id)}">${orderRows(id)}</div>
    </details>`;
  }

  const exampleEvents = () => {
    const now = Date.now();
    return [
      { id: "example-1", createdAt: now - 1200000, type: "delivery", actorName: "Сергій", summary: "Додано ТТН", detail: "Нова Пошта · 20450817263451", entityType: "order", entityId: "AK-ДЕМО" },
      { id: "example-2", createdAt: now - 7200000, type: "order", actorName: "Олександр", summary: "Змінено статус замовлення", detail: "Передано в обробку → Відправлено", entityType: "order", entityId: "AK-ДЕМО" },
      { id: "example-3", createdAt: now - 86400000, type: "inventory", actorName: "Сергій", summary: "Оновлено ціну товару", detail: "COM-900-NBI-int: 8 064 ₴ → 8 300 ₴", entityType: "product", entityId: "COM-900-NBI-int" },
    ];
  };
  let showExamples = false;
  function renderGlobal() {
    const root = document.getElementById("admin-activity-list");
    if (!root) return;
    const records = read();
    const tabCount = document.getElementById("tab-count-activity");
    if (tabCount) tabCount.textContent = String(records.length);
    const query = (document.getElementById("admin-activity-search")?.value || "").trim().toLocaleLowerCase("uk-UA");
    const type = document.getElementById("admin-activity-type")?.value || "all";
    const period = document.getElementById("admin-activity-period")?.value || "all";
    const userSelect = document.getElementById("admin-activity-manager");
    const user = userSelect?.value || "all";
    const managers = [...new Set(records.map((e) => e.actorName).filter(Boolean))].sort((a,b) => a.localeCompare(b, "uk"));
    if (userSelect) {
      const options = ['<option value="all">Усі менеджери</option>', ...managers.map((name) => `<option value="${escape(name)}">${escape(name)}</option>`)].join("");
      if (userSelect.innerHTML !== options) {
        userSelect.innerHTML = options;
        userSelect.value = managers.includes(user) ? user : "all";
        window.AstelCustomSelect?.refresh?.();
      }
    }
    const cutoff = period === "today" ? new Date().setHours(0, 0, 0, 0) : period === "7" ? Date.now() - 7 * 86400000 : period === "30" ? Date.now() - 30 * 86400000 : 0;
    const selected = records.filter((e) =>
      (type === "all" || e.type === type) &&
      (userSelect?.value === "all" || !userSelect || e.actorName === userSelect.value) &&
      e.createdAt >= cutoff &&
      (!query || [e.actorName, e.entityId, e.summary, e.detail, TYPES[e.type]?.label].join(" ").toLocaleLowerCase("uk-UA").includes(query))
    );
    const total = document.getElementById("admin-activity-total");
    const today = document.getElementById("admin-activity-today");
    const people = document.getElementById("admin-activity-people");
    if (total) total.textContent = String(records.length);
    if (today) today.textContent = String(records.filter((e) => dayKey(e.createdAt) === dayKey(Date.now())).length);
    if (people) people.textContent = String(managers.length);
    const count = document.getElementById("admin-activity-matches");
    if (count) count.textContent = `${selected.length} ${selected.length === 1 ? "запис" : "записів"}`;
    if (selected.length) {
      root.innerHTML = rowsHTML(selected);
    } else if (!records.length) {
      root.innerHTML = `<div class="admin-activity-empty admin-activity-empty--global">
        ${icon("layers")}
        <strong>Записів поки немає</strong>
        <p>Журнал почне заповнюватися після змін замовлень, товарів або приміток у цій адмінпанелі. Попередні дії неможливо відновити автоматично.</p>
        <button type="button" class="admin-btn admin-btn--outline" data-activity-examples>${showExamples ? "Приховати приклади" : "Переглянути приклади"}</button>
      </div>${showExamples ? `<div class="admin-activity-examples"><div class="admin-activity-examples__notice">Приклади інтерфейсу — це не справжні події та вони не зберігаються</div>${rowsHTML(exampleEvents())}</div>` : ""}`;
    } else {
      root.innerHTML = `<div class="admin-activity-empty admin-activity-empty--global">${icon("layers")}<strong>За цими фільтрами нічого не знайдено</strong><p>Змініть пошуковий запит або параметри фільтрації.</p><button type="button" class="admin-btn admin-btn--outline" data-activity-reset>Скинути фільтри</button></div>`;
    }
  }
  function refreshOrder(id) {
    document.querySelectorAll("[data-order-history-list]").forEach((el) => {
      if (el.dataset.orderHistoryList !== String(id)) return;
      el.innerHTML = orderRows(id);
    });
    document.querySelectorAll("[data-order-history-count]").forEach((el) => {
      if (el.dataset.orderHistoryCount === String(id)) el.textContent = String(forOrder(id).length);
    });
  }
  function resetFilters() {
    const search = document.getElementById("admin-activity-search");
    if (search) search.value = "";
    for (const id of ["admin-activity-type", "admin-activity-period", "admin-activity-manager"]) {
      const el = document.getElementById(id);
      if (el) el.value = "all";
    }
    window.AstelCustomSelect?.refresh?.();
    renderGlobal();
  }
  function bindUI() {
    const panel = document.getElementById("panel-activity");
    if (!panel) return;
    // Preserve expanded order histories when any admin view re-renders.
    document.addEventListener("click", (event) => {
      const summary = event.target.closest?.(".admin-order-history__toggle");
      if (!summary) return;
      const details = summary.closest("[data-order-history]");
      if (!details) return;
      if (details.open) openOrders.delete(details.dataset.orderHistory);
      else openOrders.add(details.dataset.orderHistory);
    }, true);
    panel.addEventListener("input", (event) => {
      if (event.target.id === "admin-activity-search") renderGlobal();
    });
    panel.addEventListener("change", (event) => {
      if (["admin-activity-type", "admin-activity-period", "admin-activity-manager"].includes(event.target.id)) renderGlobal();
    });
    panel.addEventListener("click", (event) => {
      if (event.target.closest("[data-activity-reset]")) { resetFilters(); return; }
      if (event.target.closest("[data-activity-examples]")) { showExamples = !showExamples; renderGlobal(); }
      const button = event.target.closest("[data-activity-open-order]");
      if (button) {
        const id = button.dataset.activityOpenOrder;
        if (id === "AK-ДЕМО") return;
        document.querySelector('[data-admin-tab="panel-orders"]')?.click();
        const search = document.getElementById("admin-search");
        if (search) { search.value = id; search.dispatchEvent(new Event("input", { bubbles: true })); }
        document.getElementById("admin-status-filter").value = "all";
        document.getElementById("admin-status-filter").dispatchEvent(new Event("change", { bubbles: true }));
        requestAnimationFrame(() => {
          const card = [...document.querySelectorAll(".admin-order-card")].find((el) => el.dataset.orderId === id);
          card?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    });
    document.addEventListener("astel:activity-recorded", (event) => {
      renderGlobal();
      if (event.detail.entityType === "order") refreshOrder(event.detail.entityId);
    });
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) { renderGlobal(); document.querySelectorAll("[data-order-history]").forEach((el) => refreshOrder(el.dataset.orderHistory)); }
    });
    renderGlobal();
  }
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", bindUI);
  return Object.freeze({ STORAGE_KEY, TYPES, actor, record, read, forOrder, orderSection, renderGlobal, rowsHTML, refreshOrder });
})();

if (typeof module !== "undefined") module.exports = AstelAdminActivity;
