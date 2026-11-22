'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../js/admin-new-product.js'), 'utf8');
const reported = [];
const sandbox = {
  AstelAdminValidation: {
    reportField(input, message) { reported.push({ input, message }); },
    clearField() {},
  },
  module: { exports: {} },
};
vm.runInNewContext(code, sandbox);
const editor = sandbox.module.exports;

function input(value = '', lang = 'uk') {
  const classes = new Set();
  return {
    value,
    placeholder: '',
    classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); } },
    setAttribute() {}, removeAttribute() {},
    closest(selector) { return selector === '[data-editor-field-lang]' ? { dataset: { editorFieldLang: lang } } : null; },
    focus() { this.focused = true; }, scrollIntoView() {},
  };
}
function makeRow(data = {}) {
  const fields = {
    '[data-spec-label]': input(data.label || '', 'uk'),
    '[data-spec-label-en]': input(data.labelEn || '', 'en'),
    '[data-spec-value]': input(data.value || '', 'uk'),
    '[data-spec-value-en]': input(data.valueEn || '', 'en'),
  };
  return { fields, querySelector(sel) { return fields[sel] || null; } };
}
function makeForm({ title = 'Технічні характеристики', titleEn = 'Technical Specifications', rows = [makeRow()], products = ['Тестовий модем', 'Test modem'] } = {}) {
  const titleUkInput = input(title, 'uk');
  const titleEnInput = input(titleEn, 'en');
  const section = {
    querySelector(sel) {
      if (sel === '[data-spec-title]') return titleUkInput;
      if (sel === '[data-spec-title-en]') return titleEnInput;
      return null;
    },
    querySelectorAll(sel) { return sel === '.admin-spec-row' ? rows : []; },
  };
  const form = {
    dataset: {},
    querySelector(sel) {
      if (sel === '[name="title"]') return inputUk;
      if (sel === '[name="titleEn"]') return inputEn;
      return null;
    },
    querySelectorAll(sel) { return sel === '.admin-spec-section' ? [section] : []; },
  };
  const inputUk = input(products[0], 'uk');
  const inputEn = input(products[1], 'en');
  return { form, rows, section, titleUkInput, titleEnInput };
}

// A newly added blank table cannot be saved with zero characteristics.
const empty = makeForm();
assert.equal(editor.validateTranslations(empty.form), false);
assert.equal(empty.form.dataset.editorLanguage, 'uk');
assert.equal(editor.validationMessage(empty.form), 'Вкажіть назву характеристики українською.');
assert.equal(empty.rows[0].fields['[data-spec-label]'].focused, true);
assert.ok(reported.some(({ message }) => message === 'Вкажіть значення характеристики українською.'));

// A partially filled row requires its Ukrainian value before translation prompts.
const partial = makeForm({ rows: [makeRow({ label: 'Частота' })] });
assert.equal(editor.validateTranslations(partial.form), false);
assert.equal(editor.validationMessage(partial.form), 'Вкажіть значення характеристики українською.');
assert.equal(partial.form.dataset.editorLanguage, 'uk');

// Once Ukrainian fields are complete, the editor moves to missing English fields.
const noEnglish = makeForm({ rows: [makeRow({ label: 'Частота', value: '900 МГц' })] });
assert.equal(editor.validateTranslations(noEnglish.form), false);
assert.equal(noEnglish.form.dataset.editorLanguage, 'en');
assert.match(editor.validationMessage(noEnglish.form), /Перекладіть «Частота» англійською/);

// Completed characteristic is accepted, with its bilingual values preserved.
const completed = makeForm({ rows: [makeRow({ label: 'Частота', labelEn: 'Frequency', value: '900 МГц', valueEn: '900 MHz' })] });
assert.equal(editor.validateTranslations(completed.form), true);
const extracted = editor.extractSections(completed.form);
assert.equal(extracted.length, 1);
assert.equal(extracted[0].rows.length, 1);
assert.equal(extracted[0].rows[0].label, 'Частота');

// Extra fully blank rows are optional, but a half-filled additional row is not.
const extraBlank = makeForm({ rows: [makeRow({ label: 'Частота', labelEn: 'Frequency', value: '900 МГц', valueEn: '900 MHz' }), makeRow()] });
assert.equal(editor.validateTranslations(extraBlank.form), true);
assert.equal(editor.extractSections(extraBlank.form)[0].rows.length, 1);
const extraPartial = makeForm({ rows: [makeRow({ label: 'Частота', labelEn: 'Frequency', value: '900 МГц', valueEn: '900 MHz' }), makeRow({ label: 'Вага' })] });
assert.equal(editor.validateTranslations(extraPartial.form), false);
assert.equal(editor.validationMessage(extraPartial.form), 'Вкажіть значення характеристики українською.');

console.log('PASS: A table requires one complete characteristic; incomplete rows are guided in Ukrainian before English');
