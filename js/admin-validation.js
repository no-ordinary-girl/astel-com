/* Astel-Com back-office validation UI. Ukrainian messages independent of
   browser language. Works with dynamically generated order/product forms. */
(function (root) {
  "use strict";

  const ERROR_CLASS = "admin-validation-error";
  const INVALID_CLASS = "admin-validation-invalid";
  const errors = new WeakMap();
  let nextId = 0;

  function messageFor(field) {
    if (!field || field.willValidate === false) return "";
    const v = field.validity;
    if (!v || v.valid) return "";
    if (v.customError)
      return field.validationMessage || "Перевірте значення цього поля.";
    if (v.valueMissing) {
      // Each required field retains its own actionable inline explanation.
      // The generic «Заповніть пропущені поля!» belongs ONLY to the toast.
      const requiredMessages = {
        id: "ID: 3–70 символів, тільки малі латинські літери, цифри й дефіси.",
        price: "Вкажіть ціну від 1 до 99 999 999 грн.",
        uk: "Вкажіть назву категорії українською.",
        en: "Перекладіть назву категорії англійською.",
        title: "Вкажіть назву товару українською.",
        titleEn: "Перекладіть назву товару англійською.",
        description: "Вкажіть опис товару українською.",
        descriptionEn: "Перекладіть опис товару англійською.",
        category: "Оберіть категорію товару.",
        saleTermsCode: "Оберіть умови продажу.",
        firstName: "Вкажіть ім’я отримувача.",
        lastName: "Вкажіть прізвище отримувача.",
        phone: "Вкажіть номер телефону.",
        email: "Вкажіть адресу електронної пошти.",
        city: "Оберіть або введіть місто доставки.",
        branchChoice: "Оберіть відділення або адресу доставки.",
        branchManual: "Вкажіть адресу доставки.",
      };
      if (requiredMessages[field.name]) return requiredMessages[field.name];
      if (field.hasAttribute?.("data-doc-title"))
        return "Вкажіть назву документа українською.";
      if (field.hasAttribute?.("data-doc-title-en"))
        return "Перекладіть назву документа англійською.";
      if (field.hasAttribute?.("data-spec-title"))
        return "Вкажіть назву таблиці українською.";
      if (field.hasAttribute?.("data-spec-title-en"))
        return "Перекладіть назву таблиці англійською.";
      if (field.hasAttribute?.("data-spec-label"))
        return "Вкажіть назву характеристики українською.";
      if (field.hasAttribute?.("data-spec-label-en"))
        return "Перекладіть назву характеристики англійською.";
      if (field.hasAttribute?.("data-spec-value"))
        return "Вкажіть значення характеристики українською.";
      if (field.hasAttribute?.("data-spec-value-en"))
        return "Перекладіть значення характеристики англійською.";
      if (field.tagName === "SELECT") return "Оберіть значення зі списку.";
      if (field.type === "file") return "Додайте необхідний файл.";
      if (field.type === "checkbox") return "Підтвердіть вибір.";
      if (field.type === "radio") return "Оберіть один із варіантів.";
      return "Заповніть це поле.";
    }
    if (v.typeMismatch) {
      if (field.type === "email")
        return "Введіть коректну адресу електронної пошти.";
      if (field.type === "url") return "Введіть коректне посилання.";
      return "Введіть коректне значення.";
    }
    if (v.patternMismatch) {
      if (field.name === "id")
        return "ID: 3–70 символів, лише малі латинські літери, цифри й дефіси.";
      return "Перевірте формат цього поля.";
    }
    if (v.badInput) return "Введіть коректне число.";
    if (v.rangeUnderflow) return `Значення має бути не меншим за ${field.min}.`;
    if (v.rangeOverflow) return `Значення має бути не більшим за ${field.max}.`;
    if (v.stepMismatch) return "Введіть значення з дозволеним кроком.";
    if (v.tooShort) return `Мінімальна довжина — ${field.minLength} символів.`;
    if (v.tooLong) return `Максимальна довжина — ${field.maxLength} символів.`;
    return "Перевірте значення цього поля.";
  }

  function clearField(field) {
    const previous = errors.get(field);
    if (!previous) return;
    previous.node.remove();
    errors.delete(field);
    field.classList?.remove(INVALID_CLASS);
    if (previous.originalAriaInvalid === null)
      field.removeAttribute("aria-invalid");
    else field.setAttribute("aria-invalid", previous.originalAriaInvalid);
    if (previous.originalDescribedBy === null)
      field.removeAttribute("aria-describedby");
    else field.setAttribute("aria-describedby", previous.originalDescribedBy);
  }

  function reportField(field, message, options = {}) {
    if (!field || !message) return;
    let entry = errors.get(field);
    if (!entry) {
      const node = document.createElement("span");
      node.className = ERROR_CLASS;
      node.id = `admin-validation-message-${++nextId}`;
      node.setAttribute("role", "alert");
      const originalAriaInvalid = field.getAttribute("aria-invalid");
      const originalDescribedBy = field.getAttribute("aria-describedby");
      field.insertAdjacentElement("afterend", node);
      entry = {
        node,
        originalAriaInvalid,
        originalDescribedBy,
        manual: !!options.manual,
      };
      errors.set(field, entry);
      field.setAttribute(
        "aria-describedby",
        [originalDescribedBy, node.id].filter(Boolean).join(" "),
      );
    }
    entry.node.textContent = message;
    entry.manual = !!options.manual;
    field.classList.add(INVALID_CLASS);
    field.setAttribute("aria-invalid", "true");
  }

  function activateLanguageIfNeeded(field) {
    const language = field.closest("[data-editor-field-lang]")?.dataset
      .editorFieldLang;
    const form = field.closest(".admin-language-editor");
    if (
      language &&
      form &&
      typeof root.AstelProductEditor?.selectLanguage === "function"
    ) {
      root.AstelProductEditor.selectLanguage(form, language);
    }
  }

  function focusFirst(field) {
    if (!field) return;
    activateLanguageIfNeeded(field);
    try {
      field.focus({ preventScroll: true });
    } catch (_) {
      field.focus?.();
    }
    field.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }

  function validateForm(form, options = {}) {
    if (!form) return true;
    let firstInvalid = null;
    let count = 0;
    // Do not call reportValidity(): native popups would use browser language.
    for (const field of form.querySelectorAll("input, select, textarea")) {
      if (field.disabled || field.willValidate === false) continue;
      const message = messageFor(field);
      if (message) {
        reportField(field, message);
        if (!firstInvalid) firstInvalid = field;
        count++;
      } else if (errors.has(field) && !errors.get(field).manual) {
        clearField(field);
      }
    }
    if (count && options.focus !== false) focusFirst(firstInvalid);
    return count === 0;
  }

  function clearForm(form) {
    form?.querySelectorAll?.("input, select, textarea").forEach(clearField);
  }

  function prepareForms(rootNode) {
    if (!rootNode) return;
    if (rootNode.matches?.("form")) rootNode.noValidate = true;
    rootNode.querySelectorAll?.("form").forEach((form) => {
      form.noValidate = true;
    });
  }

  function init() {
    prepareForms(document);
    if (typeof MutationObserver === "function") {
      const observer = new MutationObserver((changes) => {
        for (const change of changes) {
          for (const node of change.addedNodes) {
            if (node.nodeType === 1) prepareForms(node);
          }
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Native invalid events can still arise from script-triggered checks or a
  // dynamically inserted form. Prevent the browser-language tooltip entirely.
  document.addEventListener(
    "invalid",
    (event) => {
      if (!event.target?.matches?.("input, select, textarea")) return;
      event.preventDefault();
      const message = messageFor(event.target);
      if (message) reportField(event.target, message);
    },
    true,
  );

  // Capture before the admin's normal submit handlers. Invalid forms never
  // reach code that creates categories, saves orders, or creates products.
  document.addEventListener(
    "submit",
    (event) => {
      if (!event.target?.matches?.("form")) return;
      if (!validateForm(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        // The toast is a general summary; inline messages stay field-specific.
        if (typeof CustomEvent === "function" && document.dispatchEvent) {
          document.dispatchEvent(
            new CustomEvent("astel:admin-validation-failed"),
          );
        }
      }
    },
    true,
  );

  for (const name of ["input", "change"]) {
    document.addEventListener(
      name,
      (event) => {
        const field = event.target;
        if (!errors.has(field)) return;
        const entry = errors.get(field);
        if (entry.manual) {
          // Business-rule errors (TTN, price) are reevaluated by their own logic.
          clearField(field);
          return;
        }
        const message = messageFor(field);
        if (message) reportField(field, message);
        else clearField(field);
      },
      true,
    );
  }
  document.addEventListener("reset", (event) => clearForm(event.target), true);

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  const api = {
    messageFor,
    reportField,
    clearField,
    clearForm,
    validateForm,
    focusFirst,
  };
  root.AstelAdminValidation = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
