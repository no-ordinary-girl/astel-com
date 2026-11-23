'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/admin-delivery-picker.css'), 'utf8');

test('Admin branch field uses a clickable, editable dropdown rather than native datalist', () => {
  assert.match(admin, /data-admin-branch-input/);
  assert.match(admin, /data-admin-branch-toggle/);
  assert.match(admin, /data-admin-branch-option/);
  assert.match(admin, /role="combobox"/);
  assert.match(admin, /role="listbox"/);
  assert.doesNotMatch(admin, /<datalist id="admin-branch-list-/);
  assert.match(admin, /DeliveryDirectory\.getBranches\(/);
  assert.match(admin, /openAdminBranchPicker\(form\)/);
  assert.match(admin, /orderAddressDrafts\.set\(form\.dataset\.orderEditor, input\.value\)/);
  assert.match(css, /admin-branch-picker__options/);
  assert.match(html, /css\/admin-delivery-picker\.css/);
  assert.match(html, /js\/admin-customers\.js/, 'Keep customer management initialization intact');
});

test('The admin and customer checkout share the same regional options', async () => {
  const directorySource = fs.readFileSync(path.join(root, 'js/delivery-data.js'), 'utf8');
  const Directory = vm.runInNewContext(directorySource + '\nDeliveryDirectory;', {
    fetch: () => Promise.reject(new Error('offline fixture')),
  });
  const lviv = await Directory.getBranches('nova', 'Відділення', 'Львів');
  const kyiv = await Directory.getBranches('nova', 'Відділення', 'Київ');
  const lockers = await Directory.getBranches('nova', 'Поштомат', 'Львів');
  assert.ok(lviv.length >= 2);
  assert.ok(kyiv.length >= 2);
  assert.ok(lviv.every(entry => entry.title.startsWith('Відділення')));
  assert.ok(lockers.every(entry => entry.title.includes('Поштомат')));
  assert.notEqual(lviv[0].title, kyiv[0].title);
});
