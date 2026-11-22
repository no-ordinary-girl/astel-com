const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const adminSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'admin.js'),
  'utf8',
);

test('incomplete product forms use a single generic toast message', () => {
  const message = 'showUndoToast("Заповніть пропущені поля!", null);';
  const count = adminSource.split(message).length - 1;
  assert.equal(count, 4, 'existing-product form, translations, native invalid-submit handling, and new-product form use same toast');
  assert.doesNotMatch(adminSource, /showUndoToast\(\s*AstelProductEditor\.validationMessage/);
});

test('inline bilingual validation remains responsible for field-specific errors', () => {
  assert.match(adminSource, /AstelAdminValidation\.validateForm\(form\)/);
  assert.match(adminSource, /AstelProductEditor\.validateTranslations\(form\)/);
  assert.match(adminSource, /AstelProductEditor\.validateTranslations\(addProductForm\)/);
});
