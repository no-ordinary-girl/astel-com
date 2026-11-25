/* Shared, progressively enhanced select menu for the storefront and admin.
   The original <select> remains the form's source of truth, so existing value,
   validation and change handlers continue to work without modification. */
(() => {
  "use strict";
  const controls = new WeakMap();
  let active = null;
  let nextId = 0;

  function selectedText(select) {
    return select.selectedOptions[0]?.textContent?.trim() ||
      (document.documentElement.lang === "en" ? "Choose an option" : "Оберіть значення");
  }

  function sync(select) {
    const ui = controls.get(select);
    if (!ui) return;
    ui.label.textContent = selectedText(select);
    ui.button.disabled = select.disabled;
    ui.button.setAttribute("aria-disabled", String(select.disabled));
    if (active?.select === select) {
      const selected = active.menu.querySelector('[role="option"][aria-selected="true"]');
      selected?.setAttribute("aria-selected", "false");
      active.menu.querySelector(`[data-select-index="${select.selectedIndex}"]`)?.setAttribute("aria-selected", "true");
    }
  }

  function close(restoreFocus = false) {
    if (!active) return;
    const { menu, button } = active;
    active = null;
    button.setAttribute("aria-expanded", "false");
    menu.remove();
    if (restoreFocus && button.isConnected) button.focus({ preventScroll: true });
  }

  function position(button, menu) {
    const r = button.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(window.innerWidth - margin * 2, Math.max(r.width, 220));
    const left = Math.min(Math.max(margin, r.left), window.innerWidth - width - margin);
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const up = below < 180 && above > below;
    const space = Math.max(110, up ? above - 6 : below - 6);
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${Math.min(space, 320)}px`;
    menu.style.left = `${left}px`;
    menu.style.top = up ? "auto" : `${r.bottom + 5}px`;
    menu.style.bottom = up ? `${window.innerHeight - r.top + 5}px` : "auto";
  }

  function enabledOptions(menu) {
    return [...menu.querySelectorAll('[role="option"]:not([aria-disabled="true"])')];
  }

  function focusOption(item) {
    if (!item) return;
    item.focus({ preventScroll: true });
    item.scrollIntoView({ block: "nearest" });
  }

  function choose(item) {
    if (!active || item.getAttribute("aria-disabled") === "true") return;
    const select = active.select;
    const index = Number(item.dataset.selectIndex);
    const changed = select.selectedIndex !== index;
    select.selectedIndex = index;
    close(true);
    sync(select);
    if (changed) {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function open(select) {
    const ui = controls.get(select);
    if (!ui || select.disabled) return;
    if (active?.select === select) return close(true);
    close();
    sync(select);
    const menu = document.createElement("div");
    menu.id = ui.id;
    menu.className = "astel-select__popup";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", ui.name);

    let optionIndex = 0;
    for (const child of select.children) {
      if (child.tagName === "OPTGROUP") {
        const heading = document.createElement("div");
        heading.className = "astel-select__group";
        heading.textContent = child.label;
        menu.append(heading);
      }
      const options = child.tagName === "OPTGROUP" ? [...child.children] : [child];
      for (const option of options) {
        if (option.tagName !== "OPTION") continue;
        const item = document.createElement("div");
        const disabled = option.disabled || (child.tagName === "OPTGROUP" && child.disabled);
        item.className = "astel-select__option";
        item.tabIndex = -1;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option.selected));
        if (disabled) item.setAttribute("aria-disabled", "true");
        item.dataset.selectIndex = String(optionIndex++);
        item.textContent = option.textContent.trim();
        menu.append(item);
      }
    }
    if (!optionIndex) {
      close();
      return;
    }
    document.body.append(menu); // Escapes overflowing table containers and dialogs.
    active = { select, button: ui.button, menu };
    ui.button.setAttribute("aria-expanded", "true");
    position(ui.button, menu);
    menu.addEventListener("click", (event) => {
      const item = event.target.closest('[role="option"]');
      if (item) choose(item);
    });
    focusOption(menu.querySelector(`[data-select-index="${select.selectedIndex}"]:not([aria-disabled="true"])`) || enabledOptions(menu)[0]);
  }

  function enhance(select) {
    if (controls.has(select) || select.closest('[data-native-select]')) return;
    const wrapper = document.createElement("span");
    wrapper.className = "astel-select";
    if (select.classList.contains("admin-inventory-select")) wrapper.classList.add("astel-select--inventory");
    if (select.id === "admin-status-filter") wrapper.classList.add("astel-select--filter");
    if (select.closest(".admin-edit-add-row")) wrapper.classList.add("astel-select--product-picker");
    if (select.classList.contains("acct-input")) wrapper.classList.add("astel-select--account");
    const name = select.getAttribute("aria-label") ||
      select.closest("label")?.firstChild?.textContent?.trim() ||
      (document.documentElement.lang === "en" ? "Select" : "Вибір");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "astel-select__trigger";
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", name);
    const id = `astel-select-list-${++nextId}`;
    button.setAttribute("aria-controls", id);
    const label = document.createElement("span");
    label.className = "astel-select__value";
    const arrow = document.createElement("span");
    arrow.className = "astel-select__chevron";
    arrow.setAttribute("aria-hidden", "true");
    arrow.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    button.append(label, arrow);
    select.before(wrapper);
    wrapper.append(select, button);
    select.classList.add("astel-select__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    controls.set(select, { wrapper, button, label, id, name });
    sync(select);
    button.addEventListener("click", () => open(select));
    button.addEventListener("keydown", (e) => {
      // Enter and Space already generate a native button click. Intercepting
      // them here would open and then immediately close the popup.
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (active?.select !== select) open(select);
      }
    });
    select.addEventListener("change", () => sync(select));
    select.addEventListener("input", () => sync(select));
    select.addEventListener("invalid", (event) => {
      event.preventDefault();
      button.focus();
    });
    select.form?.addEventListener("reset", () => queueMicrotask(() => sync(select)));
  }

  function discover(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches?.("select")) enhance(node);
    node.querySelectorAll?.("select").forEach(enhance);
  }

  document.addEventListener("keydown", (event) => {
    if (!active) return;
    const { menu } = active;
    if (event.key === "Escape") { event.preventDefault(); close(true); return; }
    if (event.key === "Tab") { close(); return; }
    const options = enabledOptions(menu);
    const current = options.indexOf(document.activeElement);
    let next = current;
    if (event.key === "ArrowDown") next = Math.min(options.length - 1, current + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, current < 0 ? options.length - 1 : current - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (document.activeElement?.getAttribute("role") === "option") choose(document.activeElement);
      return;
    } else return;
    event.preventDefault();
    focusOption(options[next]);
  });
  document.addEventListener("pointerdown", (e) => {
    if (active && !active.menu.contains(e.target) && !active.button.contains(e.target)) close();
  }, true);
  window.addEventListener("resize", () => { if (active) position(active.button, active.menu); });
  window.addEventListener("scroll", (e) => {
    if (active && !active.menu.contains(e.target)) close();
  }, true);

  function init() {
    discover(document.body);
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) discover(node);
        const parentSelect = record.target.closest?.("select");
        if (parentSelect && controls.has(parentSelect)) {
          sync(parentSelect);
          if (active?.select === parentSelect) close(); // Options changed under an open menu.
        }
      }
      if (active && !active.select.isConnected) close();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["selected", "disabled", "label"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.AstelCustomSelect = Object.freeze({ refresh: () => document.querySelectorAll("select").forEach(sync) });
})();
