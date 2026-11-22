#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const storage = new Map();
const localStorage = {
  getItem(k) { return storage.get(k) ?? null; },
  setItem(k,v) { storage.set(k,v); },
  removeItem(k) { storage.delete(k); },
};
const document = {addEventListener(){},querySelectorAll(){return []}};
function fresh() {
  const context = vm.createContext({localStorage,document});
  vm.runInContext(fs.readFileSync(path.join(root,'js/products-data.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/cart.js'),'utf8'),context);
  vm.runInContext('CartManager.showToast=()=>{};',context);
  return (expr) => vm.runInContext(expr,context);
}
let run=fresh();
assert.equal(run('PRODUCTS_DATA["com-900-485"].isVisible'),true);
assert.equal(run('CatalogManager.getStorefrontProducts().length'),15);
assert.equal(run('CatalogManager.getStorefrontProduct("com-900-485").id'),'com-900-485');
run('CartManager.addItem(PRODUCTS_DATA["com-900-485"],10)');
assert.equal(run('CartManager.getCart()[0].inStock'),true);
run('CatalogManager.updateProduct("com-900-485",{isVisible:false})');
assert.equal(run('PRODUCTS_DATA["com-900-485"].inStock'),true,'visibility must not change stock');
assert.equal(run('PRODUCTS_DATA["com-900-485"].isVisible'),false,'hidden item remains in admin dataset');
assert.equal(run('CatalogManager.getStorefrontProducts().length'),14);
assert.equal(run('CatalogManager.getStorefrontProduct("com-900-485")'),null);
assert.equal(run('CartManager.getCart()[0].inStock'),false,'hidden item in saved cart cannot be checked out');
run('CartManager.addItem(PRODUCTS_DATA["com-900-485"],10)');
assert.equal(run('CartManager.getCart()[0].qty'),10,'hide blocks additional cart purchases');
assert.throws(()=>run('CatalogManager.updateProduct("com-900-485",{isVisible:"false"})'),/видимості/);
run=fresh();
assert.equal(run('PRODUCTS_DATA["com-900-485"].isVisible'),false,'visibility survives reload');
run('CatalogManager.updateProduct("com-900-485",{isVisible:true})');
assert.equal(run('CatalogManager.getStorefrontProducts().length'),15);
assert.equal(run('CartManager.getCart()[0].inStock'),true,'restored item is orderable again');
run('CatalogManager.addProduct({id:"temp-visible-test",title:"Тестовий товар",titleEn:"Test Product",category:"gsm",saleTermsCode:"retail",price:500,inStock:true,images:["assets/images/logo-main.svg"]})');
assert.equal(run('PRODUCTS_DATA["temp-visible-test"].isVisible'),true);
run('CatalogManager.updateProduct("temp-visible-test",{isVisible:false})');
assert.equal(run('CatalogManager.getStorefrontProduct("temp-visible-test")'),null);
run=fresh();
assert.equal(run('PRODUCTS_DATA["temp-visible-test"].isVisible'),false);
const admin=fs.readFileSync(path.join(root,'js/admin.js'),'utf8');
const catalog=fs.readFileSync(path.join(root,'js/products-catalog.js'),'utf8');
const docs=['docs.html','en/docs.html'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
const details=['product.html','en/product.html'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
assert.match(admin,/data-toggle-product-visibility/);
assert.match(admin,/confirmAdminDelete\(\{/);
assert.match(admin,/Приховати товар\?/);
assert.match(admin,/Показати товар\?/);
assert.match(catalog,/isVisible !== false/);
for(const d of docs) assert.match(d,/item\.isVisible !== false/);
for(const d of details) assert.match(d,/CatalogManager\.getStorefrontProduct\(productId\)/);
console.log('PASS: admin hide/show, confirmation, catalog/detail/docs exclusion, cart protection, persistence');
