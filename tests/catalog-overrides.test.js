#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const storage = new Map();
const localStorage = {
  getItem(k) { return storage.get(k) ?? null; },
  setItem(k,v) { storage.set(k,v); },
  removeItem(k) { storage.delete(k); },
};
const document = { addEventListener(){},querySelectorAll(){return [];} };
const ctx = vm.createContext({ localStorage,document });
function load(file) { vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),ctx,{filename:file}); }
function get(expr) { return vm.runInContext(expr,ctx); }
load('products-data.js');
load('cart.js');
get('CartManager.showToast = () => {};');
assert.equal(get('Object.keys(PRODUCTS_DATA).length'),15);
assert.equal(get('CatalogManager.validPrice("4300")'),4300);
for (const invalid of ['0','-1','1.5','1e6',' 10.1 ','100000000','abc','']) {
  assert.equal(get(`CatalogManager.validPrice(${JSON.stringify(invalid)})`),null,invalid);
}
assert.throws(()=>get('CatalogManager.updateProduct("com-900-485", {price: -2})'),/цілу ціну/);
assert.throws(()=>get('CatalogManager.updateProduct("ghost", {inStock:true})'),/Невідомий/);
get('CartManager.addItem(PRODUCTS_DATA["com-900-485"], 10)');
const orig=get('PRODUCTS_DATA["com-900-485"].numericPrice');
assert.equal(orig,4300);
get('CatalogManager.updateProduct("com-900-485", { price: 6250, inStock: false })');
assert.equal(get('PRODUCTS_DATA["com-900-485"].numericPrice'),6250);
assert.equal(get('PRODUCTS_DATA["com-900-485"].inStock'),false);
assert.equal(get('CartManager.getCart()[0].price'),6250);
assert.equal(get('CartManager.getSubtotal()'),62500);
assert.equal(get('CartManager.getCart()[0].inStock'),false);
get('CartManager.addItem(PRODUCTS_DATA["com-900-485"], 10)');
assert.equal(get('CartManager.getCart()[0].qty'),10,'blocked when out of stock');
const ov=JSON.parse(storage.get('astelkom_catalog_overrides'));
assert.deepEqual(ov['com-900-485'],{price:6250,inStock:false});
// LocalStorage edits persist across independent page loads; malformed overrides fall back.
const reload=vm.createContext({localStorage,document});
vm.runInContext(fs.readFileSync(path.join(root,'js/products-data.js'),'utf8'),reload);
assert.equal(vm.runInContext('PRODUCTS_DATA["com-900-485"].numericPrice',reload),6250);
assert.equal(vm.runInContext('PRODUCTS_DATA["com-900-485"].inStock',reload),false);
storage.set('astelkom_catalog_overrides','{"com-900-485":{"price":"-1", "inStock":"false"}}');
get('CatalogManager.applyOverrides()');
assert.equal(get('PRODUCTS_DATA["com-900-485"].numericPrice'),4300);
assert.equal(get('PRODUCTS_DATA["com-900-485"].inStock'),true);
storage.set('astelkom_catalog_overrides','malformed-json');
get('CatalogManager.applyOverrides()');
assert.equal(get('PRODUCTS_DATA["com-900-485"].numericPrice'),4300);
console.log('PASS: admin catalog overrides, cart repricing, stock enforcement, persistence');
