/* Checkout city and pickup-point pickers. Frontend-only directory data.
   Popups are mounted in <body> to avoid clipping by cards or mobile containers.
   They are not native <select> controls; users can still enter an address manually.
*/
const CheckoutAutocomplete = (() => {
  function init({ language = "uk" } = {}) {
    const cityInput = document.getElementById("city");
    const cityList = document.getElementById("city-dropdown");
    const deliveryGroup = document.getElementById("delivery-group");
    if (!cityInput || !cityList || !deliveryGroup || typeof DeliveryDirectory === "undefined") return;

    const english = language === "en";
    const messages = english
      ? { city: "Show cities", branch: "Show pickup locations", noCity: "No matching cities", noBranch: "No matching pickup locations", loading: "Loading options…" }
      : { city: "Показати міста", branch: "Показати відділення та поштомати", noCity: "Населений пункт не знайдено", noBranch: "Відділень за запитом не знайдено", loading: "Завантаження варіантів…" };

    const pickers = [];
    let activePicker = null;

    function close(picker) {
      if (!picker || !picker.open) return;
      picker.open = false;
      picker.requestId++;
      picker.list.classList.remove("is-open");
      picker.button.setAttribute("aria-expanded", "false");
      picker.input.setAttribute("aria-expanded", "false");
      picker.button.classList.remove("is-open");
      picker.highlight = -1;
      if (activePicker === picker) activePicker = null;
    }

    function reposition(picker) {
      if (!picker.open) return;
      const rect = picker.wrap.getBoundingClientRect();
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewHeight) {
        close(picker);
        return;
      }
      const width = Math.min(rect.width, viewWidth - 16);
      const left = Math.max(8, Math.min(rect.left, viewWidth - width - 8));
      const below = viewHeight - rect.bottom;
      const above = rect.top;
      const opensAbove = below < 170 && above > below;
      const height = Math.min(230, Math.max(90, (opensAbove ? above : below) - 12));
      picker.list.style.width = `${width}px`;
      picker.list.style.left = `${left}px`;
      picker.list.style.maxHeight = `${height}px`;
      picker.list.style.top = opensAbove ? "auto" : `${rect.bottom + 4}px`;
      picker.list.style.bottom = opensAbove ? `${viewHeight - rect.top + 4}px` : "auto";
    }

    function showRows(picker, rows) {
      picker.list.replaceChildren();
      picker.rows = rows;
      picker.highlight = -1;
      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "autocomplete-empty";
        empty.textContent = picker.emptyMessage;
        picker.list.appendChild(empty);
      } else {
        rows.forEach((row, index) => {
          const option = document.createElement("button");
          option.type = "button";
          option.className = "autocomplete-item";
          option.setAttribute("role", "option");
          option.setAttribute("aria-selected", "false");
          option.id = `${picker.list.id}-option-${index}`;
          const main = document.createElement("span");
          main.className = "autocomplete-item__main";
          main.textContent = row.main;
          const sub = document.createElement("span");
          sub.className = "autocomplete-item__sub";
          sub.textContent = row.sub || "";
          option.append(main, sub);
          option.addEventListener("pointerdown", (event) => event.preventDefault());
          option.addEventListener("click", () => selectRow(picker, index));
          picker.list.appendChild(option);
        });
      }
      reposition(picker);
    }

    function highlightRow(picker, index) {
      const options = picker.list.querySelectorAll('[role="option"]');
      if (!options.length) return;
      picker.highlight = Math.max(0, Math.min(index, options.length - 1));
      options.forEach((option, i) => {
        option.classList.toggle("is-highlighted", i === picker.highlight);
        option.setAttribute("aria-selected", i === picker.highlight ? "true" : "false");
      });
      picker.input.setAttribute("aria-activedescendant", options[picker.highlight].id);
      options[picker.highlight].scrollIntoView({ block: "nearest" });
    }

    function selectRow(picker, index) {
      const row = picker.rows[index];
      if (!row) return;
      picker.input.value = row.value;
      picker.onSelect?.(row.value);
      picker.input.dispatchEvent(new Event("change", { bubbles: true }));
      close(picker);
      picker.input.removeAttribute("aria-activedescendant");
    }

    async function open(picker, showAll = false) {
      if (activePicker && activePicker !== picker) close(activePicker);
      activePicker = picker;
      picker.open = true;
      picker.list.classList.add("is-open");
      picker.button.classList.add("is-open");
      picker.button.setAttribute("aria-expanded", "true");
      picker.input.setAttribute("aria-expanded", "true");
      const requestId = ++picker.requestId;
      if (picker.isAsync) {
        picker.list.replaceChildren();
        const loading = document.createElement("div");
        loading.className = "autocomplete-empty";
        loading.textContent = messages.loading;
        picker.list.appendChild(loading);
        reposition(picker);
      }
      try {
        // Saved city/branch text is a selection, not a new search query.
        // On focus or arrow click, show available choices; filter only while typing.
        const rows = await picker.getRows(showAll ? "" : picker.input.value);
        if (picker.open && requestId === picker.requestId) showRows(picker, rows);
      } catch (error) {
        if (picker.open && requestId === picker.requestId) showRows(picker, []);
      }
    }

    function attach(input, list, getRows, onSelect, label, emptyMessage, isAsync) {
      const wrap = input.closest(".autocomplete-wrap");
      if (!wrap || !list) return null;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "autocomplete-toggle";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-controls", list.id);
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      wrap.appendChild(button);
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-haspopup", "listbox");
      input.setAttribute("aria-controls", list.id);
      input.setAttribute("aria-expanded", "false");
      list.setAttribute("role", "listbox");
      list.classList.add("checkout-autocomplete-popup");
      // The portal is necessary for file:// previews and narrow checkout cards.
      document.body.appendChild(list);
      const picker = { wrap, input, list, button, getRows, onSelect, emptyMessage, isAsync, rows: [], open: false, requestId: 0, highlight: -1 };
      pickers.push(picker);

      input.addEventListener("focus", () => open(picker, true));
      input.addEventListener("click", () => { if (!picker.open) open(picker, true); });
      input.addEventListener("input", () => open(picker));
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!picker.open) { open(picker, true); return; }
          highlightRow(picker, picker.highlight + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Enter" && picker.open) {
          event.preventDefault(); // Never submit checkout while selecting a suggestion.
          if (picker.rows.length) selectRow(picker, Math.max(0, picker.highlight));
        } else if (event.key === "Escape") {
          close(picker);
        } else if (event.key === "Tab") {
          close(picker);
        }
      });
      button.addEventListener("pointerdown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        if (picker.open) close(picker);
        else { input.focus({ preventScroll: true }); if (!picker.open) open(picker, true); }
      });
      return picker;
    }

    const branchInputs = Array.from(deliveryGroup.querySelectorAll(".branch-input"));
    function resetBranches() { branchInputs.forEach((input) => { input.value = ""; }); }
    cityInput.addEventListener("input", resetBranches);
    attach(
      cityInput, cityList,
      (query) => DeliveryDirectory.searchCities(query).map((city) => ({
        value: city.name, main: `${english ? "" : "м. "}${city.name}`, sub: city.oblast,
      })),
      () => { resetBranches(); document.getElementById("field-city")?.classList.remove("has-error"); },
      messages.city, messages.noCity, false,
    );

    deliveryGroup.querySelectorAll(".radio-card[data-carrier]").forEach((card) => {
      const carrier = card.dataset.carrier;
      const input = card.querySelector(".branch-input");
      const list = card.querySelector(".branch-dropdown");
      if (!input || !list) return;
      attach(input, list, async (query) => {
        const type = card.querySelector(`input[name="${carrier}_type"]:checked`)?.value || "Відділення";
        const city = cityInput.value.trim() || "Київ";
        const branches = await DeliveryDirectory.getBranches(carrier, type, city, query);
        return branches.map((branch) => ({ value: branch.title, main: branch.title, sub: branch.subtitle }));
      }, () => input.closest(".form-field")?.classList.remove("has-error"),
      messages.branch, messages.noBranch, true);
      card.querySelectorAll(`input[name="${carrier}_type"]`).forEach((radio) => {
        radio.addEventListener("change", () => { input.value = ""; close(activePicker); });
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (activePicker && !activePicker.wrap.contains(event.target) && !activePicker.list.contains(event.target)) close(activePicker);
    });
    document.addEventListener("focusin", (event) => {
      if (activePicker && !activePicker.wrap.contains(event.target) && !activePicker.list.contains(event.target)) close(activePicker);
    });
    window.addEventListener("resize", () => { if (activePicker) reposition(activePicker); });
    window.addEventListener("scroll", () => { if (activePicker) reposition(activePicker); }, true);
  }
  return { init };
})();
