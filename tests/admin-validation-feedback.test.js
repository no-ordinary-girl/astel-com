'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const editorScript = fs.readFileSync(path.join(root, 'js/admin-new-product.js'), 'utf8');
const adminScript = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const inlineMessages = [];
const sandbox = {
  AstelAdminValidation: {
    reportField(field, message) { inlineMessages.push(message); },
    clearField() {},
  },
  module: { exports: {} },
};
vm.runInNewContext(editorScript, sandbox);
const editor = sandbox.module.exports;

function field(value, lang) {
  const classes = new Set();
  return {
    value,
    placeholder: '',
    classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); } },
    removeAttribute() {},
    setAttribute() {},
    closest(selector) { return selector === '[data-editor-field-lang]' ? { dataset: { editorFieldLang: lang } } : null; },
    focus() { this.focused = true; },
    scrollIntoView() {},
  };
}
function formWithNames(ukName, enName, ukDescription = '', enDescription = '') {
  const titleUk = field(ukName, 'uk');
  const titleEn = field(enName, 'en');
  const descUk = field(ukDescription, 'uk');
  const descEn = field(enDescription, 'en');
  const map = {
    '[name="title"]': titleUk,
    '[name="titleEn"]': titleEn,
    '[name="description"]': descUk,
    '[name="descriptionEn"]': descEn,
    '[data-editor-language-context]': null,
  };
  const form = {
    dataset: {},
    querySelector(selector) { return map[selector] ?? null; },
    querySelectorAll(selector) { return []; },
  };
  return { form, titleUk, titleEn, descUk, descEn };
}

const missingUkrainian = formWithNames('', '', 'опис тестового модему', '');
assert.equal(editor.validateTranslations(missingUkrainian.form), false);
assert.equal(editor.validationMessage(missingUkrainian.form), 'Вкажіть назву товару українською.');
assert.equal(missingUkrainian.form.dataset.editorLanguage, 'uk');
assert.ok(missingUkrainian.titleUk.focused);

const missingEnglish = formWithNames('Тестовий модем', '', 'опис тестового модему', '');
assert.equal(editor.validateTranslations(missingEnglish.form), false);
assert.match(editor.validationMessage(missingEnglish.form), /Перекладіть «Тестовий модем» англійською/);
assert.equal(missingEnglish.form.dataset.editorLanguage, 'en');

const valid = formWithNames('Тестовий модем', 'Test modem', 'Тестовий опис', 'Test description');
assert.equal(editor.validateTranslations(valid.form), true);
assert.equal(editor.validationMessage(valid.form), 'Виправте виділені поля перед збереженням.');
assert.match(adminScript, /AstelProductEditor\.validationMessage\(addProductForm\)/);
assert.match(adminScript, /AstelProductEditor\.validationMessage\(form\)/);
console.log('PASS: Specific Ukrainian or English validation feedback matches first invalid field');
