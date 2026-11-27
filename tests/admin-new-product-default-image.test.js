#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const db = new Map();
const localStorage = {
  getItem: (key) => db.get(key) ?? null,
  setItem: (key, value) => db.set(key, value),
  removeItem: (key) => db.delete(key),
};
const source = fs.readFileSync(path.join(root, 'js/products-data.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const ctx = vm.createContext({ localStorage });
const run = (js) => vm.runInContext(js, ctx);
vm.runInContext(source, ctx);
const data = {
  id: 'modem-without-photo',
  title: 'Модем без фотографії',
  titleEn: 'Modem without a photo',
  category: 'gsm',
  saleTermsCode: 'wholesale',
  price: '5000',
  inStock: true,
  images: [],
};
const DEFAULT = 'assets/images/default.png';
assert.equal(run('CatalogManager.DEFAULT_PRODUCT_IMAGE'), DEFAULT);
assert.equal(run(`CatalogManager.validImageSource(${JSON.stringify(DEFAULT)})`), true);
run(`CatalogManager.addProduct(${JSON.stringify(data)})`);
assert.equal(run('PRODUCTS_DATA["modem-without-photo"].image'), DEFAULT);
assert.deepEqual(Array.from(run('PRODUCTS_DATA["modem-without-photo"].images')), [DEFAULT]);
assert.equal(run('CatalogManager.getStorefrontProduct("modem-without-photo").images[0]'), DEFAULT);
const persisted = JSON.parse(db.get('astelkom_catalog_custom_products'));
assert.deepEqual(persisted['modem-without-photo'].images, [DEFAULT]);
const reload = vm.createContext({ localStorage });
vm.runInContext(source, reload);
assert.equal(vm.runInContext('PRODUCTS_DATA["modem-without-photo"].image', reload), DEFAULT);
run(`CatalogManager.updateProduct('modem-without-photo', {images:['assets/images/items/new-modem.png']})`);
assert.equal(run('PRODUCTS_DATA["modem-without-photo"].image'), 'assets/images/items/new-modem.png');
assert.throws(() => run(`CatalogManager.addProduct(${JSON.stringify({...data,id:'modem-bad-photo',images:['javascript:alert(1)']})})`), /коректні фото/);
assert.ok(admin.includes('src !== CatalogManager.DEFAULT_PRODUCT_IMAGE'), 'first genuine upload must replace the placeholder');
assert.ok(!admin.includes('throw new Error("Додайте принаймні одну фотографію")'), 'photos must be optional on creation');
console.log('PASS: products without photos receive default.png; real upload replaces placeholder; persistence works');
