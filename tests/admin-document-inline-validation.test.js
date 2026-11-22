'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/admin-new-product.js'), 'utf8');
const reports = [];
const sandbox = {
  AstelAdminValidation: {
    reportField(field, message) { reports.push({ field, message }); },
    clearField() {},
  },
  module: { exports: {} },
};
vm.runInNewContext(source, sandbox);
const editor = sandbox.module.exports;

function field(value = '', language = 'uk', files = []) {
  const names = new Set();
  const attrs = new Map();
  return {
    value, files, placeholder: '', focused: false,
    classList: {
      add(name) { names.add(name); },
      remove(name) { names.delete(name); },
      contains(name) { return names.has(name); },
    },
    setAttribute(name, value) { attrs.set(name, value); },
    removeAttribute(name) { attrs.delete(name); },
    closest(selector) { return selector === '[data-editor-field-lang]' ? { dataset: { editorFieldLang: language } } : null; },
    focus() { this.focused = true; },
    scrollIntoView() {},
  };
}
function makeForm({ uk = '', en = '', files = [{ name: 'passport.pdf', type: 'application/pdf' }], original = false } = {}) {
  const titleUk = field(uk, 'uk');
  const titleEn = field(en, 'en');
  const fileInput = field('', 'uk', files);
  const productUk = field('Тестовий товар', 'uk');
  const productEn = field('Test product', 'en');
  const row = {
    dataset: original ? { originalDoc: '{"url":"docs/passport.pdf"}' } : {},
    querySelector(selector) {
      return ({ '[data-doc-title]': titleUk, '[data-doc-title-en]': titleEn, '[data-doc-file]': fileInput })[selector] || null;
    },
  };
  const all = [titleUk, titleEn, fileInput];
  const form = {
    dataset: {},
    querySelector(selector) { return ({ '[name="title"]': productUk, '[name="titleEn"]': productEn })[selector] || null; },
    querySelectorAll(selector) {
      if (selector === '.admin-document-row') return [row];
      if (selector === '.admin-translation-missing') return all.filter((x) => x.classList.contains('admin-translation-missing'));
      return [];
    },
  };
  return { form, titleUk, titleEn, fileInput };
}

const missingBoth = makeForm();
assert.equal(editor.validateTranslations(missingBoth.form), false, 'new PDF rows require both language titles');
assert.equal(missingBoth.form.dataset.editorLanguage, 'uk', 'Ukrainian missing fields are handled first');
assert.equal(missingBoth.titleUk.focused, true);
assert.ok(reports.some(({ field, message }) => field === missingBoth.titleUk && message === 'Вкажіть назву документа українською.'));
assert.ok(reports.some(({ field, message }) => field === missingBoth.titleEn && message === 'Вкажіть назву документа англійською.'));
assert.ok(missingBoth.titleUk.classList.contains('admin-translation-missing'));
assert.ok(missingBoth.titleEn.classList.contains('admin-translation-missing'));

const missingEnglish = makeForm({ uk: 'Паспорт модему' });
assert.equal(editor.validateTranslations(missingEnglish.form), false);
assert.equal(missingEnglish.form.dataset.editorLanguage, 'en', 'Missing PDF translations open the English tab');
assert.equal(missingEnglish.titleEn.focused, true);
assert.match(missingEnglish.titleEn.placeholder, /Перекладіть «Паспорт модему» англійською/);
missingEnglish.titleEn.value = 'Modem passport';
assert.equal(editor.validateTranslations(missingEnglish.form), true, 'Completing the English field clears the blocker');

const missingFile = makeForm({ uk: 'Паспорт модему', en: 'Modem passport', files: [] });
assert.equal(editor.validateTranslations(missingFile.form), false);
assert.ok(reports.some(({ field, message }) => field === missingFile.fileInput && message === 'Додайте PDF-файл.'));
assert.equal(missingFile.fileInput.focused, true);

const previousDoc = makeForm({ uk: 'Паспорт модему', en: 'Modem passport', files: [], original: true });
assert.equal(editor.validateTranslations(previousDoc.form), true, 'Existing attachment does not require a replacement upload');

// PDF validation is handled by the shared inline validator, not browser-language native popups.
assert.match(source, /markMissing\(titleUk, "Вкажіть назву документа українською\."/);
assert.doesNotMatch(source, /data-doc-file type="file"[^>]*required/);
console.log('PASS: PDF fields use inline Ukrainian validation, translation guidance and existing-file exceptions');
