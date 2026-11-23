'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/admin.css'), 'utf8');
const AdminCustomers = require(path.join(root, 'js/admin-customers.js'));
function storage() {
  const memory = new Map();
  return {
    getItem: key => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(key, value),
  };
}

test('Notes created from the Orders tab are the same order-specific notes shown in Clients', () => {
  const store = storage();
  const key = AdminCustomers.keyFor({email:'buyer@example.com'});
  const orderIds = ['AK-111', 'AK-222'];
  AdminCustomers.addOrderNote(store, key, orderIds[0], 'Уточнити адресу', orderIds, 100);
  const profile = AdminCustomers.profileFor(AdminCustomers.read(store), key);
  assert.equal(AdminCustomers.notesForOrder(profile, 'AK-111')[0].text, 'Уточнити адресу');
  assert.deepEqual(AdminCustomers.notesForOrder(profile, 'AK-222'), []);
  assert.equal(AdminCustomers.countOrderNotes(profile, orderIds), 1);
  assert.throws(() => AdminCustomers.addOrderNote(store, key, 'UNRELATED', 'test', orderIds));
  AdminCustomers.deleteOrderNote(store, key, 'AK-111', profile.orderNotes['AK-111'][0].id, orderIds);
  const after = AdminCustomers.profileFor(AdminCustomers.read(store), key);
  assert.equal(AdminCustomers.countOrderNotes(after, orderIds), 0);
});

test('Order card gets a separate notes action and keeps manager editing state when notes are toggled', () => {
  assert.match(js, /data-admin-order-notes-toggle/);
  assert.match(js, /data-admin-order-note-form/);
  assert.match(js, /AdminCustomers\.addOrderNote\(/);
  assert.match(js, /AdminCustomers\.deleteOrderNote\(/);
  assert.match(js, /function refreshOrderNoteUI\(orderId\)/);
  const section = js.slice(js.indexOf('const notesToggle ='), js.indexOf('const editOrderBtn ='));
  assert.match(section, /refreshOrderNoteUI\(orderId\)/);
  assert.doesNotMatch(section, /renderDashboard\(\)/, 'Do not wipe unsaved order editor inputs by re-rendering');
  assert.match(js, /"Редагувати дані"/);
  assert.doesNotMatch(js, /"Редагувати дані, доставку й товари"/);
});

test('Attention indicator is styled; order-editor and mobile order-item layout are scoped', () => {
  assert.match(js, /admin-client-status__dot/);
  assert.match(css, /\.admin-order-card__badges \.admin-client-status\s*\{/);
  assert.match(css, /\.admin-order-editor select\.admin-select\s*\{[\s\S]*?padding-right:\s*42px;/);
  assert.match(css, /background-position:\s*right 16px center;/);
  assert.match(css, /\.admin-order-editor \.admin-edit-line__title,/);
  assert.match(css, /\.admin-order-item__sum\s*\{\s*grid-column:\s*2; grid-row:\s*2;/);
});
