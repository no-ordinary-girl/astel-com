#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/admin-validation.js'), 'utf8');
const adminSrc = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
const listeners = new Map();
const emitted = [];
const doc = {
  readyState: 'loading',
  addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); },
  dispatchEvent(event) { emitted.push(event.type); },
  createElement() { return { setAttribute() {}, remove() {} }; },
};
class CustomEvent { constructor(type) { this.type = type; } }
const sandbox = { document: doc, CustomEvent, module: {exports: {}} };
vm.runInNewContext(src, sandbox);
const v = sandbox.module.exports;
function field(name, type = 'text') {
  return { name, type, tagName: 'INPUT', validity: { valid: false, valueMissing: true }, hasAttribute() { return false; },
    getAttribute() { return null; }, setAttribute() {}, removeAttribute() {},
    classList: {add(){}, remove(){}},
    insertAdjacentElement(which, node){ this.errorNode = node; },
    focus(){ this.focused = true; }, scrollIntoView(){}, closest(){ return null; }};
}
const id = field('id');
const price = field('price', 'number');
const categoryEn = field('en');
const productTitle = field('title');
assert.match(v.messageFor(id), /ID: 3–70 символів/);
assert.match(v.messageFor(price), /цілу ціну від 1/);
assert.equal(v.messageFor(categoryEn), 'Перекладіть назву категорії англійською.');
assert.equal(v.messageFor(productTitle), 'Вкажіть назву товару українською.');
assert.equal(v.messageFor(field('')), 'Заповніть це поле.');
const form = {matches(selector){return selector==='form';}, querySelectorAll(){ return [id, price]; }};
let prevented = false;
listeners.get('submit')[0]({ target: form, preventDefault(){prevented = true;}, stopImmediatePropagation(){} });
assert.equal(prevented, true);
assert.match(id.errorNode.textContent, /ID: 3–70 символів/);
assert.match(price.errorNode.textContent, /цілу ціну від 1/);
assert.deepEqual(emitted, ['astel:admin-validation-failed']);
assert.match(adminSrc, /addEventListener\("astel:admin-validation-failed"/);
assert.equal((adminSrc.match(/showUndoToast\("Заповніть пропущені поля!", null\)/g) || []).length, 4);
assert.doesNotMatch(adminSrc, /showUndoToast\("Заповніть пропущені поля", null\)/);
console.log('PASS: field-specific inline messages, one generic required-fields toast');
