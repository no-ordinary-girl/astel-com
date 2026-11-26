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
    inventory: { label: "Склад", icon: "layers" },
  });
  const escape = (value) =>
    String(value ?? "").replace(
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
  const trimText = (value, max = 300) =>
    String(value ?? "")
      .trim()
      .slice(0, max);
  const actor = () => ({
    id: "demo-serhii",
    name:
      (typeof document !== "undefined" &&
        document.querySelector("#admin-greeting")?.dataset.name) ||
      "Сергій",
  });
  // User-provided local SVGs. CSS masks preserve the context-specific currentColor
  // (including category colors and dark mode) without third-party font requests.
  const icons = Object.freeze({
    package: "receipt_long",
    truck: "shipping",
    wallet: "payments",
    box: "package",
    user: "person",
    message: "chat_bubble",
    layers: "layers",
  });
  // Exact <path> shapes from the seven user-provided Material SVGs.
  // Rendering inline avoids external mask-image loading restrictions when
  // the prototype is opened directly via file:// (as well as on HTTP sites).
  const iconPaths = Object.freeze({
    receipt_long:
      "M6,22q-1.25,0-2.13-0.88T3,19V16H6V2L7.5,3.5L9,2l1.5,1.5L12,2l1.5,1.5L15,2l1.5,1.5L18,2l1.5,1.5L21,2V19q0,1.25-0.88,2.13T18,22H6Zm12-2q0.43,0 0.71-0.29Q19,19.43 19,19V5H8V16h9v3q0,0.43 0.29,0.71T18,20ZM9,9V7h6V9H9Zm0,3V10h6v2H9Zm8-3q-0.43,0-0.71-0.29T16,8q0-0.43 0.29-0.71T17,7t0.71,0.29T18,8q0,0.42-0.29,0.71T17,9Zm0,3q-0.43,0-0.71-0.29Q16,11.43 16,11t0.29-0.71T17,10t0.71,0.29T18,11t-0.29,0.71T17,12ZM6,20h9V18H5v1q0,0.43 0.29,0.71T6,20ZM5,20q0,0 0-0.29Q5,19.43 5,19V18v2Z",
    shipping:
      "M3.88,19.13Q3,18.25 3,17H1V6Q1,5.18 1.59,4.59T3,4H17V8h3l3,4v5H21q0,1.25-0.88,2.13T18,20t-2.13-0.88T15,17H9q0,1.25-0.88,2.13T6,20T3.88,19.13Zm2.84-1.41Q7,17.43 7,17T6.71,16.29T6,16q-0.42,0-0.71,0.29T5,17t0.29,0.71T6,18t0.71-0.29ZM3,15H3.8q0.43-0.45 0.98-0.73T6,14t1.23,0.27T8.2,15H15V6H3v9Zm15.71,2.71Q19,17.43 19,17t-0.29-0.71T18,16t-0.71,0.29T17,17t0.29,0.71T18,18t0.71-0.29ZM17,13h4.25L19,10H17v3ZM9,10.5Z",
    payments:
      "M14,13q-1.25,0-2.13-0.88T11,10t0.88-2.13T14,7t2.13,0.88T17,10t-0.88,2.13T14,13ZM7,16q-0.82,0-1.41-0.59T5,14V6Q5,5.18 5.59,4.59T7,4H21q0.83,0 1.41,0.59Q23,5.18 23,6v8q0,0.82-0.59,1.41T21,16H7Zm2-2H19q0-0.83 0.59-1.41T21,12V8q-0.82,0-1.41-0.59T19,6H9Q9,6.82 8.41,7.41Q7.83,8 7,8v4q0.83,0 1.41,0.59Q9,13.18 9,14Zm11,6H3q-0.82,0-1.41-0.59T1,18V7H3V18H20v2ZM7,14V6v8Z",
    package:
      "M11,19.43V12.58L5,9.1v6.85l6,3.48Zm2,0l6-3.48V9.1l-6,3.47v6.85Zm-2,2.3L4,17.7q-0.47-0.27-0.74-0.72Q3,16.52 3,15.98V8.02q0-0.55 0.26-1T4,6.3l7-4.03Q11.48,2 12,2q0.53,0 1,0.27L20,6.3q0.48,0.27 0.74,0.72t0.26,1v7.95q0,0.55-0.26,1T20,17.7l-7,4.03Q12.53,22 12,22t-1-0.27Zm5-13.2l1.93-1.1L12,4L10.05,5.13L16,8.52Zm-4,2.33l1.95-1.13L8.03,6.3L6.08,7.43L12,10.85Z",
    person:
      "M9.18,10.83Q8,9.65 8,8T9.18,5.18T12,4t2.83,1.18T16,8t-1.17,2.82T12,12T9.18,10.83ZM4,20V17.2q0-0.85 0.44-1.56q0.44-0.71 1.16-1.09q1.55-0.78 3.15-1.16T12,13t3.25,0.39t3.15,1.16q0.72,0.38 1.16,1.09T20,17.2V20H4Zm2-2H18V17.2q0-0.27-0.14-0.5q-0.14-0.22-0.36-0.35q-1.35-0.68-2.72-1.01T12,15T9.23,15.34T6.5,16.35Q6.28,16.48 6.14,16.7Q6,16.93 6,17.2V18Zm7.41-8.59Q14,8.82 14,8T13.41,6.59T12,6T10.59,6.59Q10,7.18 10,8t0.59,1.41T12,10t1.41-0.59ZM12,8Zm0,10Z",
    chat_bubble:
      "M2,22V4Q2,3.17 2.59,2.59T4,2H20q0.83,0 1.41,0.59T22,4V16q0,0.82-0.59,1.41T20,18H6L2,22Zm3.15-6H20V4H4V17.13L5.15,16ZM4,16V4V16Z",
    layers:
      "M12,14L1,8L12,2L23,8L12,14Zm0,4L1.58,12.33l2.1-1.15L12,15.73l8.33-4.55l2.1,1.15L12,18Zm0,4L1.58,16.33l2.1-1.15L12,19.73l8.33-4.55l2.1,1.15L12,22Zm0-10.28L18.83,8L12,4.27L5.18,8L12,11.73ZM12,8Z",
  });
  const icon = (key) => {
    const name = icons[key] || icons.package;
    return `<svg class="admin-material-icon admin-material-icon--${name}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}" /></svg>`;
  };
  // Use the same arrow as the site cards for old -> new values in activity details.
  const changeArrow = `<svg
    class="icon-arrow card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  ><path d="M5 12h14M12 5l7 7-7 7" /></svg>`;
  const renderDetail = (value) => escape(value).replaceAll("→", changeArrow);

  function read() {
    try {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(events)
        ? events
            .filter((e) => e && e.id && e.summary && e.createdAt)
            .slice(0, MAX_EVENTS)
        : [];
    } catch (_) {
      return [];
    }
  }
  function record({
    type = "order",
    action = "updated",
    entityType = "order",
    entityId = "",
    summary,
    detail = "",
    actorName,
    createdAt = Date.now(),
  }) {
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
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([entry, ...read()].slice(0, MAX_EVENTS)),
      );
      document.dispatchEvent(
        new CustomEvent("astel:activity-recorded", { detail: entry }),
      );
    } catch (e) {
      // Audit data is best-effort until the backend exists; never block order saves.
      console.warn("Не вдалося зберегти локальну історію дій", e);
    }
    return entry;
  }
  const forOrder = (id) =>
    read().filter((e) => e.entityType === "order" && e.entityId === String(id));
  const dateTime = (ts) =>
    new Date(ts).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const timeOnly = (ts) =>
    new Date(ts).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const dayKey = (ts) => new Date(ts).toLocaleDateString("sv-SE");
  function dateLabel(ts) {
    const key = dayKey(ts);
    if (key === dayKey(Date.now())) return "Сьогодні";
    if (key === dayKey(Date.now() - 86400000)) return "Учора";
    return new Date(ts).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  function itemHTML(event, context = "global") {
    const conf = TYPES[event.type] || TYPES.order;
    const order = event.entityType === "order";
    const identifier = event.entityId
      ? `${order ? "#" : ""}${event.entityId}`
      : "";
    return `<li class="admin-activity-entry admin-activity-entry--${escape(event.type)}">
      <span class="admin-activity-entry__icon">${icon(conf.icon)}</span>
      <div class="admin-activity-entry__body">
        <div class="admin-activity-entry__top">
          <strong>${escape(event.summary)}</strong>
          <time datetime="${new Date(event.createdAt).toISOString()}" title="${escape(dateTime(event.createdAt))}">${context === "order" ? escape(dateTime(event.createdAt)) : escape(timeOnly(event.createdAt))}</time>
        </div>
        ${event.detail ? `<p class="admin-activity-entry__detail">${renderDetail(event.detail)}</p>` : ""}
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
    if (context === "order")
      return `<ol class="admin-activity-entries">${events.map((e) => itemHTML(e, context)).join("")}</ol>`;
    let last = "";
    return events
      .map((e) => {
        const key = dayKey(e.createdAt);
        const heading =
          key === last
            ? ""
            : `<h3 class="admin-activity-date">${escape(dateLabel(e.createdAt))}</h3>`;
        last = key;
        return `${heading}<ol class="admin-activity-entries">${itemHTML(e)}</ol>`;
      })
      .join("");
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
        <span class="admin-order-history__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg></span>
      </summary>
      <div class="admin-order-history__content" data-order-history-list="${escape(id)}">${orderRows(id)}</div>
    </details>`;
  }

  const exampleEvents = () => {
    const now = Date.now();
    return [
      {
        id: "example-1",
        createdAt: now - 1200000,
        type: "delivery",
        actorName: "Сергій",
        summary: "Додано ТТН",
        detail: "Нова Пошта · 20450817263451",
        entityType: "order",
        entityId: "AK-ДЕМО",
      },
      {
        id: "example-2",
        createdAt: now - 7200000,
        type: "order",
        actorName: "Олександр",
        summary: "Змінено статус замовлення",
        detail: "Передано в обробку → Відправлено",
        entityType: "order",
        entityId: "AK-ДЕМО",
      },
      {
        id: "example-3",
        createdAt: now - 86400000,
        type: "inventory",
        actorName: "Сергій",
        summary: "Оновлено ціну товару",
        detail: "COM-900-NBI-int: 8 064 ₴ → 8 300 ₴",
        entityType: "product",
        entityId: "COM-900-NBI-int",
      },
    ];
  };
  let showExamples = false;
  function renderGlobal() {
    const root = document.getElementById("admin-activity-list");
    if (!root) return;
    const records = read();
    const tabCount = document.getElementById("tab-count-activity");
    if (tabCount) tabCount.textContent = String(records.length);
    const query = (
      document.getElementById("admin-activity-search")?.value || ""
    )
      .trim()
      .toLocaleLowerCase("uk-UA");
    const type = document.getElementById("admin-activity-type")?.value || "all";
    const period =
      document.getElementById("admin-activity-period")?.value || "all";
    const userSelect = document.getElementById("admin-activity-manager");
    const user = userSelect?.value || "all";
    const managers = [
      ...new Set(records.map((e) => e.actorName).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "uk"));
    if (userSelect) {
      const options = [
        '<option value="all">Усі менеджери</option>',
        ...managers.map(
          (name) => `<option value="${escape(name)}">${escape(name)}</option>`,
        ),
      ].join("");
      if (userSelect.innerHTML !== options) {
        userSelect.innerHTML = options;
        userSelect.value = managers.includes(user) ? user : "all";
        window.AstelCustomSelect?.refresh?.();
      }
    }
    const cutoff =
      period === "today"
        ? new Date().setHours(0, 0, 0, 0)
        : period === "7"
          ? Date.now() - 7 * 86400000
          : period === "30"
            ? Date.now() - 30 * 86400000
            : 0;
    const selected = records.filter(
      (e) =>
        (type === "all" || e.type === type) &&
        (userSelect?.value === "all" ||
          !userSelect ||
          e.actorName === userSelect.value) &&
        e.createdAt >= cutoff &&
        (!query ||
          [e.actorName, e.entityId, e.summary, e.detail, TYPES[e.type]?.label]
            .join(" ")
            .toLocaleLowerCase("uk-UA")
            .includes(query)),
    );
    const total = document.getElementById("admin-activity-total");
    const today = document.getElementById("admin-activity-today");
    const people = document.getElementById("admin-activity-people");
    if (total) total.textContent = String(records.length);
    if (today)
      today.textContent = String(
        records.filter((e) => dayKey(e.createdAt) === dayKey(Date.now()))
          .length,
      );
    if (people) people.textContent = String(managers.length);
    const count = document.getElementById("admin-activity-matches");
    if (count)
      count.textContent = `${selected.length} ${selected.length === 1 ? "запис" : "записів"}`;
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
      if (el.dataset.orderHistoryCount === String(id))
        el.textContent = String(forOrder(id).length);
    });
  }
  function resetFilters() {
    const search = document.getElementById("admin-activity-search");
    if (search) search.value = "";
    for (const id of [
      "admin-activity-type",
      "admin-activity-period",
      "admin-activity-manager",
    ]) {
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
    document.addEventListener(
      "click",
      (event) => {
        const summary = event.target.closest?.(".admin-order-history__toggle");
        if (!summary) return;
        const details = summary.closest("[data-order-history]");
        if (!details) return;
        if (details.open) openOrders.delete(details.dataset.orderHistory);
        else openOrders.add(details.dataset.orderHistory);
      },
      true,
    );
    panel.addEventListener("input", (event) => {
      if (event.target.id === "admin-activity-search") renderGlobal();
    });
    panel.addEventListener("change", (event) => {
      if (
        [
          "admin-activity-type",
          "admin-activity-period",
          "admin-activity-manager",
        ].includes(event.target.id)
      )
        renderGlobal();
    });
    panel.addEventListener("click", (event) => {
      if (event.target.closest("[data-activity-reset]")) {
        resetFilters();
        return;
      }
      if (event.target.closest("[data-activity-examples]")) {
        showExamples = !showExamples;
        renderGlobal();
      }
      const button = event.target.closest("[data-activity-open-order]");
      if (button) {
        const id = button.dataset.activityOpenOrder;
        if (id === "AK-ДЕМО") return;
        document.querySelector('[data-admin-tab="panel-orders"]')?.click();
        const search = document.getElementById("admin-search");
        if (search) {
          search.value = id;
          search.dispatchEvent(new Event("input", { bubbles: true }));
        }
        document.getElementById("admin-status-filter").value = "all";
        document
          .getElementById("admin-status-filter")
          .dispatchEvent(new Event("change", { bubbles: true }));
        requestAnimationFrame(() => {
          const card = [...document.querySelectorAll(".admin-order-card")].find(
            (el) => el.dataset.orderId === id,
          );
          card?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    });
    document.addEventListener("astel:activity-recorded", (event) => {
      renderGlobal();
      if (event.detail.entityType === "order")
        refreshOrder(event.detail.entityId);
    });
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        renderGlobal();
        document
          .querySelectorAll("[data-order-history]")
          .forEach((el) => refreshOrder(el.dataset.orderHistory));
      }
    });
    renderGlobal();
  }
  if (typeof document !== "undefined")
    document.addEventListener("DOMContentLoaded", bindUI);
  return Object.freeze({
    STORAGE_KEY,
    TYPES,
    actor,
    record,
    read,
    forOrder,
    orderSection,
    renderGlobal,
    rowsHTML,
    refreshOrder,
  });
})();

if (typeof module !== "undefined") module.exports = AstelAdminActivity;
