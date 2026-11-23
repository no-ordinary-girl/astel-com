#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/products-data.js'), 'utf8');
const adminSrc = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const store = new Map();
const localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
};

// Old versions allowed default-category removal via localStorage. That must
// never make homepage links point to non-existent category filters again.
store.set('astelkom_catalog_removed_categories', JSON.stringify({
  gsm: true, nbiot: true, pos: true, antenna: true, cables: true,
}));
let ctx = vm.createContext({localStorage});
vm.runInContext(src, ctx);
const run = (js) => vm.runInContext(js, ctx);
const defaults = ['gsm', 'nbiot', 'pos', 'antenna', 'cables'];
for (const key of defaults) {
  assert.match(homepage, new RegExp(`products\\.html\\?category=${key}`));
  assert.equal(run(`CatalogManager.isFixedCategory(${JSON.stringify(key)})`), true);
  assert.ok(run(`CatalogManager.CATEGORIES[${JSON.stringify(key)}]`));
  assert.throws(() => run(`CatalogManager.deleteCategory(${JSON.stringify(key)})`), /Базову категорію не можна видалити/);
}

// Changing product assignments cannot make built-in categories deletable.
run('Object.values(PRODUCTS_DATA).forEach(p => { if (p.category === "gsm") p.category = "nbiot"; })');
assert.throws(() => run('CatalogManager.deleteCategory("gsm")'), /Базову категорію не можна видалити/);

// User-defined categories remain editable/deletable once no product uses them.
const key = run('CatalogManager.addCategory("Тестова категорія", "Test category")');
assert.equal(run(`CatalogManager.isFixedCategory(${JSON.stringify(key)})`), false);
assert.equal(run(`CatalogManager.CATEGORIES[${JSON.stringify(key)}]`), 'Тестова категорія');
assert.equal(run(`CatalogManager.deleteCategory(${JSON.stringify(key)})`), true);
assert.equal(run(`CatalogManager.CATEGORIES[${JSON.stringify(key)}]`), undefined);

// All five built-ins still exist after a new page session and localStorage reload.
ctx = vm.createContext({localStorage});
vm.runInContext(src, ctx);
for (const key of defaults) assert.ok(vm.runInContext(`CatalogManager.CATEGORIES.${key}`, ctx));

// The admin renders a lock for defaults, a delete button only for custom ones.
assert.match(adminSrc, /CatalogManager\.isFixedCategory\(key\)/);
assert.match(adminSrc, /admin-category-chip__fixed/);
assert.match(adminSrc, /data-delete-category/);
assert.match(adminSrc, /if \(CatalogManager\.isFixedCategory\(code\)\) return;/);
console.log('PASS permanent homepage categories, legacy restoration, custom deletion, admin safeguards');
