/* Ukrainian native-form validation messages for the admin dashboard.
   Browsers normally localize validation bubbles using their UI language,
   regardless of <html lang="uk">. This affects only this admin page. */
(() => {
  "use strict";

  // Only clear messages that this helper created. Preserve any future
  // field-specific custom validation set by other admin modules.
  const localized = new WeakSet();

  function clearLocalized(field) {
    if (!field || !localized.has(field)) return;
    field.setCustomValidity("");
    localized.delete(field);
  }

  function messageFor(field) {
    const v = field.validity;
    if (!v) return "";
    if (v.valueMissing) {
      if (field.tagName === "SELECT") return "Оберіть значення зі списку.";
      if (field.type === "file") return "Виберіть файл.";
      if (field.type === "checkbox") return "Установіть цей прапорець.";
      return "Заповніть це поле.";
    }
    if (v.typeMismatch) {
      return field.type === "email"
        ? "Введіть коректну адресу електронної пошти."
        : "Введіть коректне значення.";
    }
    if (v.patternMismatch) {
      if (field.name === "id")
        return "Використовуйте 3–70 символів: латинські літери, цифри або дефіс.";
      return "Перевірте формат цього поля.";
    }
    if (v.tooShort) return `Мінімальна довжина: ${field.minLength} символів.`;
    if (v.tooLong) return `Введіть не більше ${field.maxLength} символів.`;
    if (v.rangeUnderflow) return `Значення має бути не меншим за ${field.min}.`;
    if (v.rangeOverflow) return `Значення має бути не більшим за ${field.max}.`;
    if (v.stepMismatch) return "Введіть значення з дозволеним кроком.";
    if (v.badInput) return "Введіть коректне числове значення.";
    return "";
  }

  // 'invalid' doesn't bubble; capture also covers dynamically created fields.
  document.addEventListener("invalid", (event) => {
    const field = event.target;
    if (typeof field?.setCustomValidity !== "function") return;

    clearLocalized(field);
    const message = messageFor(field);
    if (!message) return; // Don't overwrite validation from other modules.
    field.setCustomValidity(message);
    localized.add(field);
  }, true);

  for (const type of ["input", "change"]) {
    document.addEventListener(type, (event) => clearLocalized(event.target), true);
  }
  document.addEventListener("reset", (event) => {
    event.target?.querySelectorAll?.("input, select, textarea")
      .forEach(clearLocalized);
  }, true);
})();
